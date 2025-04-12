import React, { useState, useEffect } from 'react';
import { useCanvas } from './ui/canvas-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { X, Square, Circle, Cloud, Save, Trash2, Plus } from 'lucide-react';

// Define the Connection type if not already defined elsewhere
interface Connection {
  id: number;
  sourceId: string;
  targetId: string;
  type?: string;
  color?: string;
}

// Add a top-level log to confirm the component is rendering
console.log('Rendering PropertyPanel component');

export interface CanvasContextProps {
  canvas: { nodes: Array<{ id: string; title?: string; description?: string; color?: string; type?: string }>; connections: Array<{ id: number; sourceId: string; targetId: string; type?: string; color?: string }> } | null;
  selectedNodeId: string | null;
  selectedConnectionId: number | null;
  setNodeType: (type: string) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  updateConnection: (id: number, data: Partial<Connection>) => void;
  deleteConnection: (id: number) => void;
  getNodeCoordinates: (id: string) => { x: number; y: number };
  isNodeMoving: boolean; // Indicates if a node is currently being moved
}

const PropertyPanel: React.FC = () => {
  const {
    canvas,
    selectedNodeId,
    selectedConnectionId,
    setNodeType,
    updateNode,
    deleteNode,
    updateConnection,
    deleteConnection,
    isNodeMoving,
    getNodeCoordinates,
  } = useCanvas();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [nodeColor, setNodeColor] = useState<string>('#4CAF50');
  const [connectionType, setConnectionType] = useState<string>('supports');
  const [connectionColor, setConnectionColor] = useState<string>('#4CAF50');

  const resetProperties = () => {
    setTitle('');
    setDescription('');
    setNodeColor('#4CAF50');
    setConnectionType('supports');
    setConnectionColor('#4CAF50');
  };

  useEffect(() => {
    console.log('useEffect triggered');

    if (isNodeMoving) {
      console.log('Node is moving, hiding properties panel.');
      return;
    }

    if (selectedNodeId && canvas) {
      const selectedNode = canvas.nodes.find((node: { id: string | number; title?: string; description?: string; color?: string; type?: string }) => String(node.id) === String(selectedNodeId));
      console.log('Selected Node:', selectedNode);
      if (selectedNode) {
        setTitle(selectedNode.title || '');
        setDescription(selectedNode.description || '');
        setNodeColor(selectedNode.color || '#4CAF50');
        return;
      }
    }

    if (selectedConnectionId && canvas) {
      const selectedConnection = canvas.connections.find((conn: { id: number }) => conn.id === Number(selectedConnectionId));
      console.log('Selected Connection:', selectedConnection);
      if (selectedConnection) {
        setConnectionType(selectedConnection.type || 'supports');
        setConnectionColor(selectedConnection.color || '#4CAF50');
        return;
      }
    }

    console.log('No node or connection selected, resetting properties.');
    resetProperties();
  }, [selectedNodeId, selectedConnectionId, canvas, isNodeMoving]);

  useEffect(() => {
    if (!isNodeMoving && selectedNodeId && canvas) {
      const { x, y } = getNodeCoordinates(selectedNodeId);
      updateNode(selectedNodeId, { x, y });
    }
  }, [isNodeMoving, selectedNodeId, canvas, updateNode, getNodeCoordinates]);

  // Handle saving node changes
  const handleNodeSave = () => {
    if (!selectedNodeId) return;

    updateNode(selectedNodeId, {
      title,
      description,
      color: nodeColor
    });
  };

  // Handle saving connection changes
  const handleConnectionSave = () => {
    if (!selectedConnectionId) return;

    updateConnection(selectedConnectionId, {
      type: connectionType as any,
      color: connectionColor
    });
  };

  // Handle node type change
  const handleNodeTypeChange = (type: 'rectangle' | 'circle' | 'cloud') => {
    if (!selectedNodeId) return;

    setNodeType(type);
    updateNode(selectedNodeId, { type });
  };

  // Handle delete selected node or connection
  const handleDelete = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    } else if (selectedConnectionId) {
      deleteConnection(selectedConnectionId);
    }
  };

  // Find connected nodes for the selected node
  const getConnectedNodes = () => {
    if (!selectedNodeId || !canvas) return [];

    return canvas.connections
      .filter((conn: { id: number; sourceId: string | number; targetId: string | number }) => conn.sourceId === selectedNodeId || conn.targetId === selectedNodeId)
      .map((conn: { id: number; sourceId: string | number; targetId: string | number }) => {
        const otherNodeId = conn.sourceId === selectedNodeId ? conn.targetId : conn.sourceId;
        const otherNode = canvas.nodes.find((node: { id: string | number; }) => node.id === otherNodeId);

        return {
          connectionId: conn.id,
          nodeId: otherNodeId,
          title: otherNode?.title || 'Unknown',
          isSource: conn.sourceId === selectedNodeId
        };
      });
  };

  // Render node properties
  const renderNodeProperties = () => {
    if (!selectedNodeId || !canvas) return null;

    const selectedNode = canvas.nodes.find((node: { id: number; }) => node.id === selectedNodeId);
    if (!selectedNode) return null;

    const connectedNodes = getConnectedNodes();

    return (
      <>
        <div className="mb-4">
          <Label className="block text-sm mb-1">Node Type</Label>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className={`flex-1 py-1.5 rounded ${selectedNode.type === 'rectangle' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
              onClick={() => handleNodeTypeChange('rectangle')}
            >
              <Square className="h-4 w-4 mr-1" />
              <span className="text-xs">Rectangle</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={`flex-1 py-1.5 rounded ${selectedNode.type === 'circle' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
              onClick={() => handleNodeTypeChange('circle')}
            >
              <Circle className="h-4 w-4 mr-1" />
              <span className="text-xs">Circle</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={`flex-1 py-1.5 rounded ${selectedNode.type === 'cloud' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
              onClick={() => handleNodeTypeChange('cloud')}
            >
              <Cloud className="h-4 w-4 mr-1" />
              <span className="text-xs">Cloud</span>
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="node-title" className="block text-sm mb-1">Title</Label>
          <Input 
            id="node-title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full px-3 py-2 bg-[#252525] border border-[#444] rounded focus:outline-none focus:border-primary"
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="node-description" className="block text-sm mb-1">Description</Label>
          <Textarea 
            id="node-description" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={3} 
            className="w-full px-3 py-2 bg-[#252525] border border-[#444] rounded focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="mb-4">
          <Label className="block text-sm mb-1">Color</Label>
          <div className="flex space-x-2">
            {['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#FAFAFA'].map(color => (
              <Button 
                key={color}
                variant="outline"
                size="icon"
                className={`w-6 h-6 rounded-full p-0 ${nodeColor === color ? 'border-2 border-white' : 'border border-[#444]'}`}
                style={{ backgroundColor: color }}
                onClick={() => setNodeColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <Label className="block text-sm">Connected Nodes</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary px-2 py-1 rounded hover:bg-primary hover:bg-opacity-10"
            >
              Add New
            </Button>
          </div>
          <div className="bg-[#252525] rounded border border-[#444] max-h-32 overflow-y-auto">
            {connectedNodes.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No connections
              </div>
            ) : (
              connectedNodes.map((conn: { connectionId: React.Key | null | undefined; isSource: any; title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => (
                <div key={conn.connectionId} className="p-2 border-b border-[#333] flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="material-icons text-sm text-primary mr-1">
                      {conn.isSource ? '→' : '←'}
                    </span>
                    <span className="text-sm">{conn.title}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-[#999] hover:text-destructive h-5 w-5"
                    onClick={() => conn.connectionId !== null && conn.connectionId !== undefined && deleteConnection(Number(conn.connectionId))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            className="flex-1 py-1.5 px-3 rounded bg-primary hover:bg-primary/80 text-white flex items-center justify-center"
            onClick={handleNodeSave}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button 
            variant="outline"
            className="py-1.5 px-3 rounded bg-[#252525] hover:bg-[#333] flex items-center justify-center"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </>
    );
  };

  // Render connection properties
  const renderConnectionProperties = () => {
    if (!selectedConnectionId || !canvas) return null;

    const selectedConnection = canvas.connections.find((conn: { id: number; }) => conn.id === selectedConnectionId);
    if (!selectedConnection) return null;

    // Get source and target node information
    const sourceNode = canvas.nodes.find((node: { id: string }) => node.id === selectedConnection.sourceId);
    const targetNode = canvas.nodes.find((node: { id: string }) => node.id === selectedConnection.targetId);

    return (
      <>
        <div className="mb-4">
          <Label className="block text-sm mb-1">Connection</Label>
          <div className="bg-[#252525] rounded border border-[#444] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">From:</span>
              <span className="text-sm">{sourceNode?.title || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">To:</span>
              <span className="text-sm">{targetNode?.title || 'Unknown'}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Label className="block text-sm mb-1">Relationship Type</Label>
          <div className="flex space-x-2 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              className={`flex-1 py-1.5 rounded ${connectionType === 'supports' ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
              onClick={() => setConnectionType('supports')}
            >
              <span className="text-xs">Supports</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={`flex-1 py-1.5 rounded ${connectionType === 'influences' ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
              onClick={() => setConnectionType('influences')}
            >
              <span className="text-xs">Influences</span>
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className={`flex-1 py-1.5 rounded ${connectionType === 'blocks' ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
              onClick={() => setConnectionType('blocks')}
            >
              <span className="text-xs">Blocks</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={`flex-1 py-1.5 rounded ${connectionType === 'custom' ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-[#252525] hover:bg-[#333]'}`}
              onClick={() => setConnectionType('custom')}
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
                className={`w-6 h-6 rounded-full p-0 ${connectionColor === color ? 'border-2 border-white' : 'border border-[#444]'}`}
                style={{ backgroundColor: color }}
                onClick={() => setConnectionColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            className="flex-1 py-1.5 px-3 rounded bg-primary hover:bg-primary/80 text-white flex items-center justify-center"
            onClick={handleConnectionSave}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button 
            variant="outline"
            className="py-1.5 px-3 rounded bg-[#252525] hover:bg-[#333] flex items-center justify-center"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Square className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Element Selected</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select a node or connection to edit its properties
        </p>
        <div className="text-sm text-muted-foreground">
          <p className="mb-1">Tip: Double-click on the canvas to create a new node</p>
          <p>Tip: Use the connect tool to create connections between nodes</p>
        </div>
      </div>
    );
  };

  const renderProperties = () => {
    if (isNodeMoving) {
      return <div className="text-center text-muted-foreground">Dragging...</div>;
    }

    if (selectedNodeId) {
      return renderNodeProperties();
    }

    if (selectedConnectionId) {
      return renderConnectionProperties();
    }

    return renderEmptyState();
  };

  return (
    <div className="w-72 bg-[#1E1E1E] border-l border-[#333] overflow-y-auto shadow-lg" data-panel="properties">
      <div className="p-4 border-b border-[#333]">
        <h2 className="font-medium text-lg">
          {isNodeMoving ? 'Dragging...' : selectedNodeId ? 'Node Properties' : 
           selectedConnectionId ? 'Connection Properties' : 
           'Properties'}
        </h2>
      </div>

      <div className="p-4">
        {renderProperties()}
      </div>
    </div>
  );
};

export default PropertyPanel;
