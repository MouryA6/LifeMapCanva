import { ContextMenuProps } from "@/lib/types";

export default function ContextMenu({
  isOpen,
  position,
  onClose,
  selectedNodeId,
  onCopy,
  onCut,
  onPaste,
  onDelete,
}: ContextMenuProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute bg-canvas-panel border border-gray-700 rounded shadow-lg py-1 z-20"
      style={{ 
        left: position.x, 
        top: position.y 
      }}
    >
      <button 
        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm flex items-center"
        onClick={onCopy}
      >
        <span className="material-icons-outlined text-sm mr-2">content_copy</span> Copy
      </button>
      
      <button 
        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm flex items-center"
        onClick={onCut}
      >
        <span className="material-icons-outlined text-sm mr-2">content_cut</span> Cut
      </button>
      
      <button 
        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm flex items-center"
        onClick={onPaste}
      >
        <span className="material-icons-outlined text-sm mr-2">content_paste</span> Paste
      </button>
      
      <div className="border-t border-gray-700 my-1"></div>
      
      <button 
        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm flex items-center"
        onClick={onDelete}
      >
        <span className="material-icons-outlined text-sm mr-2">delete</span> Delete
      </button>
    </div>
  );
}
