import React, { useEffect, useState } from 'react'
import { ScrollArea } from './components/ui/scroll-area'
import { Card, CardContent } from './components/ui/card'
import { Button } from './components/ui/button'
import { Trash2, ExternalLink } from 'lucide-react'

function App() {
  const [copiedItems, setCopiedItems] = useState([])

  useEffect(() => {
    fetchCopiedItems()
    const interval = setInterval(fetchCopiedItems, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchCopiedItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clipboard')
      const data = await response.json()
      setCopiedItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const deleteItem = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/clipboard/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setCopiedItems(items => items.filter(item => item.id !== id))
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString()
  }

  return (
    <div className="w-[400px] h-[600px] p-4 bg-background">
      <h1 className="text-xl font-semibold mb-4">Copied Text History</h1>
      <ScrollArea className="h-[520px] rounded-md border p-4">
        {copiedItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No copied text yet</p>
        ) : (
          <div className="space-y-4">
            {copiedItems.map((item) => (
              <Card key={item.id} className="group relative">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground mb-2">{item.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary"
                    >
                      {new URL(item.source_url).hostname}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default App
