package com.harsha.dmscore.controller;

import com.harsha.dmscore.kafka.DocumentEventProducer;
import com.harsha.dmscore.model.DocumentEvent;
import com.harsha.dmscore.repository.DocumentEventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173") // Safely allows your React app to connect
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentEventRepository repository;
    private final DocumentEventProducer producer;

    // Spring automatically injects the repository and producer we built earlier
    public DocumentController(DocumentEventRepository repository, DocumentEventProducer producer) {
        this.repository = repository;
        this.producer = producer;
    }

    // Endpoint 1: Simulating a Document Upload or Edit
    @PostMapping("/event")
    public ResponseEntity<String> handleDocumentEvent(@RequestBody DocumentEvent event) {
        // 1. Tag the event with the exact current time
        event.setTimestamp(LocalDateTime.now());
        
        // 2. Save the immutable event log to PostgreSQL (The Event Store)
        repository.save(event);
        
        // 3. Broadcast the action to Kafka so the Python AI service can hear it
        producer.sendEvent(event);
        
        return ResponseEntity.ok("Success: Event saved to Database and broadcasted to Kafka!");
    }

    // Endpoint 2: Reconstructing a Document (The core of your Version Control)
    @GetMapping("/{documentId}/history")
    public ResponseEntity<List<DocumentEvent>> getDocumentHistory(@PathVariable String documentId) {
        // Fetches every action ever taken on this document, in chronological order
        List<DocumentEvent> history = repository.findByDocumentIdOrderByTimestampAsc(documentId);
        return ResponseEntity.ok(history);
    }
    
    // Endpoint 3: The Backend Word Document Generator
    @GetMapping("/{documentId}/export/word")
    public ResponseEntity<byte[]> exportToWord(@PathVariable String documentId) throws Exception {
        
        // 1. Fetch the entire history of this document from PostgreSQL
        List<DocumentEvent> history = repository.findByDocumentIdOrderByTimestampAsc(documentId);
        
        if (history.isEmpty()) {
            return ResponseEntity.notFound().build(); // Document doesn't exist
        }

        // 2. Reconstruct the document (For now, we just grab the text from the most recent event)
        String latestContent = history.get(history.size() - 1).getContentPayload();

        // 3. Use Apache POI to build a true, valid Microsoft Word file in memory
        try (XWPFDocument document = new XWPFDocument(); 
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            XWPFParagraph paragraph = document.createParagraph();
            XWPFRun run = paragraph.createRun();
            run.setText(latestContent);
            run.setFontSize(12);
            run.setFontFamily("Arial"); // You can format it however you want here!

            // Write the constructed Word file into the output stream
            document.write(out);

            // 4. Package it up and force the browser to download it as a file
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + documentId + ".docx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                    .body(out.toByteArray());
        }
    }

    // NEW Endpoint 4: The Missing Count Endpoint! 
    @GetMapping("/{documentId}/count")
    public ResponseEntity<Long> getVersionCount(@PathVariable String documentId) {
        long count = repository.countByDocumentId(documentId);
        return ResponseEntity.ok(count);
    }
}