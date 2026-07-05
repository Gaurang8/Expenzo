import logging
import re
from django.conf import settings
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

class BaseAIProvider:
    """Base class for all AI/Classification providers to ensure uniform interface."""
    def suggest_category(self, title: str, categories: list[str]) -> str | None:
        raise NotImplementedError("Subclasses must implement suggest_category")


class LangChainProvider(BaseAIProvider):
    """Generalized provider for dynamically initializing models via LangChain."""
    def __init__(self, model_name: str, model_provider: str, api_key: str | None, **kwargs):
        self._initialized = False
        self.llm = None
        self.provider_name = model_provider
        self.system_instruction = (
            "You are an expense categorization assistant. Your sole task is to map an expense title "
            "to one of the exact categories provided in the allowed list. Return ONLY the exact category "
            "name from the list, with no extra text, explanations, or punctuation."
        )

        if api_key:
            try:
                if model_provider == "huggingface":
                    from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
                    # HuggingFace remote endpoints require explicit llm instantiation to avoid trying to load massive local PyTorch models
                    endpoint = HuggingFaceEndpoint(
                        repo_id=model_name,
                        huggingfacehub_api_token=api_key,
                        temperature=kwargs.get("temperature", 0.1),
                        max_new_tokens=kwargs.get("max_new_tokens", 20),
                        return_full_text=False,
                        timeout=kwargs.get("timeout", 5)
                    )
                    self.llm = ChatHuggingFace(llm=endpoint)
                else:
                    # init_chat_model allows dynamically instantiating the right ChatModel
                    # based on the model_provider string (e.g. 'google_genai', 'openai', 'anthropic')
                    self.llm = init_chat_model(
                        model_name,
                        model_provider=model_provider,
                        api_key=api_key,
                        temperature=kwargs.get("temperature", 0.1),
                        **kwargs
                    )
                self._initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize {model_provider} in LangChainProvider: {e}")

    def suggest_category(self, title: str, categories: list[str]) -> str | None:
        if not self._initialized or not self.llm:
            logger.warning(f"LangChainProvider({self.provider_name}) called but not properly initialized.")
            return None

        # Clean categories list
        category_options = [c.strip() for c in categories if c.strip()]
        if not category_options:
            return None

        prompt = f"""
Allowed Categories: {', '.join(category_options)}
Expense Title: "{title}"

Which allowed category fits best? Return exactly one name from the list.
"""
        try:
            messages = [
                SystemMessage(content=self.system_instruction),
                HumanMessage(content=prompt)
            ]
            response = self.llm.invoke(messages)
            suggested = response.content.strip()
            
            # Verify the suggested category exactly matches one in the list (case-insensitive)
            for cat in category_options:
                if cat.lower() == suggested.lower():
                    return cat
            logger.warning(f"LangChainProvider({self.provider_name}) returned '{suggested}' which is not in the allowed list.")
            return None
        except Exception as e:
            logger.error(f"LangChainProvider({self.provider_name}) generation error: {e}")
            raise e  # Raise to trigger fallback chain


class LocalRulesProvider(BaseAIProvider):
    """Reliable, zero-cost keyword-matching classification fallback."""
    def __init__(self):
        # Default rule mapping matching keywords to category concepts
        self.rules = {
            "food": [r"pizza", r"burger", r"restaurant", r"cafe", r"starbucks", r"food", r"dinner", r"lunch", r"breakfast", r"dominos", r"zomato", r"swiggy", r"grocery", r"groceries", r"supermarket", r"snack", r"chai", r"maggi", r"tea", r"coffee"],
            "transport": [r"uber", r"ola", r"rapido", r"taxi", r"cab", r"metro", r"auto", r"fuel", r"petrol", r"diesel", r"flight", r"train", r"travel", r"bus", r"ticket"],
            "utilities": [r"electricity", r"water", r"wifi", r"internet", r"recharge", r"broadband", r"gas", r"electricity bill", r"bill", r"phone", r"mobile"],
            "entertainment": [r"movie", r"netflix", r"spotify", r"prime", r"hotstar", r"concert", r"game", r"bowling", r"club", r"party", r"beer", r"alcohol", r"outing"],
            "shopping": [r"amazon", r"flipkart", r"clothes", r"shoes", r"gift", r"myntra", r"gadget", r"laptop", r"mobile phone"],
            "medical": [r"medicine", r"hospital", r"doctor", r"pharmacy", r"health", r"clinic", r"medical"],
        }

    def suggest_category(self, title: str, categories: list[str]) -> str | None:
        title_lower = title.lower()

        # Build list of category names mapped to lowercase for matching
        cat_map = {c.lower(): c for c in categories}

        # Step 1: Match direct category name matches
        for cat_lower, original_name in cat_map.items():
            if cat_lower in title_lower:
                return original_name

        # Step 2: Match rule patterns
        for key, patterns in self.rules.items():
            for pattern in patterns:
                # Use \b to ensure we match whole words only (e.g. 'ola' won't match 'chocolate')
                if re.search(r'\b' + pattern + r'\b', title_lower):
                    # Find a category in the allowed list that corresponds to this rule key
                    # e.g., if key is 'food', look for 'food' or 'groceries' in allowed list
                    for cat_lower, original_name in cat_map.items():
                        if key in cat_lower or (key == "transport" and "travel" in cat_lower) or (key == "food" and "dining" in cat_lower):
                            return original_name

        return None
