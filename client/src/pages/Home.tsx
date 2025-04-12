import React, { useState, useEffect } from 'react';
import { useNavigate } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useCanvas } from '@/components/ui/canvas-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Cloud, Plus, Trash2, FileText } from 'lucide-react';

interface CanvasListItem {
  id: number;
  name: string;
  createdAt: string;
}

const Home = () => {
  const [canvases, setCanvases] = useState<CanvasListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createCanvas } = useCanvas();

  useEffect(() => {
    const fetchCanvases = async () => {
      try {
        const response = await fetch('/api/canvases');
        if (!response.ok) {
          throw new Error('Failed to fetch canvases');
        }
        const data = await response.json();
        setCanvases(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load your canvases',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCanvases();
  }, [toast]);

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for your canvas',
        variant: 'destructive',
      });
      return;
    }

    try {
      const canvasId = await createCanvas(newCanvasName);
      if (canvasId > 0) {
        toast({
          title: 'Success',
          description: 'Canvas created successfully',
        });
        navigate(`/canvas/${canvasId}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create canvas',
        variant: 'destructive',
      });
    }

    setIsCreateDialogOpen(false);
    setNewCanvasName('');
  };

  const handleDeleteCanvas = async (id: number) => {
    try {
      const response = await fetch(`/api/canvases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete canvas');
      }

      setCanvases(canvases.filter(canvas => canvas.id !== id));
      toast({
        title: 'Success',
        description: 'Canvas deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete canvas',
        variant: 'destructive',
      });
    }
  };

  const handleCanvasClick = (id: number) => {
    navigate(`/canvas/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[#1E1E1E] py-3 px-4 border-b border-[#333] flex items-center shadow-md">
        <div className="flex items-center">
          <Cloud className="text-primary mr-2 h-6 w-6" />
          <h1 className="text-xl font-semibold">Life Canvas Flow</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Your Canvases</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Canvas
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E1E1E] border-[#333]">
              <DialogHeader>
                <DialogTitle>Create New Canvas</DialogTitle>
                <DialogDescription>
                  Enter a name for your new life canvas.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="name" className="text-sm mb-1 block">
                  Canvas Name
                </Label>
                <Input
                  id="name"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="My Life Canvas"
                  className="bg-[#252525] border-[#444]"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCanvas}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="bg-[#1E1E1E] border-[#333] h-48 animate-pulse">
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-full bg-[#252525] mb-4"></div>
                  <div className="h-4 w-32 bg-[#252525] rounded mb-2"></div>
                  <div className="h-3 w-24 bg-[#252525] rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : canvases.length === 0 ? (
          <Card className="bg-[#1E1E1E] border-[#333] text-center p-12">
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No Canvases Yet</CardTitle>
              <CardDescription>
                Create your first life canvas to start mapping your goals and relationships.
              </CardDescription>
              <Button
                className="mt-6 bg-primary hover:bg-primary/90"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Canvas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {canvases.map((canvas) => (
              <Card
                key={canvas.id}
                className="bg-[#1E1E1E] border-[#333] cursor-pointer hover:border-primary transition-colors duration-200"
                onClick={() => handleCanvasClick(canvas.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    {canvas.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCanvas(canvas.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Created: {formatDate(canvas.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="border border-[#333] rounded-md h-24 bg-[#121212] flex items-center justify-center">
                    <Cloud className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full bg-[#252525] hover:bg-[#333] border-[#444]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCanvasClick(canvas.id);
                    }}
                  >
                    Open Canvas
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
