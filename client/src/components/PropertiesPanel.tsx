import { useState, useEffect } from "react";
import { PropertiesPanelProps } from "@/lib/types";
import { Node, Connection, NodeType, ConnectionColor } from "@shared/schema";
import ColorPicker from "@/components/dialogs/ColorPicker";

export default function PropertiesPanel({
  selectedNode,
  selectedConnection,
  nodes,
  onUpdateNode,
  onUpdateConnection,
  onDeleteConnection,
  onDeleteNode,
  onCreateConnection,
}: PropertiesPanelProps) {
  const [formState, setFormState] = useState<{
    text: string;
    nodeType: NodeType;
    x: number;
    y: number;
    width: number;
    height: number;
    borderColor: string;
    borderWidth: number;
    backgroundColor: string;
  }>({
    text: selectedNode?.text || "",
    nodeType: selectedNode?.type || NodeType.RECTANGLE,
    x: selectedNode?.x || 0,
    y: selectedNode?.y || 0,
    width: selectedNode?.width || 120,
    height: selectedNode?.height || 80,
    borderColor: selectedNode?.borderColor || "#4CAF50",
    borderWidth: selectedNode?.borderWidth || 2,
    backgroundColor: selectedNode?.backgroundColor || "transparent",
  });

  // Update form state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setFormState({
        text: selectedNode.text || "",
        nodeType: selectedNode.type,
        x: selectedNode.x,
        y: selectedNode.y,
        width: selectedNode.width,
        height: selectedNode.height,
        borderColor: selectedNode.borderColor,
        borderWidth: selectedNode.borderWidth,
        backgroundColor: selectedNode.backgroundColor || "transparent",
      });
    }
  }, [selectedNode]);

  // Handle node type change
  const handleNodeTypeChange = (type: NodeType) => {
    setFormState({ ...formState, nodeType: type });
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { type });
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof typeof formState, value: any) => {
    setFormState({ ...formState, [field]: value });
  };

  // Apply changes to the selected node
  const applyChanges = () => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, {
        text: formState.text,
        x: formState.x,
        y: formState.y,
        width: formState.width,
        height: formState.height,
        borderColor: formState.borderColor,
        borderWidth: formState.borderWidth,
        backgroundColor: formState.backgroundColor,
      });
    }
  };

  // Find connections for the selected node
  const nodeConnections = selectedNode
    ? nodes
        .filter(
          (node) =>
            node.id !== selectedNode.id && // Exclude self-connections
            // Check if there's a connection to or from this node
            selectedConnection?.from === selectedNode.id ||
            selectedConnection?.to === selectedNode.id
        )
        .map((node) => ({
          node,
          isFrom: selectedConnection?.from === selectedNode.id,
          isTo: selectedConnection?.to === selectedNode.id,
        }))
    : [];

  // If nothing is selected, return null to hide the panel
  if (!selectedNode && !selectedConnection) {
    return null;
  }
  
  return (
    <div className="w-64 bg-canvas-panel border-l border-gray-800 flex flex-col">
      <div className="border-b border-gray-800 p-4">
        <h2 className="font-semibold">Properties</h2>
      </div>
      
      <div className="p-4 custom-scrollbar overflow-y-auto flex-1">
        {selectedNode ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-1">Node Type</p>
              <div className="flex space-x-2">
                <button 
                  className={`p-2 rounded flex items-center justify-center ${formState.nodeType === NodeType.RECTANGLE ? 'bg-accent-green text-white' : 'bg-gray-700 text-white'}`}
                  onClick={() => handleNodeTypeChange(NodeType.RECTANGLE)}
                  title="Rectangle"
                >
                  <span className="material-icons-outlined">crop_square</span>
                </button>
                <button 
                  className={`p-2 rounded flex items-center justify-center ${formState.nodeType === NodeType.CIRCLE ? 'bg-accent-green text-white' : 'bg-gray-700 text-white'}`}
                  onClick={() => handleNodeTypeChange(NodeType.CIRCLE)}
                  title="Circle"
                >
                  <span className="material-icons-outlined">circle</span>
                </button>
                <button 
                  className={`p-2 rounded flex items-center justify-center ${formState.nodeType === NodeType.CLOUD ? 'bg-accent-green text-white' : 'bg-gray-700 text-white'}`}
                  onClick={() => handleNodeTypeChange(NodeType.CLOUD)}
                  title="Cloud"
                >
                  <span className="material-icons-outlined">cloud</span>
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Text Content</label>
              <textarea 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm"
                rows={3}
                value={formState.text}
                onChange={(e) => handleInputChange('text', e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">X</label>
                  <input 
                    type="number" 
                    value={formState.x}
                    onChange={(e) => handleInputChange('x', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Y</label>
                  <input 
                    type="number" 
                    value={formState.y}
                    onChange={(e) => handleInputChange('y', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Size</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Width</label>
                  <input 
                    type="number" 
                    value={formState.width}
                    onChange={(e) => handleInputChange('width', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Height</label>
                  <input 
                    type="number" 
                    value={formState.height}
                    onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Appearance</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <ColorPicker
                    label="Border Color"
                    color={formState.borderColor}
                    onChange={(color) => handleInputChange('borderColor', color)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Border Width</label>
                  <input 
                    type="number" 
                    value={formState.borderWidth}
                    onChange={(e) => handleInputChange('borderWidth', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <ColorPicker
                  label="Background"
                  color={formState.backgroundColor}
                  onChange={(color) => handleInputChange('backgroundColor', color)}
                />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800">
              <h3 className="font-medium mb-2">Connections</h3>
              <div className="space-y-2">
                {selectedNode && nodeConnections.map(({ node, isFrom, isTo }) => (
                  <div key={node.id} className="flex items-center justify-between text-sm bg-gray-800 p-2 rounded">
                    <span>{isFrom ? `To: ${node.text || node.id}` : `From: ${node.text || node.id}`}</span>
                    <button 
                      className="text-accent-red text-xs"
                      onClick={() => {
                        const connection = selectedConnection;
                        if (connection) {
                          onDeleteConnection(connection.id);
                        }
                      }}
                    >
                      <span className="material-icons-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-3 flex items-center text-accent-green text-sm">
                <span className="material-icons-outlined text-sm mr-1">add</span> Add Connection
              </button>
            </div>
          </>
        ) : selectedConnection ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Connection Type</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm"
                value={selectedConnection.color}
                onChange={(e) => {
                  const selectedColor = e.target.value;
                  // Determine which ConnectionColor enum value matches the selected value
                  let color: ConnectionColor;
                  switch (selectedColor) {
                    case ConnectionColor.GREEN:
                      color = ConnectionColor.GREEN;
                      break;
                    case ConnectionColor.RED:
                      color = ConnectionColor.RED;
                      break;
                    case ConnectionColor.BLUE:
                      color = ConnectionColor.BLUE;
                      break;
                    case ConnectionColor.YELLOW:
                      color = ConnectionColor.YELLOW;
                      break;
                    case ConnectionColor.PURPLE:
                      color = ConnectionColor.PURPLE;
                      break;
                    default:
                      color = ConnectionColor.GREEN;
                  }
                  onUpdateConnection(selectedConnection.id, { color });
                }}
              >
                <option value={ConnectionColor.GREEN}>Standard Relationship</option>
                <option value={ConnectionColor.RED}>Negative/Warning</option>
                <option value={ConnectionColor.BLUE}>Information/Note</option>
                <option value={ConnectionColor.YELLOW}>High Priority</option>
                <option value={ConnectionColor.PURPLE}>Personal Goal</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">From Node</label>
              <div className="bg-gray-800 border border-gray-700 rounded p-2 text-sm">
                {nodes.find(n => n.id === selectedConnection.from)?.text || 'Unknown'}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">To Node</label>
              <div className="bg-gray-800 border border-gray-700 rounded p-2 text-sm">
                {nodes.find(n => n.id === selectedConnection.to)?.text || 'Unknown'}
              </div>
            </div>
            
            <button 
              className="mt-3 flex items-center text-accent-red text-sm"
              onClick={() => onDeleteConnection(selectedConnection.id)}
            >
              <span className="material-icons-outlined text-sm mr-1">delete</span> Delete Connection
            </button>
          </div>
        ) : null}
      </div>
      
      {selectedNode && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <button 
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center justify-center"
              onClick={applyChanges}
            >
              <span className="material-icons-outlined mr-2">save</span> Apply Changes
            </button>
            <button 
              className="py-2 px-3 bg-red-700 hover:bg-red-600 text-white rounded transition-colors flex items-center justify-center"
              onClick={() => {
                if (selectedNode) {
                  onUpdateNode(selectedNode.id, { isDragging: false });
                  if (confirm("Are you sure you want to delete this node?")) {
                    if (selectedNode) {
                      onDeleteNode(selectedNode.id);
                    }
                  }
                }
              }}
            >
              <span className="material-icons-outlined">delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
