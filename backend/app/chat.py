import os
import time
import chromadb
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.vectorstores import Chroma

from .models import Product, ForecastResult

# Setup ChromaDB client
CHROMA_PATH = "./chroma_db"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

def ingest_products_to_vector_db(db: Session):
    """
    Ingests all database products into ChromaDB for similarity searching.
    """
    products = db.query(Product).all()
    if not products:
        return
        
    try:
        # Get or create collection
        collection = chroma_client.get_or_create_collection(name="kirana_products")
        
        # Clear existing entries
        existing = collection.get()
        if existing and existing['ids']:
            collection.delete(ids=existing['ids'])
            
        ids = []
        documents = []
        metadatas = []
        
        for p in products:
            # Calculate 7-day forecast demand
            forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
            total_forecast = sum(f.forecasted_quantity for f in forecasts)
            
            doc_text = (
                f"Product SKU: {p.sku}. "
                f"Name: {p.name}. "
                f"Category: {p.category or 'General'}. "
                f"Price: Rs. {p.price}. "
                f"Current stock: {p.current_stock} {p.unit}. "
                f"Reorder status: {p.reorder_status}. "
                f"Forecasted demand for next 7 days: {total_forecast:.1f} {p.unit}."
            )
            ids.append(p.sku)
            documents.append(doc_text)
            metadatas.append({
                "sku": p.sku, 
                "name": p.name, 
                "status": p.reorder_status,
                "current_stock": p.current_stock,
                "price": p.price
            })
            
        if documents:
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
    except Exception as e:
        print(f"Error ingesting into ChromaDB: {e}")

def get_ai_response(db: Session, query: str) -> dict:
    """
    Processes a user query about inventory, forecasts, or risks in English, Telugu, or Hindi.
    Returns the response text and response time.
    """
    start_time = time.time()
    
    # Check if OpenAI API Key is configured
    api_key = os.environ.get("OPENAI_API_KEY")
    
    # 1. Fetch store statistics for context
    products = db.query(Product).all()
    critical_items = db.query(Product).filter(Product.reorder_status == "Critical").all()
    reorder_items = db.query(Product).filter(Product.reorder_status == "Reorder Soon").all()
    
    critical_names = [f"{p.name} (Stock: {p.current_stock} {p.unit})" for p in critical_items]
    reorder_names = [f"{p.name} (Stock: {p.current_stock} {p.unit})" for p in reorder_items]
    
    store_status = (
        f"Total SKU Count: {len(products)}\n"
        f"Critical Risk Items (Immediate action required): {', '.join(critical_names) if critical_names else 'None'}\n"
        f"Reorder Soon Items: {', '.join(reorder_names) if reorder_names else 'None'}\n"
    )

    if api_key and len(api_key.strip()) > 10:
        try:
            # Use LangChain + ChromaDB + OpenAI
            embeddings = OpenAIEmbeddings(openai_api_key=api_key)
            vector_store = Chroma(
                client=chroma_client,
                collection_name="kirana_products",
                embedding_function=embeddings
            )
            
            # Retrieve relevant products
            docs = vector_store.similarity_search(query, k=4)
            retrieved_context = "\n".join([doc.page_content for doc in docs])
            
            # LangChain Prompt Template
            prompt = PromptTemplate(
                template="""You are a helpful and smart Kirana Store AI Assistant. 
You help Indian grocery store owners manage their inventory, forecasting, and orders.
You understand English, Telugu, and Hindi. Always respond in the language or style of the user's query.
Keep answers concise, actionable, and very clear for a busy shopkeeper. Use bullet points where appropriate.

Here is the general store inventory status:
{store_status}

Here is detailed product information related to the query:
{retrieved_context}

User Query: {query}

Answer the query using the above information. Suggest reorder quantities where appropriate (e.g. recommend ordering the difference between 7-day forecast demand and current stock). 
If the user asks in Telugu, respond in clean, natural, and highly polite Telugu. If they ask in Hindi, answer in friendly Hindi. If they ask in English, answer in clear English.
""",
                input_variables=["store_status", "retrieved_context", "query"]
            )
            
            llm = ChatOpenAI(model="gpt-4o", openai_api_key=api_key, temperature=0.3)
            chain = prompt | llm | StrOutputParser()
            
            answer = chain.invoke({
                "store_status": store_status,
                "retrieved_context": retrieved_context,
                "query": query
            })
            
            response_time = (time.time() - start_time) * 1000
            return {"answer": answer, "response_time_ms": response_time}
            
        except Exception as e:
            print(f"Error during OpenAI execution: {e}. Falling back to rule-based model.")
            # Fall through to rule-based model
            
    # Rule-Based Fallback (Telugu/Hindi/English aware)
    answer = parse_rule_based_query(db, query, products, critical_items, reorder_items)
    
    response_time = (time.time() - start_time) * 1000
    return {"answer": answer, "response_time_ms": response_time}

def parse_rule_based_query(db: Session, query: str, products: list, critical_items: list, reorder_items: list) -> str:
    q = query.lower()
    
    # Identify if query is in Telugu based on character sets or key vocabularies
    is_telugu_query = any(k in q for k in ["తక్కువ", "అయిపో", "కొరత", "రిస్క్", "ఆర్డర్", "కొనాలి", "చేయాలి", "మంగాలి", "వారంలో", "ఈ వారం", "నేను"])
    
    # Check for critical / risk questions
    if any(k in q for k in ["critical", "risk", "danger", "खतरा", "कम", "shortage", "status", "తక్కువ", "అయిపో", "కొరత", "రిస్క్", "ప్రమాదం"]):
        if not critical_items and not reorder_items:
            if is_telugu_query:
                return "అన్ని ఉత్పత్తులు సురక్షితంగా ఉన్నాయి! ఏ ఐటెమ్స్ కూడా కొరతలో లేవు. (All SKUs are safe!)"
            return "All SKUs are safe! No items are currently at risk or critical. (सभी प्रोडक्ट्स सुरक्षित हैं!)"
            
        if is_telugu_query:
            res = "ఇక్కడ మీ కిరాణా స్టాక్ యొక్క రిస్క్ నివేదిక ఉంది:\n\n"
            if critical_items:
                res += "**🔴 అత్యంత కీలకమైన ఐటెమ్స్ (వెంటనే ఆర్డర్ చేయాలి):**\n"
                for p in critical_items:
                    forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
                    total_f = sum(f.forecasted_quantity for f in forecasts)
                    suggested = max(0.0, total_f - p.current_stock)
                    res += f"- **{p.name}**: ప్రస్తుతం ఉన్న స్టాక్ {p.current_stock} {p.unit} (7 రోజుల అంచనా డిమాండ్: {total_f:.1f} {p.unit}). మీరు **{suggested:.1f} {p.unit}** ఆర్డర్ చేయాలి.\n"
            
            if reorder_items:
                res += "\n**🟡 త్వరలో ఆర్డర్ చేయాల్సిన ఐటెమ్స్:**\n"
                for p in reorder_items:
                    forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
                    total_f = sum(f.forecasted_quantity for f in forecasts)
                    suggested = max(0.0, total_f - p.current_stock)
                    res += f"- **{p.name}**: ప్రస్తుతం ఉన్న స్టాక్ {p.current_stock} {p.unit} (7 రోజుల అంచనా డిమాండ్: {total_f:.1f} {p.unit}). **{suggested:.1f} {p.unit}** కొనాలని సిఫార్సు చేయబడింది.\n"
            return res
        else:
            res = "Here are the inventory risks:\n\n"
            if critical_items:
                res += "**🔴 Critical Items (Immediate Action Needed):**\n"
                for p in critical_items:
                    forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
                    total_f = sum(f.forecasted_quantity for f in forecasts)
                    suggested = max(0.0, total_f - p.current_stock)
                    res += f"- **{p.name}**: Stock is {p.current_stock} {p.unit} (7-day forecast: {total_f:.1f} {p.unit}). Order **{suggested:.1f} {p.unit}**.\n"
            
            if reorder_items:
                res += "\n**🟡 Reorder Soon Items:**\n"
                for p in reorder_items:
                    forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
                    total_f = sum(f.forecasted_quantity for f in forecasts)
                    suggested = max(0.0, total_f - p.current_stock)
                    res += f"- **{p.name}**: Stock is {p.current_stock} {p.unit} (7-day forecast: {total_f:.1f} {p.unit}). Suggest ordering **{suggested:.1f} {p.unit}**.\n"
            return res

    # Check for order / reorder advice questions
    if any(k in q for k in ["order", "reorder", "buy", "purchase", "खरीदें", "मंगाएं", "सलाह", "advice", "ఆర్డర్", "కొనాలి", "చేయాలి", "మంగాలి", "కొనుగోలు"]):
        items_to_order = critical_items + reorder_items
        if not items_to_order:
            if is_telugu_query:
                return "మీ స్టాక్ సమృద్ధిగా ఉంది. తదుపరి 7 రోజులలో ఎలాంటి కొత్త ఆర్డర్‌ల అవసరం లేదు! (Your stock is safe.)"
            return "Your stock is sufficient. No new orders are needed for the next 7 days! (स्टॉक पर्याप्त है, कोई नया आर्डर देने की ज़रूरत नहीं है।)"
            
        if is_telugu_query:
            res = "రాబోయే 7 రోజుల డిమాండ్ అంచనాల ప్రకారం, ఇక్కడ మీ కిరాణా ఆర్డర్ లిస్ట్ ఉంది:\n\n"
            for p in items_to_order:
                forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
                total_f = sum(f.forecasted_quantity for f in forecasts)
                order_qty = max(0.0, total_f - p.current_stock)
                
                priority = "🔴 అత్యవసరం" if p.reorder_status == "Critical" else "🟡 త్వరలో"
                res += f"- **{p.name}** ({priority}): ప్రస్తుతం స్టాక్: {p.current_stock} {p.unit} | 7 రోజుల అంచనా సేల్స్: {total_f:.1f} {p.unit} | **ఆర్డర్ చేయాల్సిన పరిమాణం: {order_qty:.1f} {p.unit}**\n"
            return res
        else:
            res = "Based on the 7-day demand forecast, here is your shopping list:\n\n"
            for p in items_to_order:
                forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
                total_f = sum(f.forecasted_quantity for f in forecasts)
                order_qty = max(0.0, total_f - p.current_stock)
                
                priority = "🔴 Immediate" if p.reorder_status == "Critical" else "🟡 Soon"
                res += f"- **{p.name}** ({priority}): Current stock: {p.current_stock} {p.unit} | Expected 7d sales: {total_f:.1f} {p.unit} | **Order: {order_qty:.1f} {p.unit}**\n"
            return res

    # Check for specific items (search by name or SKU)
    for p in products:
        words = p.name.lower().split()
        important_words = [w for w in words if len(w) > 2 and w not in ["pack", "loose", "premium", "salted"]]
        if p.sku.lower() in q or any(w in q for w in important_words):
            forecasts = db.query(ForecastResult).filter(ForecastResult.sku == p.sku).all()
            total_f = sum(f.forecasted_quantity for f in forecasts)
            
            status_emoji = "🟢" if p.reorder_status == "Safe" else ("🟡" if p.reorder_status == "Reorder Soon" else "🔴")
            
            if is_telugu_query:
                status_telugu = "సురక్షితం (Safe)" if p.reorder_status == "Safe" else ("త్వరలో కొనాలి (Reorder Soon)" if p.reorder_status == "Reorder Soon" else "కీలకం (Critical)")
                return (
                    f"{status_emoji} **{p.name}** ({p.sku}):\n"
                    f"- వర్గం (Category): {p.category}\n"
                    f"- ప్రస్తుత స్టాక్: {p.current_stock} {p.unit}\n"
                    f"- యూనిట్ ధర: రూ. {p.price}\n"
                    f"- ఆర్డర్ స్థితి: **{status_telugu}**\n"
                    f"- తదుపరి 7 రోజుల అంచనా సేల్స్: **{total_f:.1f} {p.unit}**\n"
                    f"- సిఫార్సు ఆర్డర్ పరిమాణం: **{max(0.0, total_f - p.current_stock):.1f} {p.unit}**"
                )
            else:
                return (
                    f"{status_emoji} **{p.name}** ({p.sku}):\n"
                    f"- Category: {p.category}\n"
                    f"- Current Stock: {p.current_stock} {p.unit}\n"
                    f"- Unit Price: Rs. {p.price}\n"
                    f"- Reorder Status: **{p.reorder_status}**\n"
                    f"- Predicted demand for next 7 days: **{total_f:.1f} {p.unit}**\n"
                    f"- Suggested order quantity: **{max(0.0, total_f - p.current_stock):.1f} {p.unit}**"
                )

    # General Greeting / Catch-all
    return (
        "హలో! నేను మీ కిరాణా స్టోర్ అసిస్టెంట్‌ని. మీరు నన్ను ఇలా అడగవచ్చు:\n"
        '- "ఈ వారం నేను ఏం ఆర్డర్ చేయాలి?"\n'
        '- "ఏ ఉత్పత్తులు కొరతగా ఉన్నాయి?"\n'
        '- "Amul Butter యొక్క స్టాక్ స్థితిని చూపించు"\n\n'
        "Hello! I am your Kirana Store Assistant. You can ask me questions like:\n"
        '- "What should I order today?"\n'
        '- "Which items are critical?"\n'
        '- "Show stock status for Amul Butter"'
    )
