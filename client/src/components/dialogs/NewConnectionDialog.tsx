import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCanvas } from '@/components/ui/canvas-context';
import { X } from 'lucide-react';
import { ConnectionType } from '@shared/schema';

interface NewConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceNodeId: number;
}

const NewConnectionDialog: React.FC<NewConnectionDialogProps> = ({ 
  isOpen, 
  onClose, 
  sourceNodeId 
}) => {
  const { canvas, addConnection } = useCanvas();
  
  const [targetNodeId, setTargetNodeId] = useState<number | null>(null);
  const [connectType, setConnectType] = useState<string>(ConnectionType.SUPPORTS);
  const [connectColor, setConnectColor] = useState<string>('#4CAF50');
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTargetNodeId(null);
      setConnectType(ConnectionType.SUPPORTS);
      setConnectColor('#4CAF50');
    }
  }, [isOpen]);
  
  // Get available target nodes (all nodes except source node)
  const getAvailableTargetNodes = () => {
    if (!canvas) return [];
    
    return canvas.nodes.filter(node => node.id !== sourceNodeId);
  };
  
  // Handle connection type selection
  const handleTypeSelect = (type: string) => {
    setConnectType(type);
    
    // Set default color based on type
    switch (type) {
      case ConnectionType.SUPPORTS:
        setConnectColor('#4CAF50');
        break;
      case ConnectionType.INFLUENCES:
        setConnectColor('#2196F3');
        break;
      case ConnectionType.BLOCKS:
        setConnectColor('#FF5252');
        break;
      default:
        setConnectColor('#4CAF50');
    }
  };
  
  // Handle add connection button click
  const handleAddConnection = () => {
    if (!targetNodeId) return;
    
    addConnection({
      sourceId: sourceNodeId,
      targetId: targetNodeId,
      type: connectType as any,
      color: connectColor,
    });
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E1E1E] rounded-lg shadow-xl border border-[#444] w-80">
        <DialogHeader className="p-3 border-b border-[#333] flex items-center justify-between">
          <DialogTitle className="font-medium">Add Connection</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="p-1 rounded hover:bg-[#333]">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="p-4">
          <div className="mb-4">
            <Label className="block text-sm mb-1">Connect To</Label>
            <Select onValueChange={(value) => setTargetNodeId(Number(value))}>
              <SelectTrigger className="w-full px-3 py-2 bg-[#252525] border border-[#444] rounded focus:outline-none focus:border-primary">
                <SelectValue placeholder="Select a node" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableTargetNodes().map(node => (
                  <SelectItem key={node.id} value={node.id.toString()}>
                    {node.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm mb-1">Relationship Type</Label>
            <div className="flex space-x-2 mb-2">
              <Button 
                variant="outline" 
                className={`flex-1 py-1.5 rounded ${connectType === ConnectionType.SUPPORTS ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
                onClick={() => handleTypeSelect(ConnectionType.SUPPORTS)}
              >
                <span className="text-xs">Supports</span>
              </Button>
              <Button 
                variant="outline" 
                className={`flex-1 py-1.5 rounded ${connectType === ConnectionType.INFLUENCES ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
                onClick={() => handleTypeSelect(ConnectionType.INFLUENCES)}
              >
                <span className="text-xs">Influences</span>
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className={`flex-1 py-1.5 rounded ${connectType === ConnectionType.BLOCKS ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
                onClick={() => handleTypeSelect(ConnectionType.BLOCKS)}
              >
                <span className="text-xs">Blocks</span>
              </Button>
              <Button 
                variant="outline" 
                className={`flex-1 py-1.5 rounded ${connectType === ConnectionType.CUSTOM ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
                onClick={() => handleTypeSelect(ConnectionType.CUSTOM)}
              >
                <span className="text-xs">Custom</span>
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm mb-1">Connection Color</Label>
            <div className="flex space-x-2">
              {['#4CAF50', '#FF5252', '#FFC107', '#2196F3'].map(color => (
                <Button 
                  key={color}
                  variant="outline"
                  size="icon"
                  className={`w-6 h-6 rounded-full p-0 ${connectColor === color ? 'border-2 border-white' : 'border border-[#444]'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setConnectColor(color)}
                />
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              className="flex-1 py-1.5 px-3 rounded bg-primary hover:bg-primary/80 text-white"
              onClick={handleAddConnection}
              disabled={!targetNodeId}
            >
              Add Connection
            </Button>
            <Button 
              variant="outline"
              className="flex-1 py-1.5 px-3 rounded bg-[#252525] hover:bg-[#333]"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewConnectionDialog;
