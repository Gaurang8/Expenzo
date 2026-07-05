import logging
from celery import shared_task
from django.conf import settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings

logger = logging.getLogger(__name__)

@shared_task
def generate_expense_embedding(expense_id):
    """
    Generates a high-quality 'Deep Document' embedding for an expense and saves it to pgvector.
    """
    from apps.expenses.models import Expense
    
    try:
        expense = Expense.objects.select_related('group', 'created_by', 'category').prefetch_related('payers__user', 'participants__user').get(id=expense_id)
    except Expense.DoesNotExist:
        logger.warning(f"Expense {expense_id} not found for embedding generation.")
        return

    # Construct the Deep Document
    category_name = expense.category.name if expense.category else "Uncategorized"
    
    deep_doc = f"Expense Title: {expense.title}\n"
    deep_doc += f"Category: {category_name}\n"
    deep_doc += f"Date: {expense.expense_date.strftime('%Y-%m-%d')}\n"
    deep_doc += f"Total Amount: ₹{expense.total_amount}\n"
    deep_doc += f"Split Type: {expense.split_type}\n"
    deep_doc += f"Created By: {expense.created_by.full_name}\n\n"
    
    deep_doc += "Payers (Who provided the money):\n"
    for payer in expense.payers.all():
        deep_doc += f"- {payer.user.full_name} paid ₹{payer.paid_amount}\n"
        
    deep_doc += "\nParticipants (Who consumed the value and owes money):\n"
    for participant in expense.participants.all():
        deep_doc += f"- {participant.user.full_name} owes ₹{participant.owed_amount}\n"
        
    logger.info(f"Generating embedding for expense {expense.id}: {expense.title}")
    
    # Initialize the Gemini Embeddings API
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        logger.error("GEMINI_API_KEY is missing. Cannot generate embeddings.")
        return
        
    embeddings_model = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=api_key,
        output_dimensionality=768
    )
    
    try:
        # Generate the 768-dimensional vector
        vector = embeddings_model.embed_query(deep_doc)
        
        # Save to DB
        expense.embedding = vector
        expense.save(update_fields=['embedding'])
        logger.info(f"Successfully saved embedding for expense {expense.id}")
        
    except Exception as e:
        logger.error(f"Failed to generate embedding for expense {expense.id}: {e}")
