import { useState } from 'react';

export default function LocalWorkspace() {
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [files, setFiles] = useState([]);
  
  // Editor States
  const [selectedFileHandle, setSelectedFileHandle] = useState(null);
  const [fileContent, setFileContent] = useState('');
  
  // New File States
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Open Folder & Read All Files
  const handleSelectFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setDirectoryHandle(dirHandle);
      
      const fileArray = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          fileArray.push(entry);
        }
      }
      setFiles(fileArray);
      setStatusMessage(`📂 Opened folder: ${dirHandle.name}`);
      
      // Reset editor
      setSelectedFileHandle(null);
      setIsCreatingNew(false);
      setFileContent('');
    } catch (error) {
      console.error(error);
      setStatusMessage('❌ Folder selection cancelled.');
    }
  };

  // 2. Open an Existing File
  const handleOpenFile = async (fileHandle) => {
    try {
      const file = await fileHandle.getFile();
      if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
        setStatusMessage('⚠️ Browser editor currently only supports .txt and .md files.');
        return;
      }

      const text = await file.text();
      setSelectedFileHandle(fileHandle);
      setIsCreatingNew(false); // Turn off new file mode
      setFileContent(text);
      setStatusMessage(`📄 Opened: ${file.name}`);
    } catch (error) {
      console.error(error);
      setStatusMessage('❌ Error reading file.');
    }
  };

  // 3. Trigger "New File" Mode
  const handleStartNewFile = () => {
    setSelectedFileHandle(null);
    setIsCreatingNew(true);
    setNewFileName('');
    setFileContent('');
    setStatusMessage('✨ Ready to create a new file.');
  };

  // 4. Master Save Function (Handles both New and Existing files)
  const handleSaveFile = async () => {
    if (!directoryHandle) {
      setStatusMessage('⚠️ Please open a workspace folder first.');
      return;
    }

    try {
      setStatusMessage('Saving...');
      let targetHandle = selectedFileHandle;

      // IF WE ARE CREATING A BRAND NEW FILE
      if (isCreatingNew) {
        if (!newFileName.trim()) {
          setStatusMessage('⚠️ Please enter a file name.');
          return;
        }
        
        // Auto-append .txt if they forgot an extension
        const finalName = newFileName.includes('.') ? newFileName : `${newFileName}.txt`;
        
        // Tell the OS to create the file
        targetHandle = await directoryHandle.getFileHandle(finalName, { create: true });
        
        // Add the newly created file to our left-hand sidebar list
        setFiles(prevFiles => [...prevFiles, targetHandle]);
        
        // Switch out of "Create Mode" and into normal "Edit Mode"
        setIsCreatingNew(false);
        setSelectedFileHandle(targetHandle);
      }

      // WRITE THE TEXT TO THE DRIVE
      const writable = await targetHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();
      
      setStatusMessage(`✅ Saved ${targetHandle.name} successfully!`);
      
    } catch (error) {
      console.error(error);
      setStatusMessage(`❌ Error saving file: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Local Workspace & Editor</h2>

      {/* Top Bar: Select Folder */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><strong>Workspace:</strong> {directoryHandle ? directoryHandle.name : 'None selected'}</span>
        <button onClick={handleSelectFolder} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
          📂 Open Folder
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* Left Column: File Explorer */}
        <div style={{ flex: '1', border: '1px solid #ccc', borderRadius: '6px', padding: '10px', height: '450px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Files</h3>
            <button 
              onClick={handleStartNewFile}
              disabled={!directoryHandle}
              style={{ padding: '5px 10px', backgroundColor: directoryHandle ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: directoryHandle ? 'pointer' : 'not-allowed' }}
            >
              + New File
            </button>
          </div>
          
          <div style={{ overflowY: 'auto', flex: '1' }}>
            {files.length === 0 && <p style={{ color: '#666', fontSize: '14px' }}>No files found.</p>}
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {files.map((fileHandle, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <button 
                    onClick={() => handleOpenFile(fileHandle)}
                    style={{ 
                      width: '100%', textAlign: 'left', padding: '8px', 
                      backgroundColor: selectedFileHandle?.name === fileHandle.name && !isCreatingNew ? '#e2e6ea' : 'transparent',
                      border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer'
                    }}
                  >
                    📄 {fileHandle.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Text Editor */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column' }}>
          {(selectedFileHandle || isCreatingNew) ? (
            <>
              {/* Editor Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #ddd' }}>
                
                {isCreatingNew ? (
                  <input 
                    type="text" 
                    placeholder="Name your file (e.g., notes.txt)" 
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    style={{ padding: '8px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                ) : (
                  <h3 style={{ margin: 0 }}>{selectedFileHandle.name}</h3>
                )}

                <button 
                  onClick={handleSaveFile}
                  style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  💾 Save
                </button>
              </div>

              {/* Text Area */}
              <textarea 
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="Start typing your document here..."
                style={{ flex: '1', width: '100%', padding: '15px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid #ccc', borderRadius: '6px', resize: 'none', boxSizing: 'border-box' }}
              />
            </>
          ) : (
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: '6px', color: '#888', backgroundColor: '#fafafa' }}>
              Select a file or click "+ New File" to start.
            </div>
          )}
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: statusMessage.includes('❌') || statusMessage.includes('⚠️') ? '#f8d7da' : '#d4edda', color: statusMessage.includes('❌') || statusMessage.includes('⚠️') ? '#721c24' : '#155724', borderRadius: '4px', border: '1px solid transparent' }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}