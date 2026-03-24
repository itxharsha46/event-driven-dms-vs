package com.harsha.dmscore.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_events")
public class DocumentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String eventId; // Unique ID for this exact action

    @Column(nullable = false)
    private String documentId; // Ties multiple events to one specific document

    @Column(nullable = false)
    private String eventType; // e.g., "DOCUMENT_CREATED", "TEXT_UPDATED", "REVERTED"

    @Column(columnDefinition = "TEXT")
    private String contentPayload; // The raw text, or the MinIO file path for binaries

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String authorId; // Tracks who made the change

    // Default constructor required by Spring JPA
    public DocumentEvent() {}

    // --- Getters and Setters ---
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getContentPayload() { return contentPayload; }
    public void setContentPayload(String contentPayload) { this.contentPayload = contentPayload; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
}