package com.harsha.dmscore.repository;

import com.harsha.dmscore.model.DocumentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentEventRepository extends JpaRepository<DocumentEvent, String> {

    // The core query for Event Sourcing & Version Control
    List<DocumentEvent> findByDocumentIdOrderByTimestampAsc(String documentId);
    long countByDocumentId(String documentId);
}