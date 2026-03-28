package com.harsha.dmscore.controller;

import com.harsha.dmscore.model.DocumentEvent;
import com.harsha.dmscore.repository.DocumentEventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*") 
public class DocumentController {

    private final DocumentEventRepository repository;
    
    // THE FILE SYSTEM FOLDER: Saves files locally in your project folder
    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    // 🚀 FIX: Removed the Kafka producer from the constructor
    public DocumentController(DocumentEventRepository repository) {
        this.repository = repository;
        
        // Auto-create the uploads folder when the server starts if it doesn't exist
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }

    // --- STANDARD TEXT COMMIT ---
    @PostMapping("/event")
    public ResponseEntity<String> handleDocumentEvent(@RequestBody DocumentEvent event) {
        event.setTimestamp(LocalDateTime.now());
        repository.save(event);
        return ResponseEntity.ok("Success: Event saved to Database!");
    }

    // --- NEW: THE ENTERPRISE FILE UPLOAD ENDPOINT ---
    @PostMapping("/upload")
    public ResponseEntity<String> uploadBinaryFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentId") String documentId,
            @RequestParam("authorId") String authorId) throws Exception {
        
        // 1. Generate a unique, safe filename for the file system
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String uniqueFileName = UUID.randomUUID().toString() + extension;
        
        // 2. Save the PHYSICAL file to the hard drive
        Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);
        Files.write(filePath, file.getBytes());

        // 3. Save the METADATA "Pointer" to PostgreSQL
        DocumentEvent event = new DocumentEvent();
        event.setDocumentId(documentId);
        event.setEventType("FILE_UPLOADED");
        event.setAuthorId(authorId);
        event.setTimestamp(LocalDateTime.now());
        
        // The Payload is now a URL, not a giant Base64 string!
        event.setContentPayload("http://localhost:8080/api/documents/raw/" + uniqueFileName);

        repository.save(event);

        return ResponseEntity.ok("File securely stored in file system and mapped in DB!");
    }

    // --- NEW: THE FILE STREAMER (Serves files to React) ---
    @GetMapping("/raw/{fileName}")
    public ResponseEntity<byte[]> getRawFile(@PathVariable String fileName) throws Exception {
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        
        byte[] data = Files.readAllBytes(filePath);
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }

    // --- HISTORY, EXPORT, COUNT, SYNC, DELETE (Unchanged) ---
    @GetMapping("/{documentId}/history")
    public ResponseEntity<List<DocumentEvent>> getDocumentHistory(@PathVariable String documentId) {
        List<DocumentEvent> history = repository.findByDocumentIdOrderByTimestampAsc(documentId);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/{documentId}/export/word")
    public ResponseEntity<byte[]> exportToWord(@PathVariable String documentId) throws Exception {
        List<DocumentEvent> history = repository.findByDocumentIdOrderByTimestampAsc(documentId);
        if (history.isEmpty()) return ResponseEntity.notFound().build(); 
        String latestContent = history.get(history.size() - 1).getContentPayload();
        try (XWPFDocument document = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XWPFParagraph paragraph = document.createParagraph();
            XWPFRun run = paragraph.createRun();
            run.setText(latestContent);
            run.setFontSize(12);
            run.setFontFamily("Arial");
            document.write(out);
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + documentId + ".docx");
            return ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).body(out.toByteArray());
        }
    }

    @GetMapping("/{documentId}/count")
    public ResponseEntity<Long> getVersionCount(@PathVariable String documentId) {
        return ResponseEntity.ok(repository.countByDocumentId(documentId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<String>> getAllDocuments() {
        return ResponseEntity.ok(repository.findAllUniqueDocumentIds());
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteDocument(@RequestParam("documentId") String documentId) {
        repository.deleteByDocumentId(documentId);
        return ResponseEntity.ok().build();
    }

    // --- ACTIONS: THE NUCLEAR OPTION (WIPE EVERYTHING) ---
    @DeleteMapping("/wipe")
    public ResponseEntity<String> wipeEverything() {
        // 1. Delete all physical files from the hard drive
        try {
            File folder = new File(UPLOAD_DIR);
            if (folder.exists() && folder.isDirectory()) {
                File[] files = folder.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (!file.isDirectory()) {
                            file.delete(); // Poof.
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error cleaning file system: " + e.getMessage());
        }

        // 2. Wipe the entire PostgreSQL database table
        repository.deleteAll();

        return ResponseEntity.ok("Workspace and File System completely wiped!");
    }
}