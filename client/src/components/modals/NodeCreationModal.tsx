import { useState } from "react";
import { NodeCreationModalProps } from "@/lib/types";
import { NodeType, ConnectionColor } from "@shared/schema";

export default function NodeCreationModal({
  isOpen,
  onClose,
  position,
  onCreateNode,
}: NodeCreationModalProps) {
  const [nodeData, setNodeData] = useState({
    type: NodeType.RECTANGLE,
    text: "",
    borderColor: ConnectionColor.GREEN,
    style: "normal", // normal, double, dashed, bold
  });

  const handleChange = (field: string, value: any) => {
    setNodeData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    // Calculate if we have position
    const x = position ? position.x : 100;
    const y = position ? position.y : 100;
    
    let width = 120;
    let height = 80;
    
    if (nodeData.type === NodeType.CIRCLE) {
      width = 80;
      height = 80;
    } else if (nodeData.type === NodeType.CLOUD) {
      width = 140;
      height = 80;
    }
    
    // Create node properties
    const newNode = {
      type: nodeData.type,
      text: nodeData.text,
      x,
      y,
      width,
      height,
      borderColor: nodeData.borderColor,
      borderWidth: nodeData.style === "bold" ? 3 : 2,
      hasDoubleOutline: nodeData.style === "double",
      backgroundColor: "transparent",
    };
    
    onCreateNode(newNode);
    
    // Reset form
    setNodeData({
      type: NodeType.RECTANGLE,
      text: "",
      borderColor: ConnectionColor.GREEN,
      style: "normal",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-canvas-panel border border-gray-700 rounded-lg shadow-lg w-96">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h3 className="font-semibold">Create New Node</h3>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Node Type</label>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 text-sm rounded ${nodeData.type === NodeType.RECTANGLE ? 'bg-accent-green text-white' : 'bg-gray-700 text-white'}`}
                onClick={() => handleChange('type', NodeType.RECTANGLE)}
              >
                Rectangle
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded ${nodeData.type === NodeType.CIRCLE ? 'bg-accent-green text-white' : 'bg-gray-700 text-white'}`}
                onClick={() => handleChange('type', NodeType.CIRCLE)}
              >
                Circle
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded ${nodeData.type === NodeType.CLOUD ? 'bg-accent-green text-white' : 'bg-gray-700 text-white'}`}
                onClick={() => handleChange('type', NodeType.CLOUD)}
              >
                Cloud
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Content</label>
            <textarea 
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm" 
              rows={3}
              placeholder="Enter node text..."
              value={nodeData.text}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Border Color</label>
              <div className="flex items-center">
                <div 
                  className="w-5 h-5 rounded mr-2" 
                  style={{ backgroundColor: nodeData.borderColor }}
                ></div>
                <select 
                  className="bg-gray-800 border border-gray-700 rounded p-1 text-sm w-full"
                  value={nodeData.borderColor}
                  onChange={(e) => handleChange('borderColor', e.target.value)}
                >
                  <option value={ConnectionColor.GREEN}>Green</option>
                  <option value={ConnectionColor.RED}>Red</option>
                  <option value={ConnectionColor.BLUE}>Blue</option>
                  <option value={ConnectionColor.YELLOW}>Yellow</option>
                  <option value={ConnectionColor.PURPLE}>Purple</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Style</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-sm"
                value={nodeData.style}
                onChange={(e) => handleChange('style', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="double">Double Border</option>
                <option value="dashed">Dashed</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 p-4 flex justify-end space-x-2">
          <button 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-accent-green hover:bg-opacity-90 rounded text-sm transition-colors"
            onClick={handleSubmit}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
