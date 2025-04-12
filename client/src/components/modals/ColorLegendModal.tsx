import { ColorLegendModalProps } from "@/lib/types";
import { ConnectionColor } from "@shared/schema";

export default function ColorLegendModal({
  isOpen,
  onClose,
}: ColorLegendModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-canvas-panel border border-gray-700 rounded-lg shadow-lg w-80">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h3 className="font-semibold">Connection Types</h3>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: ConnectionColor.GREEN }}></div>
              <span>Standard Relationship</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: ConnectionColor.RED }}></div>
              <span>Negative/Warning</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: ConnectionColor.BLUE }}></div>
              <span>Information/Note</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: ConnectionColor.YELLOW }}></div>
              <span>High Priority</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: ConnectionColor.PURPLE }}></div>
              <span>Personal Goal</span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 p-4 flex justify-end">
          <button 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
