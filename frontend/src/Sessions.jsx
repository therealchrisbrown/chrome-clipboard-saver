import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { ScrollArea } from './components/ui/scroll-area';
import { ChevronRight, RefreshCcw, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': chrome.runtime.getURL('')
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
          'Content-Type': 'application/json',
          'Origin': chrome.runtime.getURL('')
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
        headers: {
          'Origin': chrome.runtime.getURL('')
        },
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

  return (
    <div className="p-4 h-screen flex">
      <div className="w-1/3 pr-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sessions</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 -mx-4">
          <div className="px-4">
            {sessions.map((session) => (
              <div key={session.path} className="mb-4">
                <div
                  className="flex items-center justify-between p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                  onClick={() => fetchFileContent(session.files[0].path)}
                >
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mr-2" />
                    <span>{session.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteSession(session.path, e, true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="ml-6 mt-2">
                  {session.files.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => fetchFileContent(file.path)}
                      className={`
                        flex items-center justify-between p-2 rounded cursor-pointer
                        ${selectedFile === file.path ? 'bg-blue-100' : 'hover:bg-gray-100'}
                      `}
                    >
                      <div className="flex-1">
                        <div>{file.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(file.modified * 1000).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => deleteSession(file.path, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {sessions.length === 0 && !loading && (
              <div className="text-center text-gray-500 mt-4">
                No saved sessions found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="w-2/3 pl-4 border-l">
        <h2 className="text-xl font-semibold mb-4">File Content</h2>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {fileContent ? (
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {fileContent}
            </pre>
          ) : (
            <div className="text-center text-gray-500 mt-4">
              Select a file to view its content
            </div>
          )}
        </ScrollArea>
      </div>
      
      {error && (
        <div
          className={`
            fixed bottom-4 right-4 p-4 rounded-lg shadow-lg
            ${error.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
          `}
        >
          {error.message}
        </div>
      )}
    </div>
  );
}
