import React, { useEffect, useState, useCallback } from 'react'
import { ScrollArea } from './components/ui/scroll-area'
import { Card, CardContent } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Trash2, ExternalLink, Save, Edit2 } from 'lucide-react'

const API_URL = 'http://localhost:5001';

function App() {
  const [copiedItems, setCopiedItems] = useState([]);
  const [error, setError] = useState(null);
  const [sessionTitle, setSessionTitle] = useState("Untitled Session");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTitle, setLastSavedTitle] = useState("Untitled Session");

  const fetchCopiedItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/clipboard`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCopiedItems(data);
      
      // Only update title if it hasn't been edited or if it matches our last saved title
      if (data.length > 0 && data[0].session_title) {
        const serverTitle = data[0].session_title;
        if (sessionTitle === lastSavedTitle) {
          setSessionTitle(serverTitle);
          setLastSavedTitle(serverTitle);
        }
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to fetch items');
    }
  }, [sessionTitle, lastSavedTitle]);

  useEffect(() => {
    fetchCopiedItems();
    const interval = setInterval(fetchCopiedItems, 2000);
    return () => clearInterval(interval);
  }, [fetchCopiedItems]);

  const deleteItem = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/clipboard/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setCopiedItems(items => items.filter(item => item.id !== id));
      setError(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  const handleTitleChange = (e) => {
    setSessionTitle(e.target.value);
  };

  const updateSessionTitle = async () => {
    try {
      const response = await fetch(`${API_URL}/api/session/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: sessionTitle })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setIsEditingTitle(false);
      setLastSavedTitle(sessionTitle);
      setError(null);
    } catch (error) {
      console.error('Error updating session title:', error);
      setError('Failed to update session title');
    }
  };

  const endSession = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`${API_URL}/api/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: sessionTitle })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Session saved:', result.filepath);
      
      // Reset session
      const newTitle = "Untitled Session";
      setSessionTitle(newTitle);
      setLastSavedTitle(newTitle);
      setCopiedItems([]);
      setError(null);
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={sessionTitle}
                onChange={handleTitleChange}
                className="text-lg font-bold"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    updateSessionTitle();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={updateSessionTitle}
                className="h-8 w-8"
              >
                <Save size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{sessionTitle}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingTitle(true)}
                className="h-6 w-6"
              >
                <Edit2 size={14} />
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-180px)]">
          {copiedItems.length === 0 ? (
            <p className="text-gray-500 text-center text-sm">No copied items yet</p>
          ) : (
            <div className="space-y-2">
              {copiedItems.map((item) => (
                <Card key={item.id} className="shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {item.content}
                        </p>
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1 text-xs"
                          >
                            <ExternalLink size={12} />
                            Source
                          </a>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 h-6 w-6"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="mt-4">
          <Button
            onClick={endSession}
            disabled={copiedItems.length === 0 || isSaving}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isSaving ? 'Saving...' : 'End Session & Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App
