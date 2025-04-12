import { NodeType, ConnectionColor, Node, Connection } from "@shared/schema";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  scale: number;
  position: Position;
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  mode: CanvasMode;
  isDrawingConnection: boolean;
  connectionStartNode: string | null;
  activeColor: ConnectionColor;
}

export enum CanvasMode {
  SELECT = "select",
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
  CLOUD = "cloud",
  CONNECT = "connect",
  TEXT = "text",
  PAN = "pan",
}

export interface ContextMenuProps {
  isOpen: boolean;
  position: Position;
  onClose: () => void;
  selectedNodeId: string | null;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

export interface NodeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
  onCreateNode: (node: Partial<Node>) => void;
}

export interface ColorLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ToolbarProps {
  activeMode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onSaveDiagram: () => void;
  onExportImage: () => void;
}

export interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedConnection: Connection | null;
  nodes: Node[];
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  onDeleteConnection: (connectionId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateConnection: (fromNodeId: string, toNodeId: string) => void;
}
