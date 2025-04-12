import { useRef, useState, useEffect } from "react";
import Toolbar from "@/components/Toolbar";
import CanvasStage from "@/components/CanvasStage";
import PropertiesPanel from "@/components/PropertiesPanel";
import ContextMenu from "@/components/modals/ContextMenu";
import NodeCreationModal from "@/components/modals/NodeCreationModal";
import ColorLegendModal from "@/components/modals/ColorLegendModal";
import { useCanvasState } from "@/hooks/useCanvasState";
import { CanvasMode, Position } from "@/lib/types";
import { exportCanvasAsImage } from "@/lib/canvasUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function Canvas() {
  const { toast } = useToast();
  const {
    state,
    stageRef,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    updateConnection,
    deleteConnection,
    setMode,
    selectNode,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    zoomCanvas,
    resetZoom,
  } = useCanvasState();

  // State for context menu
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  // State for node creation modal
  const [nodeCreationModal, setNodeCreationModal] = useState({
    isOpen: false,
    position: null as Position | null,
  });

  // State for color legend modal
  const [colorLegendModal, setColorLegendModal] = useState(false);

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ ...contextMenu, isOpen: false });
    };

    if (contextMenu.isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.isOpen]);

  // Get the selected node from state
  const selectedNode = state.selectedNodeId
    ? state.nodes.find((n) => n.id === state.selectedNodeId) || null
    : null;

  // Get the selected connection from state
  const selectedConnection = state.selectedConnectionId
    ? state.connections.find((c) => c.id === state.selectedConnectionId) || null
    : null;

  // Save diagram mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const diagramData = {
        name: "My Life Canvas",
        userId: 1, // Default user ID for demo
        content: {
          nodes: state.nodes,
          connections: state.connections,
          canvasScale: state.scale,
          canvasPosition: state.position,
        },
      };

      return apiRequest("POST", "/api/diagrams", diagramData);
    },
    onSuccess: () => {
      toast({
        title: "Saved successfully",
        description: "Your diagram has been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save",
        description: error.message || "An error occurred while saving",
        variant: "destructive",
      });
    },
  });

  // Handle save diagram
  const handleSaveDiagram = () => {
    saveMutation.mutate();
  };

  // Handle export to image
  const handleExportImage = () => {
    exportCanvasAsImage(stageRef);
    toast({
      title: "Image exported",
      description: "Your diagram has been exported as an image",
    });
  };

  // Handle node creation
  const handleCreateNode = (nodeData: any) => {
    addNode(nodeData);
    setNodeCreationModal({ isOpen: false, position: null });
  };

  // Handle context menu actions
  const handleCopy = () => {
    // Implementation for copy functionality
    toast({ title: "Copied to clipboard" });
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleCut = () => {
    // Implementation for cut functionality
    if (state.selectedNodeId) {
      // Copy then delete
      toast({ title: "Cut to clipboard" });
      deleteNode(state.selectedNodeId);
    }
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handlePaste = () => {
    // Implementation for paste functionality
    toast({ title: "Pasted from clipboard" });
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleDelete = () => {
    if (state.selectedNodeId) {
      deleteNode(state.selectedNodeId);
      toast({ title: "Node deleted" });
    } else if (state.selectedConnectionId) {
      deleteConnection(state.selectedConnectionId);
      toast({ title: "Connection deleted" });
    }
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  return (
    <div className="flex h-screen">
      {/* Toolbar */}
      <Toolbar
        activeMode={state.mode}
        onModeChange={setMode}
        onZoomIn={() => zoomCanvas(1.2)}
        onZoomOut={() => zoomCanvas(0.8)}
        onZoomReset={resetZoom}
        onSaveDiagram={handleSaveDiagram}
        onExportImage={handleExportImage}
      />

      {/* Canvas */}
      <div 
        className="flex-1 relative overflow-hidden"
        onContextMenu={handleContextMenu}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 w-full h-12 bg-canvas-panel border-b border-gray-800 px-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-white font-semibold">Life Canvas Flow</h1>
            <div className="h-6 w-px bg-gray-700"></div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors">File</button>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors">Edit</button>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors">View</button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              className="px-3 py-1 bg-accent-green text-white rounded text-sm hover:bg-opacity-90 transition-colors flex items-center"
              onClick={handleSaveDiagram}
              disabled={saveMutation.isPending}
            >
              <span className="material-icons-outlined text-sm mr-1">save</span> 
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button 
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-opacity-90 transition-colors flex items-center"
              onClick={handleExportImage}
            >
              <span className="material-icons-outlined text-sm mr-1">download</span> Export
            </button>
          </div>
        </div>

        {/* Canvas Stage */}
        <CanvasStage
          nodes={state.nodes}
          connections={state.connections}
          scale={state.scale}
          position={state.position}
          mode={state.mode}
          isDrawingConnection={state.isDrawingConnection}
          connectionStartNode={state.connectionStartNode}
          selectedNodeId={state.selectedNodeId}
          stageRef={stageRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDragNode={() => {}} // This would be implemented for node drag events
          onSelectNode={selectNode}
        />
      </div>

      {/* Properties Panel */}
      <PropertiesPanel
        selectedNode={selectedNode}
        selectedConnection={selectedConnection}
        nodes={state.nodes}
        onUpdateNode={updateNode}
        onUpdateConnection={updateConnection}
        onDeleteConnection={deleteConnection}
        onDeleteNode={deleteNode}
        onCreateConnection={addConnection}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        selectedNodeId={state.selectedNodeId}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={handleDelete}
      />

      {/* Node Creation Modal */}
      <NodeCreationModal
        isOpen={nodeCreationModal.isOpen}
        onClose={() => setNodeCreationModal({ isOpen: false, position: null })}
        position={nodeCreationModal.position}
        onCreateNode={handleCreateNode}
      />

      {/* Color Legend Modal */}
      <ColorLegendModal
        isOpen={colorLegendModal}
        onClose={() => setColorLegendModal(false)}
      />
    </div>
  );
}
