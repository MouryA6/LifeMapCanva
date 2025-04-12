import { ToolbarProps, CanvasMode } from "@/lib/types";

export default function Toolbar({
  activeMode,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSaveDiagram,
  onExportImage,
}: ToolbarProps) {
  const getToolClass = (mode: CanvasMode) => {
    return `toolbox-item h-10 w-10 rounded flex items-center justify-center transition-colors duration-200 ${
      activeMode === mode ? "bg-opacity-20 bg-accent-green" : ""
    }`;
  };

  return (
    <div className="w-16 bg-canvas-panel border-r border-gray-800 flex flex-col items-center py-4">
      <div className="mb-6">
        <div className="h-10 w-10 rounded-full bg-accent-green flex items-center justify-center">
          <span className="material-icons-outlined text-white">hub</span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-4">
        <button 
          className={getToolClass(CanvasMode.SELECT)}
          title="Select"
          onClick={() => onModeChange(CanvasMode.SELECT)}
        >
          <span className="material-icons-outlined">near_me</span>
        </button>
        
        <button 
          className={getToolClass(CanvasMode.RECTANGLE)}
          title="Rectangle Node"
          onClick={() => onModeChange(CanvasMode.RECTANGLE)}
        >
          <span className="material-icons-outlined">crop_square</span>
        </button>
        
        <button 
          className={getToolClass(CanvasMode.CIRCLE)}
          title="Circle Node"
          onClick={() => onModeChange(CanvasMode.CIRCLE)}
        >
          <span className="material-icons-outlined">circle</span>
        </button>
        
        <button 
          className={getToolClass(CanvasMode.CLOUD)}
          title="Cloud Node"
          onClick={() => onModeChange(CanvasMode.CLOUD)}
        >
          <span className="material-icons-outlined">cloud</span>
        </button>
        
        <button 
          className={getToolClass(CanvasMode.CONNECT)}
          title="Connect Nodes"
          onClick={() => onModeChange(CanvasMode.CONNECT)}
        >
          <span className="material-icons-outlined">arrow_forward</span>
        </button>
        
        <button 
          className={getToolClass(CanvasMode.TEXT)}
          title="Text"
          onClick={() => onModeChange(CanvasMode.TEXT)}
        >
          <span className="material-icons-outlined">text_fields</span>
        </button>
      </div>
      
      <div className="mt-auto flex flex-col space-y-4">
        <button 
          className="toolbox-item h-10 w-10 rounded flex items-center justify-center transition-colors duration-200" 
          title="Zoom In"
          onClick={onZoomIn}
        >
          <span className="material-icons-outlined">zoom_in</span>
        </button>
        
        <button 
          className="toolbox-item h-10 w-10 rounded flex items-center justify-center transition-colors duration-200" 
          title="Zoom Out"
          onClick={onZoomOut}
        >
          <span className="material-icons-outlined">zoom_out</span>
        </button>
        
        <button 
          className="toolbox-item h-10 w-10 rounded flex items-center justify-center transition-colors duration-200" 
          title="Fit to Screen"
          onClick={onZoomReset}
        >
          <span className="material-icons-outlined">fit_screen</span>
        </button>
      </div>
    </div>
  );
}
