package com.harsha.dmscore.repository;

import com.harsha.dmscore.model.DocumentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying; // 🚀 NEW
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional; // 🚀 NEW

import java.util.List;

public interface DocumentEventRepository extends JpaRepository<DocumentEvent, Long> {
    
    List<DocumentEvent> findByDocumentIdOrderByTimestampAsc(String documentId);
    
    Long countByDocumentId(String documentId);

    @Query("SELECT DISTINCT d.documentId FROM DocumentEvent d")
    List<String> findAllUniqueDocumentIds();

    // 🚀 THE FIX: These two annotations force PostgreSQL to actually delete the rows!
    @Transactional
    @Modifying
    void deleteByDocumentId(String documentId);
}