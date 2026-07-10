import logging
import hashlib
import datetime
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pgvector.django import CosineDistance
from django.core.cache import cache
from django.conf import settings
from django.db import models
from .providers import GeminiProvider, LocalRulesProvider, HuggingFaceAPIProvider
from apps.expenses.models import Expense

logger = logging.getLogger(__name__)


class AIService:
    """Orchestrates AI providers with a fail-secure fallback chain and Redis caching."""

    def __init__(self):
        # Instantiate providers. Reused across requests to keep connection pools active.
        self.providers = []

        # Primary: Local Rules (Zero-latency, 100% accurate for common expenses)
        self.providers.append(LocalRulesProvider())

        # Secondary: HuggingFace Mistral/Qwen (Free, fast inference without restrictive daily limits)
        hf_api_key = getattr(settings, "HUGGINGFACE_API_KEY", None)
        self.providers.append(
            HuggingFaceAPIProvider(
                model_name="Qwen/Qwen2.5-7B-Instruct",
                api_key=hf_api_key
            )
        )

        # Fallback/Advanced: Gemini (For complex, unstructured, or rare expenses)
        gemini_api_key = getattr(settings, "GEMINI_API_KEY", None)
        self.providers.append(
            GeminiProvider(
                model_name="gemini-2.5-flash",
                api_key=gemini_api_key,
            )
        )

    def get_category_suggestion(self, title: str, categories: list[str]) -> dict | None:
        """
        Suggests a category for the given expense title from a list of allowed categories.
        Uses Redis caching to avoid calling LLMs repeatedly for the same title/categories.
        """
        if not title or not categories:
            return None

        # Clean strings
        title = title.strip()
        categories = sorted([c.strip() for c in categories if c.strip()])

        # Generate a unique cache key based on title and current category list
        cat_hash = hashlib.md5(",".join(categories).encode("utf-8")).hexdigest()
        sanitized_title = "".join(
            ch for ch in title.lower() if ch.isalnum() or ch.isspace()
        ).replace(" ", "_")
        cache_key = f"ai_cat_suggest:{cat_hash}:{sanitized_title}"

        # 1. Try to fetch from Redis Cache
        cached_val = cache.get(cache_key)
        if cached_val and isinstance(cached_val, dict):
            logger.info(
                f"AI Category Suggestion Cache Hit: '{title}' -> '{cached_val.get('suggestion')}' (source: {cached_val.get('source')})"
            )
            return {
                "suggestion": cached_val.get("suggestion"),
                "source": cached_val.get("source"),
                "cached": True,
            }

        # 2. Iterate through providers in order of preference (Chain of Responsibility)
        suggested_category = None
        source = "none"
        for provider in self.providers:
            try:
                suggested_category = provider.suggest_category(title, categories)
                if suggested_category:
                    if hasattr(provider, "provider_name"):
                        # Map google_genai to gemini for backward compatibility with frontend/DB
                        source = (
                            "gemini"
                            if provider.provider_name == "google_genai"
                            else provider.provider_name
                        )
                    else:
                        source_map = {"LocalRulesProvider": "local_rules"}
                        source = source_map.get(provider.__class__.__name__, "unknown")

                    provider_identifier = getattr(
                        provider, "provider_name", provider.__class__.__name__
                    )

                    # Cache the successful result for 7 days
                    cache.set(
                        cache_key,
                        {"suggestion": suggested_category, "source": source},
                        timeout=60 * 60 * 24 * 7,
                    )
                    logger.info(
                        f"Successfully suggested '{suggested_category}' for '{title}' using {provider_identifier}"
                    )
                    break
            except Exception as e:
                provider_identifier = getattr(
                    provider, "provider_name", provider.__class__.__name__
                )
                logger.warning(
                    f"{provider_identifier} failed for query '{title}': {e}. Trying fallback provider..."
                )

        if suggested_category:
            return {"suggestion": suggested_category, "source": source, "cached": False}
        return None


class ExpenseParticipantSchema(BaseModel):
    user: int
    selected: bool
    percentage: Optional[str] = None
    exact_amount: Optional[str] = None


class ExpensePayerSchema(BaseModel):
    user: int
    amount: str
    selected: bool


class ExtractedExpenseSchema(BaseModel):
    title: str
    category_id: Optional[int] = None
    expense_date: str
    split_type: str
    payers: Dict[str, ExpensePayerSchema]
    participants: Dict[str, ExpenseParticipantSchema]


class ExtractedSettlementSchema(BaseModel):
    paid_by: int
    paid_to: int
    amount: str
    description: Optional[str] = None
    settled_at: str


class SearchParamsSchema(BaseModel):
    needs_search: bool = Field(
        description="True if the user is asking about past expenses or history. False if they are just chatting or creating a new expense."
    )
    semantic_query: Optional[str] = Field(
        description="The core topic to search for, e.g., 'food', 'travel'. Empty if asking for general recent transactions."
    )
    limit: int = Field(
        description="Number of transactions to fetch. Default is 10. Max is 50.",
        default=10,
    )
    start_date: Optional[str] = Field(
        description="ISO date (YYYY-MM-DD) to start searching from, if applicable.",
        default=None,
    )
    end_date: Optional[str] = Field(
        description="ISO date (YYYY-MM-DD) to end searching at, if applicable.",
        default=None,
    )


class ChatResponseSchema(BaseModel):
    reply: str = Field(
        description="A friendly, conversational reply to the user. Acknowledge their request, ask for clarification if needed, or confirm the details of the expense/settlement you've prepared."
    )
    expense_data: Optional[ExtractedExpenseSchema] = Field(
        description="If the user asks to add or modify an expense, provide the structured data here. Otherwise, leave null.",
        default=None,
    )
    settlement_data: Optional[ExtractedSettlementSchema] = Field(
        description="If the user asks to add a payment/settlement between two users, provide the structured data here. Otherwise, leave null.",
        default=None,
    )


class DashboardWidgetSchema(BaseModel):
    id: str = Field(description="Unique identifier for the widget (e.g. 'monthly_spending_bar').")
    title: str = Field(description="Display title of the widget.")
    type: str = Field(description="One of: 'bar', 'pie', 'donut', 'table', 'summary', 'list'.")
    column_span: int = Field(description="How many columns this widget should span in a 3-column grid (1, 2, or 3).")
    data: list[Dict[str, Any]] = Field(
        description="The data payload. For charts: [{'name': 'Category', 'value': 100}]. For tables: [{'col1': 'val', 'col2': 'val'}]."
    )
    description: Optional[str] = Field(
        description="Markdown text to display for a summary widget or a subtitle for charts.",
        default=None
    )


class DashboardResponseSchema(BaseModel):
    title: str = Field(description="The main title of the generated dashboard.")
    widgets: list[DashboardWidgetSchema] = Field(
        description="List of widgets that make up the dashboard layout."
    )


# Global singleton instance to reuse across requests
ai_service = AIService()


# We attach chat_with_agent to AIService
def _chat_with_agent(
    self,
    user_message: str,
    current_user_id: int,
    group_members_info: list,
    history: list,
    group_id: int,
) -> dict:
    """
    Handles natural language chat and expense extraction using Gemini.
    `history` should be a list of dicts: [{'role': 'user'|'assistant', 'content': '...'}, ...]
    """
    gemini_provider = next((p for p in self.providers if getattr(p, "provider_name", "") == "google_genai"), None)
    hf_provider = next((p for p in self.providers if getattr(p, "provider_name", "") == "huggingface"), None)

    llm_providers = [p for p in [gemini_provider, hf_provider] if p and getattr(p, "llm", None)]

    if not llm_providers:
        return {
            "reply": "Sorry, my AI capabilities are currently offline (API key missing).",
            "expense_data": None,
            "settlement_data": None,
        }

    today = datetime.date.today().isoformat()
    members_str = ", ".join([f"{m['name']} (ID: {m['id']})" for m in group_members_info])

    @tool
    def search_group_expenses(query: str = "", date_from: str = "", date_to: str = "", limit: int = 10, sort_order: str = "recent") -> str:
        """Searches the group's past expenses in the database.

        Args:
            query: Semantic search query (e.g. 'food', 'travel'). Leave empty if just looking for recent expenses.
            date_from: Start date in YYYY-MM-DD format.
            date_to: End date in YYYY-MM-DD format.
            limit: Maximum number of expenses to return.
            sort_order: 'recent' for newest first, 'oldest' for oldest first, 'relevance' to sort by semantic match to the query.
        """
        qs = Expense.objects.filter(group_id=group_id)
        if date_from:
            try: qs = qs.filter(expense_date__gte=datetime.datetime.strptime(date_from, "%Y-%m-%d").date())
            except ValueError: pass
        if date_to:
            try: qs = qs.filter(expense_date__lte=datetime.datetime.strptime(date_to, "%Y-%m-%d").date())
            except ValueError: pass

        if query and sort_order == "relevance" and getattr(gemini_provider, "api_key", None):
            try:
                embeddings_model = GoogleGenerativeAIEmbeddings(
                    model="models/gemini-embedding-001",
                    google_api_key=gemini_provider.api_key,
                    output_dimensionality=768,
                )
                query_vector = embeddings_model.embed_query(query)
                qs = qs.filter(embedding__isnull=False).order_by(CosineDistance("embedding", query_vector))
            except Exception as e:
                logger.error(f"Vector search failed: {e}")
                qs = qs.order_by("-created_at")
        elif sort_order == "oldest":
            qs = qs.order_by("expense_date", "created_at")
        else:
            qs = qs.order_by("-expense_date", "-created_at")

        relevant_expenses = qs[:limit]
        expenses_ctx = []
        for exp in relevant_expenses:
            payer_names = [p.user.full_name for p in exp.payers.all()]
            participant_names = [p.user.full_name for p in exp.participants.all()]
            category_name = exp.category.name if exp.category else "Uncategorized"
            title = exp.title if exp.title and exp.title.lower() != "null" else "Unnamed Expense"
            expenses_ctx.append(
                f"- Date: {exp.expense_date.strftime('%Y-%m-%d')}\n  Title: '{title}'\n  Amount: {exp.total_amount} {exp.currency}\n  Category: {category_name}\n  Paid By: {', '.join(payer_names)}\n  Split: {exp.split_type} among {', '.join(participant_names)}"
            )
        return "\n\n".join(expenses_ctx) if expenses_ctx else "No matching expenses found."

    @tool
    def get_group_balances() -> str:
        """Calculates and returns the current balance of every member in this group.

        Use this tool whenever the user asks about:
        - Who owes the most / who is owed the most
        - What is my balance?
        - How much does [name] owe?
        - What are the group balances?
        - Who needs to settle up?
        - Simplified settlement / who should pay whom

        Returns a plain-text summary of each member's net balance and simplified settlement steps.
        """
        from apps.expenses.services import calculate_group_balances, simplify_balances
        from apps.groups.models import Group as GroupModel
        try:
            group_obj = GroupModel.objects.get(id=group_id)
            raw_balances = calculate_group_balances(group=group_obj)
            simplified = simplify_balances(raw_balances)

            lines = ["=== Current Group Balances ==="]
            for b in sorted(raw_balances.values(), key=lambda x: x["balance"], reverse=True):
                balance = b["balance"]
                if balance > 0:
                    lines.append(f"  {b['name']}: is OWED ₹{abs(balance):.2f} (net creditor)")
                elif balance < 0:
                    lines.append(f"  {b['name']}: OWES ₹{abs(balance):.2f} (net debtor)")
                else:
                    lines.append(f"  {b['name']}: settled up (balance = ₹0.00)")

            lines.append("")
            lines.append("=== Simplified Settlements (who pays whom) ===")
            if simplified:
                for txn in simplified:
                    lines.append(f"  {txn['from_user_info']['name']} → {txn['to_user_info']['name']}: ₹{txn['amount']}")
            else:
                lines.append("  Everyone is settled up! No payments needed.")
            return "\n".join(lines)
        except Exception as e:
            logger.error(f"get_group_balances failed: {e}")
            return "Could not calculate balances at this time."

    system_prompt = f"""You are Expanzo AI, a helpful financial assistant for a group expense tracker.
Your job is to chat with the user, answer questions about their group's history, and help them record new expenses based on natural language.
Today's date is {today}.
The current user's ID is {current_user_id}. 
The members in this group are: {members_str}. Use this to map names (like 'Jatin', 'me', 'I') to their respective IDs.

You have access to the following tools:
1. `search_group_expenses` — to look up past expense transactions. Use for questions about past spending, history, totals, or categories.
   When searching by topic (e.g., 'food', 'travel'), you MUST pass sort_order='relevance'.
2. `get_group_balances` — to get the current net balance of every group member and the simplified list of who needs to pay whom.
   Use this IMMEDIATELY whenever the user asks about balances, debts, who owes what, or who needs to settle up.

After gathering information (or if no information is needed), you MUST provide your final response matching the expected schema.

When the user asks for a list, summary, or details of multiple transactions (like "list first 5 transactions", "what did we spend on", "show details"), you MUST format your reply using a structured Markdown table (a "detail sheet").
Example table format:
| Date | Title | Category | Amount | Paid By | Split |
|---|---|---|---|---|---|
| 2026-07-02 | Dinner | Food | ₹500.00 | Jatin | equal |

When a user explicitly asks to split a NEW expense, you MUST provide `expense_data` populated with the correct split calculations.
Rules for `expense_data`:
- `split_type` must be 'equal', 'exact', or 'percentage'.
- `payers` is a dict where keys are user IDs (as strings) and values are ExpensePayerSchema. Only include people who paid.
- `participants` is a dict where keys are user IDs (as strings) and values are ExpenseParticipantSchema. Include all users involved in the split (set selected=True).
- If split_type is 'equal', you do not need to calculate exact_amount, just set selected=True.
- Make sure total payers amount equals total participants owed (if exact).

When a user explicitly asks to create a NEW payment or settlement (e.g. "Jatin paid Gaurang 500"), you MUST provide `settlement_data` populated with the correct payment details.
Rules for `settlement_data`:
- `paid_by` and `paid_to` MUST be integer IDs of the members.
- `settled_at` should be today's date ({today}) unless specified otherwise.
- Never populate both `expense_data` and `settlement_data` in the same response.

CRITICAL RULE: DO NOT hallucinate or create fake expenses/settlements! If the user is asking an analytical question (e.g., "who owes the most", "show me our expenses", "summarize spending"), you MUST leave both `expense_data` and `settlement_data` as null. Only populate them if the user explicitly wants to ADD a transaction.

CRITICAL RULE 2: When you use a tool to get information (like balances or expenses), you MUST include the relevant details, numbers, and lists directly in your `reply`. Do not just say "I have calculated it" or "Here is the summary" without actually providing the data in the text!
"""

    base_messages = [SystemMessage(content=system_prompt)]
    for msg in history:
        if msg["role"] == "user":
            base_messages.append(HumanMessage(content=msg["content"]))
        else:
            base_messages.append(AIMessage(content=msg["content"]))
    base_messages.append(HumanMessage(content=user_message))

    last_error = None
    for provider in llm_providers:
        messages = list(base_messages)
        try:
            llm_with_tools = provider.llm.bind_tools([search_group_expenses, get_group_balances])
            
            # Agent loop: allow up to 5 tool calls
            for _ in range(5):
                response = llm_with_tools.invoke(messages)
                messages.append(response)

                if not response.tool_calls:
                    break

                for tool_call in response.tool_calls:
                    if tool_call["name"] == "search_group_expenses":
                        tool_result = search_group_expenses.invoke(tool_call["args"])
                    elif tool_call["name"] == "get_group_balances":
                        tool_result = get_group_balances.invoke(tool_call["args"])
                    else:
                        tool_result = "Unknown tool."
                        
                    messages.append(ToolMessage(
                        tool_call_id=tool_call["id"],
                        name=tool_call["name"],
                        content=str(tool_result),
                    ))

            if provider.provider_name == "google_genai":
                structured_llm = provider.llm.with_structured_output(ChatResponseSchema)
                final_response = structured_llm.invoke(messages)
                return final_response.model_dump()
            else:
                # HF fallback manual JSON parsing
                schema_prompt = (
                    "Please return your final answer strictly as a valid JSON object matching this structure exactly:\n"
                    "{\n"
                    '  "reply": "your text reply here",\n'
                    '  "expense_data": null,\n'
                    '  "settlement_data": null\n'
                    "}\n"
                    "Do not include markdown blocks or any other text. Only valid JSON."
                )
                messages.append(HumanMessage(content=schema_prompt))
                raw_response = provider.llm.invoke(messages)
                
                import json
                import re
                json_match = re.search(r'\{.*\}', raw_response.content, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    final_response = ChatResponseSchema(**parsed)
                    return final_response.model_dump()
                else:
                    raise ValueError("Failed to extract JSON from HF response.")
                    
        except Exception as e:
            provider_identifier = getattr(provider, "provider_name", provider.__class__.__name__)
            logger.error(f"{provider_identifier} chat agent failed: {e}")
            last_error = e
            continue

    logger.error("All AI providers failed for chat_with_agent.")
    if last_error and "RESOURCE_EXHAUSTED" in str(last_error):
        reply_msg = "The AI service is currently experiencing high demand due to rate limits. Please wait a moment and try again."
    else:
        reply_msg = "I'm having a little trouble connecting to the AI services right now. Please try again later."
        
    return {
        "reply": reply_msg,
        "expense_data": None,
        "settlement_data": None,
    }


# Attach method dynamically to avoid large file edits
AIService.chat_with_agent = _chat_with_agent


def _analyze_dashboard(self, prompt: str, current_user_id: int) -> dict:
    """
    Generates a structured dynamic dashboard layout based on the user's prompt
    and their recent expenses across all groups.
    """
    gemini_provider = next(
        (p for p in self.providers if getattr(p, "provider_name", "") == "google_genai"),
        None,
    )

    if not gemini_provider or not gemini_provider.llm:
        return {"title": "Error", "widgets": []}

    # Fetch user's expenses (payer or participant)
    expenses = Expense.objects.filter(
        models.Q(payers__user_id=current_user_id) | models.Q(participants__user_id=current_user_id)
    ).select_related("category", "group").order_by("-expense_date").distinct()[:150]

    # Format expenses for context
    expense_lines = []
    for exp in expenses:
        cat = exp.category.name if exp.category else "Uncategorized"
        expense_lines.append(
            f"[{exp.expense_date.strftime('%Y-%m-%d')}] {exp.title} | Group: {exp.group.name} | Category: {cat} | Total Amount: {exp.total_amount}"
        )
    
    context_str = "\n".join(expense_lines) if expense_lines else "No recent expenses found."

    system_prompt = (
        "You are an expert financial analyst. Your task is to generate a dynamic financial dashboard "
        "based on the user's prompt and their recent expense data. "
        "The dashboard should consist of widgets (bar, pie, donut, table, summary, list). "
        "IMPORTANT: You should aim to provide a highly comprehensive dashboard with at least 4 to 6 widgets "
        "to give a complete financial picture, breaking down the data in multiple ways (e.g. by category, by time, by person, plus lists of top items). "
        "IMPORTANT: For any list of transactions or complex records (like 'Top 5 transactions'), ALWAYS use the 'table' widget type instead of 'list'. "
        "CRITICAL INSTRUCTION: All currency amounts MUST be formatted with the Indian Rupee symbol (₹). YOU ARE STRICTLY FORBIDDEN FROM USING THE DOLLAR SIGN ($). "
        "Example summary: 'Your total spending is ₹69,720.00. The highest expense was ₹5000.' "
        "For charts, provide data in an array of objects like {'name': 'Category', 'value': 100}. "
        "For tables, provide an array of objects with proper keys like {'Date': '2023-01-01', 'Description': 'Dinner', 'Amount': '₹50'}. "
        f"\n\nHere is the user's recent expense data (last 150 transactions across all groups):\n{context_str}"
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt)
    ]

    try:
        structured_llm = gemini_provider.llm.with_structured_output(DashboardResponseSchema)
        final_response: DashboardResponseSchema = structured_llm.invoke(messages)
        return final_response.model_dump()
    except Exception as e:
        logger.error(f"Dashboard agent failed: {e}")
        return {"title": "Failed to generate dashboard", "widgets": []}

AIService.analyze_dashboard = _analyze_dashboard

