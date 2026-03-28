import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx'; 

import { 
  FaFolder, FaFilePdf, FaFileWord, FaFileExcel, 
  FaFileImage, FaFileArchive, FaFileCode, FaFileAlt, FaFilePowerpoint 
} from 'react-icons/fa';

// --- MICRO-COMPONENTS (Viewers) ---
const DocxViewer = ({ fileUrl }) => {
  const [htmlContent, setHtmlContent] = useState('<div style="padding: 20px; text-align: center; color: #666;">⏳ Fetching Word Document...</div>');
  useEffect(() => {
    const renderDocx = async () => {
      try {
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        setHtmlContent(result.value || '<div style="padding: 20px; color: #888;">Document is empty.</div>');
      } catch (error) { setHtmlContent('<div style="color: #d9534f; padding: 20px; font-weight: bold;">❌ Error parsing Word document.</div>'); }
    };
    if (fileUrl) renderDocx();
  }, [fileUrl]);
  return <div style={{ padding: '40px', backgroundColor: 'white', color: '#333', height: '100%', overflowY: 'auto', boxSizing: 'border-box', lineHeight: '1.6', fontFamily: 'serif' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

const XlsxViewer = ({ fileUrl }) => {
  const [htmlContent, setHtmlContent] = useState('<div style="padding: 20px; text-align: center; color: #666;">⏳ Parsing Spreadsheet...</div>');
  useEffect(() => {
    const renderXlsx = async () => {
      try {
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const html = XLSX.utils.sheet_to_html(workbook.Sheets[firstSheetName]);
        setHtmlContent(html.replace('<table', '<table style="border-collapse: collapse; width: 100%; font-size: 13px; font-family: sans-serif; text-align: left;" border="1" cellpadding="6" bordercolor="#dddddd"') || '<div style="padding: 20px; color: #888;">Spreadsheet is empty.</div>');
      } catch (error) { setHtmlContent('<div style="color: #d9534f; padding: 20px; font-weight: bold;">❌ Error parsing spreadsheet.</div>'); }
    };
    if (fileUrl) renderXlsx();
  }, [fileUrl]);
  return <div style={{ padding: '20px', backgroundColor: '#fdfdfd', color: '#333', height: '100%', overflowY: 'auto', overflowX: 'auto', boxSizing: 'border-box' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default function GitWorkspace() {
  const [dbFilePaths, setDbFilePaths] = useState([]); 
  const [expandedFolders, setExpandedFolders] = useState({});
  const [stagedFiles, setStagedFiles] = useState([]); 
  const [isPushing, setIsPushing] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null); 
  const [authorId] = useState('harsha'); 
  const [history, setHistory] = useState([]);
  const [versionCount, setVersionCount] = useState(0); 
  const [statusMessage, setStatusMessage] = useState('✨ Workspace Ready');
  
  // UI States
  const [dashboardView, setDashboardView] = useState('ROOT');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragHoverFolder, setDragHoverFolder] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); 
  const [showPropertiesFor, setShowPropertiesFor] = useState(null); 
  const [targetFolder, setTargetFolder] = useState(null);

  // Context Menus
  const [contextMenu, setContextMenu] = useState(null); 
  const [folderContextMenu, setFolderContextMenu] = useState(null); 
  const [gridMenu, setGridMenu] = useState(null); 
  const [updateTarget, setUpdateTarget] = useState(null); 

  useEffect(() => {
    const closeMenus = () => { setContextMenu(null); setFolderContextMenu(null); setGridMenu(null); };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const getBackendId = (path) => path ? path.replaceAll('/', '___') : '';
  
  const getFileType = (fileName) => {
    if (!fileName || !fileName.includes('.')) return 'binary'; 
    const ext = fileName.split('.').pop().toLowerCase();
    if (['txt', 'md', 'json', 'js', 'jsx', 'java', 'py', 'html', 'htm', 'css'].includes(ext)) return 'text';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['docx', 'doc', 'odt', 'rtf'].includes(ext)) return 'docx'; 
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'xlsx'; 
    return 'binary'; 
  };

  const getFileIcon = (fileName, size = 16) => {
    if (fileName === 'FOLDER') return <FaFolder size={size} color="#fbbc04" />;
    if (!fileName || !fileName.includes('.')) return <FaFileAlt size={size} color="#9aa0a6" />;
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return <FaFilePdf size={size} color="#ea4335" />;
      case 'docx': case 'doc': case 'odt': case 'rtf': return <FaFileWord size={size} color="#4285f4" />;
      case 'xlsx': case 'xls': case 'csv': return <FaFileExcel size={size} color="#34a853" />;
      case 'png': case 'jpg': case 'jpeg': case 'svg': case 'webp': return <FaFileImage size={size} color="#ea4335" />;
      case 'zip': case 'rar': case 'tar': case 'gz': case '7z': return <FaFileArchive size={size} color="#8a8a8a" />;
      case 'js': case 'jsx': case 'html': case 'htm': case 'css': case 'json': case 'py': case 'java': return <FaFileCode size={size} color="#8ab4f8" />;
      case 'ppt': case 'pptx': return <FaFilePowerpoint size={size} color="#f4b400" />;
      default: return <FaFileAlt size={size} color="#9aa0a6" />; 
    }
  };

  const fetchAllFiles = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:8080/api/documents/all');
      if (response.ok) {
        const backendIds = await response.json();
        if (Array.isArray(backendIds)) {
          const cleanPaths = backendIds
            .filter(id => id && typeof id === 'string')
            .map(id => id.replaceAll('___', '/'))
            .filter(path => path.split('/').pop().includes('.'));
          setDbFilePaths(cleanPaths);
        }
      }
    } catch (error) { console.error("Could not fetch files:", error); }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => { fetchAllFiles(); }, []);

  // --- STAGING ENGINE ---
  const processFilesForStaging = async (files, targetFolderPath = null) => {
    if (!files || files.length === 0) return;
    setStatusMessage(`⏳ Staging files...`);
    const newStagedFiles = [];

    for (let file of Array.from(files)) {
      try {
        const safeFileName = file.name || `unknown_file_${Date.now()}.bin`;
        if (!safeFileName.includes('.')) continue; 

        const fileType = getFileType(safeFileName);
        const relativePath = file.webkitRelativePath || safeFileName;
        const uiPath = targetFolderPath ? `${targetFolderPath}/${safeFileName}` : relativePath;

        let content = fileType === 'text' 
          ? await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsText(file); })
          : URL.createObjectURL(file);

        newStagedFiles.push({ id: uiPath + Date.now(), uiPath, fileType, content, rawFile: file });
      } catch (err) { console.error("Error processing file", err); }
    }
    
    setStagedFiles(prev => [...prev, ...newStagedFiles]);
    if (newStagedFiles.length > 0) {
      setStatusMessage(`✅ ${newStagedFiles.length} files staged!`);
      setActiveDoc(null); setDashboardView('STAGED');
    }
  };

  const handleLocalSelection = (e) => { processFilesForStaging(e.target.files); e.target.value = ''; };
  const handleSpecificFolderSelection = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (window.confirm(`Stage ${e.target.files.length} file(s) into:\n\n📂 ${targetFolder}?`)) {
        processFilesForStaging(e.target.files, targetFolder);
      }
    }
    e.target.value = ''; setTargetFolder(null);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDraggingOver(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFilesForStaging(e.dataTransfer.files);
  };

  const handleCancelStagedFile = (e, fileId, filePath) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to cancel the upload of "${filePath}"?`)) {
      setStagedFiles(prev => prev.filter(f => f.id !== fileId));
      if (activeDoc && activeDoc.status === 'staged' && activeDoc.uiPath === filePath) setActiveDoc(null);
      setStatusMessage(`🗑️ Removed ${filePath} from staging area.`);
    }
  };

  // --- FILE OPERATIONS ---

  // 🚀 FIXED: Ask for Confirmation & Editor Name before Pushing
  const handlePushToDatabase = async () => {
    if (stagedFiles.length === 0) return;
    
    // 1. Permission / Confirmation Prompt
    if (!window.confirm(`Are you sure you want to push ${stagedFiles.length} file(s) to the database?`)) {
      return; 
    }

    // 2. Editor Name Prompt
    const editorName = window.prompt("Enter the Editor/Author Name for these files:", authorId);
    if (editorName === null || editorName.trim() === '') {
      setStatusMessage("❌ Push cancelled: Editor name is required.");
      return;
    }

    setIsPushing(true); 
    setStatusMessage(`🚀 Uploading ${stagedFiles.length} files to Database...`);
    let successCount = 0;

    for (const staged of stagedFiles) {
      try {
        const backendId = getBackendId(staged.uiPath);
        if (staged.fileType === 'text') {
          await fetch('http://localhost:8080/api/documents/event', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ documentId: backendId, eventType: 'DOCUMENT_CREATED', contentPayload: staged.content, authorId: editorName }) 
          });
        } else {
          const formData = new FormData(); 
          formData.append('file', staged.rawFile); 
          formData.append('documentId', backendId); 
          formData.append('authorId', editorName);
          await fetch('http://localhost:8080/api/documents/upload', { 
            method: 'POST', 
            body: formData 
          });
        }
        successCount++;
      } catch (error) {
        console.error("Failed to push file", error);
      }
    }
    
    setStagedFiles([]); 
    setIsPushing(false); 
    setStatusMessage(`✅ Successfully uploaded ${successCount} files!`);
    fetchAllFiles(); 
    setDashboardView('ROOT'); 
  };

  const handleDeleteFile = async (uiPath) => {
    if (!window.confirm(`⚠️ Permanently delete "${uiPath}"?`)) return; 
    try {
      await fetch(`http://localhost:8080/api/documents/delete?documentId=${encodeURIComponent(getBackendId(uiPath))}`, { method: 'DELETE' });
      setStatusMessage(`✅ Deleted ${uiPath}`);
      setDbFilePaths(prev => prev.filter(p => p !== uiPath));
      if (activeDoc && activeDoc.uiPath === uiPath) setActiveDoc(null);
    } catch (error) { setStatusMessage(`❌ Error deleting file.`); }
  };

  const handleDeleteFolder = async (folderPath) => {
    if (!window.confirm(`🚨 DANGER: Are you sure you want to permanently delete the folder "${folderPath}" and ALL files inside it? This cannot be undone.`)) return;
    setStatusMessage(`🗑️ Deleting folder contents...`);
    const filesToDelete = dbFilePaths.filter(p => p.startsWith(folderPath + '/'));
    for (let path of filesToDelete) {
      await fetch(`http://localhost:8080/api/documents/delete?documentId=${encodeURIComponent(getBackendId(path))}`, { method: 'DELETE' });
    }
    setStatusMessage(`✅ Folder deleted!`);
    fetchAllFiles();
    if (activeDoc && activeDoc.uiPath.startsWith(folderPath + '/')) setActiveDoc(null);
    if (dashboardView.startsWith(folderPath)) setDashboardView('ROOT');
  };

  const openDatabaseDocument = async (uiPath) => {
    setStatusMessage(`Fetching history for ${uiPath}...`);
    try {
      const response = await fetch(`http://localhost:8080/api/documents/${getBackendId(uiPath)}/history`);
      if (response.ok) {
        const rawData = await response.json();
        const data = rawData.filter(event => event.eventType !== 'SUMMARY_GENERATED');
        setHistory(data);
        const countRes = await fetch(`http://localhost:8080/api/documents/${getBackendId(uiPath)}/count`);
        if (countRes.ok) setVersionCount(await countRes.json());
        if (data.length > 0) {
          setActiveDoc({ status: 'db', uiPath, fileType: getFileType(uiPath), content: data[data.length - 1].contentPayload, backendId: getBackendId(uiPath) });
          setStatusMessage(`✅ Loaded ${uiPath}`);
        }
      }
    } catch (error) { setStatusMessage('❌ Error connecting to backend.'); }
  };

  const handleUpdateVersion = async (e, forcedTarget = null) => {
    const file = e.target.files[0];
    const targetPath = forcedTarget || (activeDoc ? activeDoc.uiPath : null);
    if (!file || !targetPath) return;

    const editorName = window.prompt("Enter Editor's Name for this Check-In:", authorId);
    if (editorName === null || editorName.trim() === "") {
      e.target.value = ''; setUpdateTarget(null); return; 
    }

    setStatusMessage(`🚀 Checking in new version...`);
    try {
      if (getFileType(file.name) === 'text') {
        const content = await new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.readAsText(file); });
        await fetch('http://localhost:8080/api/documents/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: getBackendId(targetPath), eventType: 'VERSION_UPDATED', contentPayload: content, authorId: editorName }) });
      } else {
        const formData = new FormData(); formData.append('file', file); formData.append('documentId', getBackendId(targetPath)); formData.append('authorId', editorName);
        await fetch('http://localhost:8080/api/documents/upload', { method: 'POST', body: formData });
      }
      setStatusMessage(`✅ New version checked in!`);
      if (activeDoc && activeDoc.uiPath === targetPath) openDatabaseDocument(targetPath);
      else fetchAllFiles();
    } catch (error) { setStatusMessage(`❌ Error updating file.`); }
    e.target.value = ''; setUpdateTarget(null);
  };

  const handleCommitEdit = async () => {
    if (!activeDoc || activeDoc.status !== 'db') return;
    
    const editorName = window.prompt("Enter Editor's Name for this text edit:", authorId);
    if (editorName === null || editorName.trim() === "") return;

    try {
      const response = await fetch('http://localhost:8080/api/documents/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: activeDoc.backendId, eventType: 'TEXT_UPDATED', contentPayload: activeDoc.content, authorId: editorName }) });
      if (response.ok) { setStatusMessage('✅ Edit committed!'); setTimeout(() => openDatabaseDocument(activeDoc.uiPath), 500); }
    } catch (error) { setStatusMessage('❌ Error committing changes.'); }
  };

  const handleWipeWorkspace = async () => {
    if (!window.confirm("🚨 EXTREME DANGER: This will permanently delete ALL files from your hard drive and WIPE the entire PostgreSQL database. Are you 100% sure?")) return;
    if (!window.confirm("Are you REALLY sure? There is no undo.")) return;
    setStatusMessage("☢️ WIPING ENTIRE WORKSPACE...");
    try {
      const response = await fetch('http://localhost:8080/api/documents/wipe', { method: 'DELETE' });
      if (response.ok) {
        setDbFilePaths([]); setStagedFiles([]); setActiveDoc(null); setHistory([]); setVersionCount(0); setDashboardView('ROOT');
        setStatusMessage("✅ Workspace completely wiped clean.");
      } else { setStatusMessage("❌ Failed to wipe workspace."); }
    } catch (error) { setStatusMessage("❌ Error: Could not connect to backend to wipe."); }
  };

  const downloadSpecificFile = async (uiPath, fileType, contentPayload) => {
    let fileName = uiPath.split('/').pop() || 'download';
    if (fileType === 'text') {
      const blob = new Blob([contentPayload], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = fileName; link.click();
    } else {
      try {
        const res = await fetch(`http://localhost:8080/api/documents/raw/${contentPayload.split('/').pop()}`);
        if(res.ok){
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a'); link.href = url; link.download = fileName; link.click();
        }
      } catch(e) { console.error("Download failed", e); }
    }
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    setStatusMessage(`📥 Downloading...`);
    downloadSpecificFile(activeDoc.uiPath, activeDoc.fileType, activeDoc.content);
  };

  const handleDownloadFolder = async (folderPath) => {
    const filesInFolder = dbFilePaths.filter(p => p.startsWith(folderPath + '/'));
    if (filesInFolder.length === 0) return alert("This folder is empty!");
    
    if (window.confirm(`Download ${filesInFolder.length} files sequentially? (Note: Your browser may ask for permission to download multiple files)`)) {
      setStatusMessage(`📥 Starting folder download...`);
      for (let i = 0; i < filesInFolder.length; i++) {
        const path = filesInFolder[i];
        try {
          const response = await fetch(`http://localhost:8080/api/documents/${getBackendId(path)}/history`);
          if (response.ok) {
            const historyData = await response.json();
            if (historyData.length > 0) {
              const latest = historyData[historyData.length - 1];
              setTimeout(() => {
                downloadSpecificFile(path, getFileType(path), latest.contentPayload);
              }, i * 800); 
            }
          }
        } catch(e) {}
      }
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return 'Unknown Size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActiveDocSize = () => {
    if (!activeDoc) return 'Unknown';
    if (activeDoc.status === 'staged' && activeDoc.rawFile) return formatBytes(activeDoc.rawFile.size);
    if (activeDoc.fileType === 'text') return formatBytes(new Blob([activeDoc.content]).size);
    return 'Remote File (Download to check exact size)'; 
  };

  // --- TREE BUILDING & RENDERING ---
  const buildTree = () => {
    const root = {};
    (dbFilePaths || []).forEach(path => {
      let current = root;
      const parts = path.split('/');
      parts.forEach((part, i) => {
        if (i === parts.length - 1) current[part] = path; 
        else { current[part] = current[part] || {}; current = current[part]; }
      });
    });
    return root;
  };

  const renderTree = (nodes, currentPath = '') => {
    return Object.entries(nodes).sort((a, b) => (a[0] || '').localeCompare(b[0] || '')).map(([name, value]) => {
      const isFile = typeof value === 'string';
      const fullPath = currentPath ? `${currentPath}/${name}` : name;

      if (isFile) {
        const isActive = activeDoc && activeDoc.uiPath === value;
        return (
          <div 
            key={fullPath} 
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.pageX, y: e.pageY, uiPath: value }); }}
            style={{ display: 'flex', alignItems: 'center', backgroundColor: isActive ? '#333742' : 'transparent', borderLeft: isActive ? '3px solid #61dafb' : '3px solid transparent' }}
          >
            <div onClick={() => openDatabaseDocument(value)} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '6px 10px 6px 25px', cursor: 'pointer', fontSize: '13px', color: isActive ? '#61dafb' : '#ccc', overflow: 'hidden' }}>
              <div style={{ flexShrink: 0 }}>{getFileIcon(name, 14)}</div>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
            </div>
          </div>
        );
      } else {
        const isOpen = expandedFolders[fullPath] !== false; 
        const isDragTarget = dragHoverFolder === fullPath; 
        
        return (
          <div key={fullPath}>
            <div 
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragHoverFolder(fullPath); }}
              onDragLeave={() => setDragHoverFolder(null)}
              onDrop={(e) => { 
                e.preventDefault(); e.stopPropagation(); setDragHoverFolder(null); setIsDraggingOver(false); 
                if (e.dataTransfer.files.length > 0) {
                  if (window.confirm(`Stage ${e.dataTransfer.files.length} file(s) into 📂 ${name}?`)) processFilesForStaging(e.dataTransfer.files, fullPath); 
                }
              }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setFolderContextMenu({ x: e.pageX, y: e.pageY, folderPath: fullPath }); }}
              style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#eee', backgroundColor: isDragTarget ? 'rgba(97,218,251,0.3)' : 'transparent', border: isDragTarget ? '1px dashed #61dafb' : '1px solid transparent', borderRadius: '4px' }}
            >
              <div onClick={() => { setExpandedFolders(p => ({...p, [fullPath]: !p[fullPath]})); setActiveDoc(null); setDashboardView(fullPath); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
                <span style={{ width: '15px', fontSize: '10px', flexShrink: 0 }}>{isOpen ? '▼' : '▶'}</span>
                <div style={{ flexShrink: 0 }}>{getFileIcon('FOLDER', 16)}</div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
              </div>
              <div onClick={(e) => { e.stopPropagation(); setTargetFolder(fullPath); document.getElementById('specific-folder-upload').click(); }} title={`Upload files into ${name}`} style={{ padding: '0 5px', fontSize: '14px', opacity: 0.5, transition: 'opacity 0.2s', flexShrink: 0 }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.5}>➕</div>
            </div>
            {isOpen && <div style={{ borderLeft: '1px solid #444', marginLeft: '14px' }}>{renderTree(value, fullPath)}</div>}
          </div>
        );
      }
    });
  };

  // --- DASHBOARD GRID ---
  const renderDashboardGrid = () => {
    let items = [];
    let title = "Workspace Overview";

    if (dashboardView === 'STAGED') {
      title = "⚠️ Staged Files (Pending Upload)";
      items = stagedFiles.map(f => ({ name: f.uiPath.split('/').pop(), fullPath: f.uiPath, isFile: true, staged: true, id: f.id }));
    } else {
      title = dashboardView === 'ROOT' ? "Root Directory" : `📂 ${dashboardView.split('/').pop()}`;
      const contents = new Set();
      (dbFilePaths || []).forEach(path => {
        if (dashboardView === 'ROOT') contents.add(path.split('/')[0]);
        else if (path.startsWith(dashboardView + '/')) contents.add(path.substring(dashboardView.length + 1).split('/')[0]);
      });
      items = Array.from(contents).map(name => ({ name, fullPath: dashboardView === 'ROOT' ? name : `${dashboardView}/${name}`, isFile: dbFilePaths.includes(dashboardView === 'ROOT' ? name : `${dashboardView}/${name}`), staged: false }));
    }

    items.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      if (sortOrder === 'type') {
        const typeA = a.isFile ? getFileType(nameA) : 'folder';
        const typeB = b.isFile ? getFileType(nameB) : 'folder';
        if (typeA === typeB) return nameA.localeCompare(nameB);
        return typeA.localeCompare(typeB);
      }
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return (
      <div style={{ padding: '40px', flex: 1, overflowY: 'auto', backgroundColor: '#f4f5f7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#333', fontSize: '24px' }}>{title}</h1>
          <div style={{ display: 'flex', gap: '15px' }}>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer' }}>
              <option value="asc">Sort A-Z</option>
              <option value="desc">Sort Z-A</option>
              <option value="type">Sort by File Type</option>
            </select>
            {dashboardView !== 'ROOT' && dashboardView !== 'STAGED' && (
              <button onClick={() => setDashboardView(dashboardView.includes('/') ? dashboardView.substring(0, dashboardView.lastIndexOf('/')) : 'ROOT')} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>⬅️ Back</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ position: 'relative', width: '140px' }}>
              <div 
                onClick={() => {
                  if (item.staged) setActiveDoc({status: 'staged', ...(stagedFiles.find(f=>f.id===item.id) || {})});
                  else if (item.isFile) openDatabaseDocument(item.fullPath);
                  else setDashboardView(item.fullPath);
                }}
                style={{ height: '140px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '15px', textAlign: 'center', border: item.staged ? '2px dashed #ffc107' : '1px solid #eee', transition: 'transform 0.2s', boxSizing: 'border-box' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                  {item.isFile ? getFileIcon(item.name, 48) : getFileIcon('FOLDER', 54)}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', wordBreak: 'break-word', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', lineHeight: '1.3', padding: '0 5px' }}>
                  {item.name}
                </div>
              </div>
              
              {!item.staged && (
                <div onClick={(e) => { e.stopPropagation(); setGridMenu({ id: i, fullPath: item.fullPath, isFile: item.isFile }); }} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>⋮</div>
              )}
              
              {gridMenu && gridMenu.id === i && (
                <div style={{ position: 'absolute', top: '35px', right: '0', backgroundColor: 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', borderRadius: '6px', zIndex: 100, padding: '5px 0', minWidth: '140px' }}>
                  {item.isFile ? (
                    <>
                      <div onClick={() => { setUpdateTarget(item.fullPath); document.getElementById('context-update-upload').click(); }} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⬆️ Update File</div>
                      <div onClick={() => setShowPropertiesFor(item.fullPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⚙️ Properties</div>
                      <div onClick={() => handleDeleteFile(item.fullPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#d9534f', borderTop: '1px solid #eee' }}>🗑️ Delete File</div>
                    </>
                  ) : (
                    <>
                      <div onClick={() => handleDownloadFolder(item.fullPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⬇️ Download All</div>
                      <div onClick={() => setShowPropertiesFor(item.fullPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⚙️ Properties</div>
                      <div onClick={() => handleDeleteFolder(item.fullPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#d9534f', borderTop: '1px solid #eee' }}>🚨 Delete Folder</div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', fontFamily: 'sans-serif', backgroundColor: '#f4f5f7', margin: 0, padding: 0, boxSizing: 'border-box' }} onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      
      {isDraggingOver && ( 
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(32, 35, 42, 0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '6px dashed #61dafb', pointerEvents: 'none' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>📥</div>
          <h1 style={{ color: '#61dafb' }}>Drop to Stage</h1>
        </div> 
      )}

      {/* HIDDEN UPLOADERS */}
      <input type="file" multiple id="specific-folder-upload" onChange={handleSpecificFolderSelection} style={{ display: 'none' }} />
      <input type="file" id="context-update-upload" onChange={(e) => handleUpdateVersion(e, updateTarget)} style={{ display: 'none' }} />

      {/* GLOBAL RIGHT CLICK MENU - FILES */}
      {contextMenu && (
        <div style={{ position: 'absolute', top: contextMenu.y, left: contextMenu.x, backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', borderRadius: '6px', zIndex: 10000, minWidth: '160px', padding: '5px 0' }}>
          <div onClick={() => { setUpdateTarget(contextMenu.uiPath); document.getElementById('context-update-upload').click(); }} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⬆️ Update Version</div>
          <div onClick={() => setShowPropertiesFor(contextMenu.uiPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⚙️ Properties</div>
          <div onClick={() => handleDeleteFile(contextMenu.uiPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#d9534f', borderTop: '1px solid #eee' }}>🗑️ Delete File</div>
        </div>
      )}

      {/* GLOBAL RIGHT CLICK MENU - FOLDERS */}
      {folderContextMenu && (
        <div style={{ position: 'absolute', top: folderContextMenu.y, left: folderContextMenu.x, backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', borderRadius: '6px', zIndex: 10000, minWidth: '160px', padding: '5px 0' }}>
          <div onClick={() => handleDownloadFolder(folderContextMenu.folderPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⬇️ Download All Files</div>
          <div onClick={() => setShowPropertiesFor(folderContextMenu.folderPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>⚙️ Folder Properties</div>
          <div onClick={() => handleDeleteFolder(folderContextMenu.folderPath)} style={{ padding: '10px 15px', fontSize: '13px', cursor: 'pointer', color: '#d9534f', borderTop: '1px solid #eee' }}>🚨 Delete Folder</div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{ width: '300px', flexShrink: 0, backgroundColor: '#20232a', color: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #61dafb, #007bff)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: 'white', boxShadow: '0 2px 10px rgba(97,218,251,0.4)' }}>D</div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'white', letterSpacing: '0.5px' }}>My<span style={{color: '#61dafb'}}>DMS</span></h2>
        </div>
        
        <div style={{ padding: '15px', display: 'flex', gap: '10px' }}>
          <input type="file" multiple id="file-upload" onChange={handleLocalSelection} style={{ display: 'none' }} />
          <button onClick={() => document.getElementById('file-upload').click()} style={{ flex: 1, padding: '8px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Add Files</button>
          <input type="file" webkitdirectory="true" directory="true" id="folder-upload" onChange={handleLocalSelection} style={{ display: 'none' }} />
          <button onClick={() => document.getElementById('folder-upload').click()} style={{ flex: 1, padding: '8px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📂 Add Folder</button>
        </div>

        {stagedFiles.length > 0 && (
          <div style={{ maxHeight: '40%', display: 'flex', flexDirection: 'column', margin: '10px', border: '2px dashed #ffc107', borderRadius: '6px', backgroundColor: 'rgba(255,193,7,0.05)' }}>
            <div onClick={() => { setActiveDoc(null); setDashboardView('STAGED'); }} style={{ padding: '10px', backgroundColor: '#333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#ffc107', fontWeight: 'bold' }}>⚠️ Unsaved</span>
              <span style={{ background: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>{stagedFiles.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px' }}><button onClick={handlePushToDatabase} disabled={isPushing} style={{ width: '100%', padding: '10px', backgroundColor: '#e83e8c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{isPushing ? 'Pushing...' : '🚀 Push All to DB'}</button></div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px 10px' }}>
                {stagedFiles.map((f) => {
                  const isActive = activeDoc && activeDoc.status === 'staged' && activeDoc.uiPath === f.uiPath;
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: isActive ? '#333' : 'transparent', borderLeft: isActive ? '3px solid #e83e8c' : '3px solid transparent', borderRadius: '4px', marginBottom: '4px' }}>
                      <div onClick={() => {setActiveDoc({status: 'staged', ...f}); setHistory([]);}} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '6px 10px', cursor: 'pointer', fontSize: '13px', color: isActive ? '#e83e8c' : '#ccc', overflow: 'hidden' }}>
                        <div style={{ flexShrink: 0 }}>{getFileIcon(f.uiPath.split('/').pop(), 12)}</div>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.uiPath.split('/').pop()}</span>
                      </div>
                      <div title="Cancel" onClick={(e) => handleCancelStagedFile(e, f.id, f.uiPath)} style={{ padding: '0 10px', cursor: 'pointer', fontSize: '12px', color: '#ff4d4f', flexShrink: 0 }}>❌</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div onClick={() => { setActiveDoc(null); setDashboardView('ROOT'); }} style={{ padding: '10px 15px', backgroundColor: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase' }}>Repository</span>
            <button onClick={(e) => { e.stopPropagation(); fetchAllFiles(); }} style={{ background: 'none', border: 'none', color: '#61dafb', cursor: 'pointer', transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>🔄</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
            {dbFilePaths.length === 0 ? <div style={{ padding: '15px', color: '#666', fontSize: '13px', textAlign: 'center' }}>Database empty.</div> : renderTree(buildTree())}
          </div>
        </div>
        
        <div style={{ padding: '15px', borderTop: '1px solid #333', backgroundColor: '#1a1c22' }}>
          <button onClick={handleWipeWorkspace} style={{ width: '100%', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>☢️ Nuke Workspace</button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* 🚀 SAFE PROPERTIES MODAL (No IIFEs) */}
        {showPropertiesFor && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', color: '#333' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {!showPropertiesFor.split('/').pop().includes('.') ? getFileIcon('FOLDER', 40) : getFileIcon(showPropertiesFor.split('/').pop(), 40)}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{showPropertiesFor.split('/').pop() || 'Root Directory'}</h2>
                  <div style={{color: '#888', fontSize: '12px', marginTop:'4px'}}>Path: /{showPropertiesFor}</div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                  {!showPropertiesFor.split('/').pop().includes('.') ? (
                    <>
                      <tr><td style={{ padding: '8px 0', color: '#666', width: '120px' }}>Item Type:</td><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Directory Folder</td></tr>
                      <tr><td style={{ padding: '8px 0', color: '#666' }}>Total Items:</td><td style={{ padding: '8px 0' }}>{dbFilePaths.filter(p => p.startsWith(showPropertiesFor + '/')).length} File(s)</td></tr>
                      <tr><td style={{ padding: '8px 0', color: '#666' }}>Est. Size:</td><td style={{ padding: '8px 0' }}>Remote Storage (Download to check)</td></tr>
                    </>
                  ) : (
                    <>
                      <tr><td style={{ padding: '8px 0', color: '#666', width: '120px' }}>File Extension:</td><td style={{ padding: '8px 0', fontWeight: 'bold' }}>.{showPropertiesFor.split('.').pop().toUpperCase()}</td></tr>
                      <tr><td style={{ padding: '8px 0', color: '#666' }}>Document Type:</td><td style={{ padding: '8px 0' }}>{getFileType(showPropertiesFor).toUpperCase()} File</td></tr>
                      <tr><td style={{ padding: '8px 0', color: '#666' }}>File Size:</td><td style={{ padding: '8px 0' }}>{(activeDoc && activeDoc.uiPath === showPropertiesFor) ? getActiveDocSize() : 'Remote File (Download to check)'}</td></tr>
                    </>
                  )}
                </tbody>
              </table>
              <button onClick={() => setShowPropertiesFor(null)} style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close Properties</button>
            </div>
          </div>
        )}

        {statusMessage && <div style={{ padding: '10px 20px', backgroundColor: '#20232a', color: '#61dafb', fontSize: '14px', fontWeight: 'bold' }}>{statusMessage}</div>}

        {activeDoc ? (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '20px', gap: '20px' }}>
            
            {/* DOCUMENT VIEWER */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{ flexShrink: 0 }}>{getFileIcon(activeDoc.uiPath.split('/').pop(), 20)}</div>
                  <h3 style={{ margin: 0, fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeDoc.uiPath}</h3>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setActiveDoc(null)} style={{ padding: '6px 12px', backgroundColor: '#f8f9fa', color: '#d9534f', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>✖️ Close</button>
                  <button onClick={() => setShowPropertiesFor(activeDoc.uiPath)} style={{ padding: '6px 12px', backgroundColor: '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>⚙️ Properties</button>
                  
                  {activeDoc.status === 'db' && (
                    <>
                      <input type="file" id="main-update-version-upload" onChange={(e) => handleUpdateVersion(e, activeDoc.uiPath)} style={{ display: 'none' }} />
                      <button onClick={() => document.getElementById('main-update-version-upload').click()} style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        ⬆️ Check-In New Version
                      </button>
                      <button onClick={() => handleDeleteFile(activeDoc.uiPath)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🗑️ Delete</button>
                    </>
                  )}
                  <button onClick={handleDownload} style={{ padding: '6px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>⬇️ Download</button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: activeDoc.fileType==='text' ? 'white' : '#f8f9fa' }}>
                {activeDoc.fileType === 'text' && <textarea value={activeDoc.content || ''} onChange={(e) => setActiveDoc({...activeDoc, content: e.target.value})} readOnly={activeDoc.status==='staged'} style={{flex:1, padding:'20px', border:'none', outline:'none', fontFamily:'monospace', resize:'none'}} />}
                {activeDoc.fileType === 'image' && <img src={activeDoc.content} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain', margin:'auto'}} />}
                {activeDoc.fileType === 'pdf' && <iframe src={activeDoc.content} style={{flex:1, border:'none'}}/>}
                {activeDoc.fileType === 'docx' && <DocxViewer fileUrl={activeDoc.content} />}
                {activeDoc.fileType === 'xlsx' && <XlsxViewer fileUrl={activeDoc.content} />}
                
                {activeDoc.fileType === 'binary' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '20px' }}>
                      {getFileIcon(activeDoc.uiPath.split('/').pop(), 80)}
                    </div>
                    <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Preview Not Available</h2>
                    <p style={{ color: '#666', marginBottom: '20px', maxWidth: '400px', lineHeight: '1.5' }}>
                      This document format cannot be displayed natively in the browser. Please download this file from the toolbar above to view or edit its contents locally.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TIMELINE */}
            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa', borderRadius: '8px 8px 0 0' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>🕒 Timeline History</h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', position: 'relative' }}>
                {activeDoc.status === 'staged' ? (
                  <div style={{textAlign:'center', color:'#888', marginTop:'40px'}}>Not yet pushed to DB.</div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '10px', width: '3px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
                    
                    {(history || []).slice().reverse().map((event, index) => {
                      const isOriginal = index === (history || []).length - 1;
                      const displayEvent = (event.eventType === 'FILE_UPLOADED' && !isOriginal) ? 'VERSION_UPDATED' : event.eventType;
                      
                      return (
                        <div key={index} style={{ display: 'flex', marginBottom: '25px', position: 'relative', zIndex: 1 }}>
                          <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#007bff', border: '3px solid white', margin: '4px 15px 0 10px', flexShrink: 0, boxShadow: '0 0 0 1px #007bff' }}></div>
                          <div 
                            style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '6px', padding: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'border 0.2s', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #61dafb'}
                            onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #eee'}
                            onClick={() => { setActiveDoc(p => ({...p, content: event.contentPayload})); }}
                          >
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                              <span style={{ fontFamily: 'monospace', backgroundColor: '#f4f5f7', padding: '2px 4px', borderRadius: '4px' }}>#{event.id?.toString().slice(-4) || 'REV'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>{displayEvent}</div>
                              <button style={{ background: '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>⏪ Preview File</button>
                            </div>
                            <div style={{ fontSize: '12px', color: '#555', marginTop: '8px', padding: '4px 8px', backgroundColor: '#f0f4f8', borderRadius: '4px', display: 'inline-block' }}>
                              <strong>Author:</strong> {event.authorId || 'System'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : renderDashboardGrid()}
      </div>
    </div>
  );
}