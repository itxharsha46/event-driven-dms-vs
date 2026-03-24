package com.harsha.dmscore.kafka;

import com.harsha.dmscore.model.DocumentEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class DocumentEventProducer {

    // The name of the Kafka channel we are broadcasting on
    private static final String TOPIC = "document-events";

    // Spring Boot provides this tool to easily send messages to Kafka
    private final KafkaTemplate<String, DocumentEvent> kafkaTemplate;

    public DocumentEventProducer(KafkaTemplate<String, DocumentEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // This is the method we will call whenever a user uploads or edits a file
    public void sendEvent(DocumentEvent event) {
        System.out.println("Broadcasting Event to Kafka: " + event.getEventType() + " for Document ID: " + event.getDocumentId());
        
        // Sends the event to the "document-events" topic
        kafkaTemplate.send(TOPIC, event.getEventId(), event);
    }
}