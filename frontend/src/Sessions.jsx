import React, { useEffect, useState } from 'react'
import { ScrollArea } from './components/ui/scroll-area'
import { Card, CardContent } from './components/ui/card'
import { Button } from './components/ui/button'
import { FileText, ChevronRight, ChevronDown } from 'lucide-react'

const API_URL = 'http://localhost:5001';

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSessions(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions');
    }
  };

  const toggleSession = (title) => {
    setExpandedSessions(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  const viewFileContent = async (file) => {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${file.path}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSelectedFile(file);
      setFileContent(data.content);
      setError(null);
    } catch (error) {
      console.error('Error fetching file content:', error);
      setError('Failed to fetch file content');
    }
  };

  return (
    <div className="h-screen bg-white">
      <div className="p-4">
        <h1 className="text-lg font-bold mb-4">Saved Sessions</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 h-[calc(100vh-100px)]">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card key={session.title} className="shadow-sm">
                  <CardContent className="p-3">
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleSession(session.title)}
                    >
                      {expandedSessions[session.title] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <h3 className="font-medium">{session.title}</h3>
                    </div>

                    {expandedSessions[session.title] && (
                      <div className="mt-2 pl-6 space-y-2">
                        {session.files.map((file) => (
                          <div
                            key={file.path}
                            className={`
                              flex items-center gap-2 p-2 rounded cursor-pointer
                              ${selectedFile?.path === file.path ? 'bg-blue-50' : 'hover:bg-gray-50'}
                            `}
                            onClick={() => viewFileContent(file)}
                          >
                            <FileText size={14} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{file.filename}</div>
                              <div className="text-xs text-gray-500">
                                {formatDate(file.modified)} - {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="h-full border rounded p-4">
            {selectedFile ? (
              <div>
                <h3 className="font-medium mb-2">{selectedFile.filename}</h3>
                <pre className="text-sm whitespace-pre-wrap">{fileContent}</pre>
              </div>
            ) : (
              <div className="text-gray-500 text-center mt-4">
                Select a file to view its content
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default Sessions
