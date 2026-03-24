from kafka import KafkaConsumer
import json
import requests 
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

def start_ai_service():
    print("🔄 Initializing TinyLlama AI Brain...")
    
    # 1. Initialize the AI with a safety net
    try:
        llm = Ollama(model="tinyllama") 
    except Exception as e:
        print(f"❌ Failed to initialize Ollama: {e}")
        return

    prompt_template = PromptTemplate(
        input_variables=["document_text"],
        template="Summarize the following text in exactly one short sentence:\n\n{document_text}\n\nSummary:"
    )
    
    # 2. Connect to Kafka with a safety net
    try:
        consumer = KafkaConsumer(
            'document-events', 
            bootstrap_servers=['localhost:9092'],
            auto_offset_reset='latest', 
            group_id='ai-processor-group',
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        print("✅ Python AI Service is ONLINE and listening to Kafka!")
        print("-" * 50)
    except Exception as e:
        print(f"❌ Failed to connect to Kafka. Is Docker running? Error: {e}")
        return

    # 3. The Continuous Listening Loop
    for message in consumer:
        event = message.value
        
        # Only summarize if a human updated the text
        if event.get('eventType') in ['DOCUMENT_CREATED', 'TEXT_UPDATED'] and event.get('authorId') != 'tinyllama_ai':
            doc_id = event.get('documentId')
            content = event.get('contentPayload', '')
            
            # --- NEW: Don't waste AI power on empty documents ---
            if not content.strip():
                print(f"\n⏭️ SKIPPED: Document '{doc_id}' is empty.")
                continue

            print(f"\n📥 NEW EVENT: Reading '{doc_id}'...")
            
            try:
                # A. Generate the Summary
                formatted_prompt = prompt_template.format(document_text=content)
                summary = llm.invoke(formatted_prompt).strip()
                print(f"✨ SUMMARY GENERATED: {summary}")
                
                # B. Package it as a new Event
                payload = {
                    "documentId": doc_id,
                    "eventType": "SUMMARY_GENERATED",
                    "contentPayload": summary,
                    "authorId": "tinyllama_ai" 
                }

                # C. Send it back to the Java Event Store safely
                response = requests.post('http://localhost:8080/api/documents/event', json=payload)
                
                if response.status_code in [200, 201]:
                    print("🚀 Summary successfully committed to Event Store!")
                else:
                    print(f"⚠️ Java API rejected the payload. Status code: {response.status_code}")

            except Exception as e:
                print(f"❌ AI Processing Error: {e}")

if __name__ == "__main__":
    start_ai_service()
    