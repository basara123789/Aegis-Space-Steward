export interface Point {
  x: number;
  y: number;
}

export type ElementType = 'note' | 'image' | 'arrow' | 'drawing' | 'equipment';

interface BaseElement {
  id: string;
  position: Point;
  width: number;
  height: number;
  rotation: number; // in degrees
  zIndex: number;
  groupId?: string;
}

export interface NoteElement extends BaseElement {
  type: 'note';
  content: string;
  color: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  className?: string; // For custom animations (e.g. calming effects)
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  start: Point;
  end: Point;
  color: string;
}

export interface DrawingElement extends BaseElement {
  type: 'drawing';
  src: string; // base64 data URL
}

export interface EquipmentElement extends BaseElement {
  type: 'equipment';
  name: string;
  status: 'operational' | 'warning' | 'critical';
  description: string;
}

export type CanvasElement = NoteElement | ImageElement | ArrowElement | DrawingElement | EquipmentElement;

export interface AnalysisContent {
  description: string;
  suggestions: string[];
}

export interface AnalysisResult {
  en: AnalysisContent;
  zh?: AnalysisContent;
}