import logging
import re
from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

class BaseAIProvider:
    """Base class for all AI/Classification providers to ensure uniform interface."""
    def suggest_category(self, title: str, categories: list[str]) -> str | None:
        raise NotImplementedError("Subclasses must implement suggest_category")


class GeminiProvider(BaseAIProvider):
    """Specific provider for initializing Gemini models via LangChain."""
    def __init__(self, model_name: str, api_key: str | None, **kwargs):
        self._initialized = False
        self.llm = None
        self.provider_name = "google_genai"
        self.system_instruction = (
            "You are an expense categorization assistant. Your sole task is to map an expense title "
            "to one of the exact categories provided in the allowed list. Return ONLY the exact category "
            "name from the list, with no extra text, explanations, or punctuation."
        )

        if api_key:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=api_key,
                    temperature=kwargs.get("temperature", 0.1),
                    **kwargs
                )
                self._initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize GeminiProvider: {e}")

    def suggest_category(self, title: str, categories: list[str]) -> str | None:
        if not self._initialized or not self.llm:
            logger.warning(f"GeminiProvider called but not properly initialized.")
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
            logger.warning(f"GeminiProvider returned '{suggested}' which is not in the allowed list.")
            return None
        except Exception as e:
            logger.error(f"GeminiProvider generation error: {e}")
            raise e  # Raise to trigger fallback chain

import requests

class HuggingFaceAPIProvider(BaseAIProvider):
    """Lightweight HTTP API Provider to bypass transformers/OOM crashes on AWS."""
    def __init__(self, model_name: str, api_key: str | None, **kwargs):
        self.provider_name = "huggingface"
        self.model_name = model_name
        self.api_url = "https://router.huggingface.co/v1/chat/completions"
        self.headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        self.api_key = api_key
        self.system_instruction = (
            "You are an expense categorization assistant. Your sole task is to map an expense title "
            "to one of the exact categories provided in the allowed list. Return ONLY the exact category "
            "name from the list, with no extra text, explanations, or punctuation."
        )

    def suggest_category(self, title: str, categories: list[str]) -> str | None:
        if not self.api_key:
            return None
            
        category_options = [c.strip() for c in categories if c.strip()]
        if not category_options:
            return None

        prompt = f"Allowed Categories: {', '.join(category_options)}\nExpense Title: \"{title}\"\nWhich allowed category fits best? Return exactly one name from the list."
        
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": self.system_instruction},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 20,
            "temperature": 0.1
        }
        
        try:
            response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "choices" in data and len(data["choices"]) > 0:
                suggested = data["choices"][0]["message"]["content"].strip()
            else:
                return None
            
            for cat in category_options:
                if cat.lower() == suggested.lower():
                    return cat
            return None
        except Exception as e:
            logger.error(f"HuggingFaceAPIProvider error: {e}")
            raise e


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
