import { useState } from 'react';

export default function GitWorkspace() {
  // Document State
  const [documentId, setDocumentId] = useState('');
  const [activeDocId, setActiveDocId] = useState(null);
  const [content, setContent] = useState('');
  
  // NEW: Dynamic Author State (Defaulting to you!)
  const [authorId, setAuthorId] = useState('harsha'); 
  
  // Git/Version History State
  const [history, setHistory] = useState([]);
  const [versionCount, setVersionCount] = useState(0); 
  const [statusMessage, setStatusMessage] = useState('');
  const [aiSummary, setAiSummary] = useState(''); 

  // 1. Load Document History from Spring Boot
  const loadDocument = async (e) => {
    e.preventDefault();
    if (!documentId.trim()) return;

    setStatusMessage(`Fetching history for ${documentId}...`);
    try {
      const response = await fetch(`http://localhost:8080/api/documents/${documentId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
        setActiveDocId(documentId);
        
        const countResponse = await fetch(`http://localhost:8080/api/documents/${documentId}/count`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setVersionCount(countData);
        }

        if (data.length > 0) {
          const latestSummary = data.slice().reverse().find(event => event.eventType === 'SUMMARY_GENERATED');
          if (latestSummary) {
            setAiSummary(latestSummary.contentPayload);
          } else {
            setAiSummary('');
          }
          
          const latestText = data.slice().reverse().find(event => event.eventType !== 'SUMMARY_GENERATED');
          if (latestText) {
            setContent(latestText.contentPayload);
            setStatusMessage(`✅ Loaded version history for ${documentId}`);
          }
        } else {
          setContent('');
          setAiSummary('');
          setStatusMessage(`✨ Started tracking new document: ${documentId}`);
        }
      }
    } catch (error) {
      console.error(error);
      setStatusMessage('❌ Error: Could not connect to the backend.');
    }
  };

  // 2. Commit a new version to the Database & Kafka
  const handleCommit = async () => {
    if (!activeDocId) return;
    if (!authorId.trim()) {
        setStatusMessage('❌ Error: Please enter an Author Name before committing.');
        return;
    }
    
    const eventType = history.length === 0 ? 'DOCUMENT_CREATED' : 'TEXT_UPDATED';
    
    // NEW: Using the dynamic authorId state instead of hardcoded text
    const payload = {
      documentId: activeDocId,
      eventType: eventType,
      contentPayload: content,
      authorId: authorId 
    };

    setStatusMessage('Committing changes...');
    try {
      const response = await fetch('http://localhost:8080/api/documents/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatusMessage('✅ Changes committed to Event Store!');
        setTimeout(() => document.getElementById('load-btn').click(), 500);
      }
    } catch (error) {
      setStatusMessage('❌ Error committing changes.');
    }
  };

  // 3. Export the file
  const handleExport = (extension) => {
    if (!activeDocId) return;

    if (extension === '.docx') {
      window.open(`http://localhost:8080/api/documents/${activeDocId}/export/word`, '_blank');
      setStatusMessage('📥 Downloading MS Word document...');
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeDocId}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusMessage(`📥 Downloading ${extension} file...`);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>📚 Git-Sourced Document Workspace</h2>

      {/* Top Bar: Updated with Author Input */}
      <form onSubmit={loadDocument} style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '6px', alignItems: 'center' }}>
        
        <input 
          type="text" 
          placeholder="Author Name" 
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          style={{ width: '150px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
          required
        />
        <span style={{ color: '#6c757d', fontSize: '18px' }}>/</span>
        <input 
          type="text" 
          placeholder="Enter Document ID (e.g., project-proposal)" 
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          style={{ flex: '1', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />
        <button id="load-btn" type="submit" style={{ padding: '10px 20px', backgroundColor: '#343a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Load / Create Tracked File
        </button>
      </form>

      {activeDocId && (
        <div style={{ display: 'flex', gap: '20px' }}>
          
          {/* Left Side: The Editor */}
          <div style={{ flex: '2', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>Editing: {activeDocId}</span>
              <div>
                <span style={{ marginRight: '10px', fontSize: '14px', color: '#555' }}>Export as:</span>
                <button onClick={() => handleExport('.txt')} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>.txt</button>
                <button onClick={() => handleExport('.md')} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>.md</button>
                <button onClick={() => handleExport('.docx')} style={{ padding: '5px 10px', backgroundColor: '#2b579a', color: 'white', border: 'none', cursor: 'pointer' }}>.docx</button>
              </div>
            </div>

            {aiSummary && (
              <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f3e8ff', borderLeft: '4px solid #8b5cf6', borderRadius: '4px' }}>
                <strong style={{ color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✨ AI Summary
                </strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#4c1d95', fontStyle: 'italic', lineHeight: '1.5' }}>
                  {aiSummary}
                </p>
              </div>
            )}

            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing your document contents here..."
              style={{ flex: '1', height: '400px', width: '100%', padding: '15px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box' }}
            />

            <button 
              onClick={handleCommit}
              style={{ marginTop: '10px', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              🚀 Commit Changes to Database
            </button>
          </div>

          {/* Right Side: Git Metadata & Timeline */}
          <div style={{ flex: '1', border: '1px solid #ddd', borderRadius: '6px', padding: '15px', backgroundColor: '#fafafa', maxHeight: '500px', overflowY: 'auto' }}>
            
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #ccc', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🕒 History</span>
              <span style={{ fontSize: '12px', backgroundColor: '#007bff', color: 'white', padding: '4px 8px', borderRadius: '12px', fontWeight: 'normal' }}>
                {versionCount} Commits
              </span>
            </h3>
            
            {history.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px' }}>No commits yet. Type something and commit to start tracking!</p>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {history.slice().reverse().map((event, index) => {
                  const date = new Date(event.timestamp).toLocaleString();
                  const isAi = event.eventType === 'SUMMARY_GENERATED';
                  const borderColor = isAi ? '#8b5cf6' : '#007bff';

                  return (
                    <li key={index} style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'white', borderLeft: `4px solid ${borderColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>{date}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                        {isAi ? '✨ AI Summary' : event.eventType}
                      </div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>
                        <strong>Author:</strong> {event.authorId}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        "{event.contentPayload.substring(0, 40)}..."
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: statusMessage.includes('❌') ? '#f8d7da' : '#d4edda', color: statusMessage.includes('❌') ? '#721c24' : '#155724', borderRadius: '4px', textAlign: 'center' }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}