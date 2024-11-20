import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { ScrollArea } from './components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible';
import { ChevronRight, RefreshCcw, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openGroups, setOpenGroups] = useState(new Set());

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError({
        type: 'error',
        message: 'Failed to load sessions'
      });
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filepath) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sessions/${encodeURIComponent(filepath)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }
      
      const data = await response.json();
      setFileContent(data.content);
      setSelectedFile(filepath);
      setError(null);
    } catch (err) {
      setError({
        type: 'error',
        message: 'Failed to load file content'
      });
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (path, e, isDirectory = false) => {
    e.stopPropagation();
    
    const itemType = isDirectory ? 'session' : 'file';
    if (!confirm(`Are you sure you want to delete this ${itemType}? ${isDirectory ? 'This will delete all files in the session.' : ''}`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sessions/${encodeURIComponent(path)}`, {
        method: 'DELETE',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete session');
      }
      
      setRefreshKey(prev => prev + 1);
      
      if (selectedFile?.startsWith(path)) {
        setSelectedFile(null);
        setFileContent(null);
      }
      
      setError({
        type: 'success',
        message: `${isDirectory ? 'Session' : 'File'} deleted successfully`
      });
      
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError({
        type: 'error',
        message: err.message || `Failed to delete ${isDirectory ? 'session' : 'file'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (group) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(group)) {
      newOpenGroups.delete(group);
    } else {
      newOpenGroups.add(group);
    }
    setOpenGroups(newOpenGroups);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatSize = (size) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = size;
    let unit = 0;
    while (value > 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value.toFixed(1)} ${units[unit]}`;
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-semibold">Saved Sessions</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className={`${
          error.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
        } px-4 py-3 rounded m-4 text-sm border`}>
          {error.message}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sessions List */}
        <div className="w-1/3 border-r overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            {loading && <div className="p-4 text-gray-500">Loading...</div>}
            
            {!loading && sessions.length === 0 && (
              <div className="p-4 text-gray-500">No saved sessions found</div>
            )}

            {sessions.map(group => (
              <Collapsible
                key={group.name}
                open={openGroups.has(group.name)}
                className="border-b"
              >
                <CollapsibleTrigger
                  className="flex items-center justify-between w-full p-2 hover:bg-gray-100 group"
                  onClick={() => toggleGroup(group.name)}
                >
                  <div className="flex items-center">
                    <ChevronRight
                      className={`h-4 w-4 mr-2 transition-transform ${
                        openGroups.has(group.name) ? 'transform rotate-90' : ''
                      }`}
                    />
                    <span className="font-medium">{group.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteSession(group.name, e, true)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  {group.files.map(file => (
                    <div
                      key={file.path}
                      onClick={() => fetchFileContent(file.path)}
                      className={`flex items-center justify-between p-2 pl-8 hover:bg-gray-100 cursor-pointer ${
                        selectedFile === file.path ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(file.modified)} • {formatSize(file.size)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => deleteSession(file.path, e)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </ScrollArea>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {loading && <div className="text-gray-500">Loading content...</div>}
            
            {!loading && !selectedFile && (
              <div className="text-gray-500">Select a session file to view its content</div>
            )}
            
            {!loading && selectedFile && fileContent && (
              <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                {fileContent}
              </pre>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
