
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ESGPanel } from './components/ESGPanel';

import { InfiniteCanvas, CanvasApi, ViewportData } from './components/InfiniteCanvas';
import { ContextMenu } from './components/ContextMenu';
import { Minimap } from './components/Minimap';
import type { CanvasElement, NoteElement, ImageElement, ArrowElement, DrawingElement, Point, AnalysisResult } from './types';
import { useHistoryState } from './useHistoryState';
import { TelemetryPanel } from './components/TelemetryPanel';
import SpaceBackground from './components/SpaceBackground';
import { ARAlignmentOverlay } from './components/ARAlignmentOverlay';
import type { EquipmentElement } from './types';

export const COLORS = [
  { name: 'Gray', bg: 'bg-gray-700', text: 'text-gray-700' },
  { name: 'Red', bg: 'bg-red-500', text: 'text-red-500' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500' },
  { name: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { name: 'Green', bg: 'bg-green-500', text: 'text-green-500' },
  { name: 'Blue', bg: 'bg-blue-600', text: 'text-blue-600' },
  { name: 'Purple', bg: 'bg-purple-600', text: 'text-purple-600' },
  { name: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500' },
];

const GRID_SIZE = 10;

const INITIAL_ELEMENTS: CanvasElement[] = [
  // Hex Grid Spacing:
  // R = 160
  // W = 277.128 ~ 277
  // H = 320
  // Vertical Step = 240 (1.5 * R)
  // Horizontal Step = 277 (W) (for same row, but we use staggered)

  // Center (0, 0)
  {
    id: 'o2-regenerator',
    type: 'equipment',
    name: 'o2Regenerator',
    position: { x: 0, y: 0 },
    width: 277,
    height: 320,
    rotation: 0,
    zIndex: 1,
    status: 'operational',
    description: 'o2RegeneratorDesc'
  },
  // Bottom Left neighbor 2 steps down-left (-W, +3R) = (-277, 480)
  {
    id: 'water-reclamation',
    type: 'equipment',
    name: 'waterReclamation',
    position: { x: -277, y: 480 },
    width: 277,
    height: 320,
    rotation: 0,
    zIndex: 1,
    status: 'operational',
    description: 'waterReclamationDesc'
  },
  // Bottom Right neighbor 2 steps down-right (+W, +3R) = (277, 480)
  {
    id: 'comm-array',
    type: 'equipment',
    name: 'commArray',
    position: { x: 277, y: 480 },
    width: 277,
    height: 320,
    rotation: 0,
    zIndex: 1,
    status: 'operational',
    description: 'commArrayDesc'
  },
];

const translations: Record<string, Record<string, string>> = {
  en: {
    infiniteCanvas: 'Mission Control',
    selectObjectToTransform: 'Select objects to align them.',
    addNote: 'System Memo',
    addArrow: 'Vector Link',
    addDrawing: 'Schematic Sketch',
    addImages: 'Visual Data',
    imageEdit: 'Visual Diagnostic',
    removeOrEditObject: 'Remove or Edit Object',
    expandImage: 'Expand Image',
    color: 'Color',
    controls: 'Controls',
    settings: 'Settings',
    undo: 'Undo',
    redo: 'Redo',
    export: 'Export',
    import: 'Import',
    bringToFront: 'Front',
    sendToBack: 'Back',
    delete: 'Delete',
    resetView: 'Reset View',
    generatingImages: 'Generating with Gemini 3...',
    thisMayTakeAMoment: 'Harnessing next-gen Flash power.',
    chooseAnImage: 'Choose an Image',
    addToCanvas: 'Add to Canvas',
    download: 'Download',
    close: 'Close',
    duplicate: 'Duplicate',
    changeColor: 'Change Color',
    downloadImage: 'Download Image',
    editDrawing: 'Edit Drawing',
    changeLanguage: '中文',
    alignPanelRight: 'Align Panel Right',
    alignPanelLeft: 'Align Panel Left',
    interactionMode: 'Touch Mode',
    panMode: 'Pan',
    selectMode: 'Select',
    analyzeDraft: 'Analyze with Gemini 3',
    analyzing: 'Thinking...',
    contentDescription: 'Gemini 3 Insights',
    styleSuggestions: 'Style Suggestions',
    copy: 'Copy',
    copied: 'Copied!',
    hide: 'Hide',
    show: 'Show',
    clear: 'Clear',
    translate: 'Translate',
    translating: 'Translating...',
    optimizePrompt: 'Gemini 3 Optimize',
    optimizing: 'Optimizing...',
    optimizedPrompt: 'Optimized Result',
    variations: 'Creative Variations',
    drawingPad: 'Drawing Pad',
    pencil: 'Pencil',
    eraser: 'Eraser',
    size: 'Size',
    saveDrawing: 'Save Drawing',
    cancel: 'Cancel',
    shapes: 'Shapes',
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle',
    triangle: 'Triangle',
    star: 'Star',
    arrow: 'Arrow',
    group: 'Group',
    ungroup: 'Ungroup',
    copyToClipboard: 'Copy to Clipboard',
    pasteFromClipboard: 'Paste from Clipboard',
    layout: 'Layout & Align',
    snapToGrid: 'Snap to Grid',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    alignTop: 'Align Top',
    alignMiddle: 'Align Middle',
    alignBottom: 'Align Bottom',
    distributeHorizontally: 'Distribute Horizontally',
    distributeVertically: 'Distribute Vertically',
    tidyUp: 'Tidy Up (Auto Layout)',
    editImage: 'Edit Image',
    brush: 'Brush',
    brushSize: 'Brush Size',
    zoom: 'Zoom',
    clearMask: 'Clear Mask',
    saveToCanvas: 'Save to Canvas',
    describeYourEdit: 'Describe your edit...',
    editObject: 'Edit Object',
    removeObject: 'Remove Object',
    adjustments: 'Adjustments',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    temperature: 'Temperature',
    tint: 'Tint',
    highlight: 'Highlight',
    shadow: 'Shadow',
    sharpness: 'Sharpness',
    reset: 'Reset',
    resetAll: 'Reset All',
    // Telemetry & HUD
    driftModule: 'ESA-496 [DRIFT]',
    slopeModule: 'ESA-555 [SLOPE]',
    nominal: 'NOMINAL',
    warning: 'WARNING',
    critical: 'CRITICAL',
    tMinus7Days: 'T-7 DAYS',
    predictionAnxiety: 'PREDICTION: ANXIETY SPIKE DETECTED IN T+12 MINS.',
    recomProtocol: 'RECOM: INIT PROTOCOL STEWARD',
    bioLinkActive: 'BIO-LINK ACTIVE',
    uptime: 'UPTIME',
    currentProtocol: 'Current Protocol',
    standby: 'STANDBY',
    systemActive: 'System Active',
    missionSectorAlpha: 'Mission Sector Alpha',
    aegisSteward: 'Aegis Steward',
    crewPhysiologicalData: 'Crew Physiological Data',
    heartRate: 'Heart Rate',
    stressLevel: 'Stress Lvl',
    o2Saturation: 'O2 Sat',
    normal: 'Normal',
    lifeSupportSystem: 'Life Support System',
    psychologicalStability: 'Psychological Stability',
    resourceAllocation: 'Resource Allocation',
    emergencyProtocol: 'EMERGENCY PROTOCOL',
    emergencyProtocolAlert: '🚨 EMERGENCY PROTOCOL ACTIVATED 🚨\n\nInitiating Psychological First Aid...\nDeep Breathing Sequence Started.',
    missionProgress: 'Mission Progress',
    orbitSync: 'Orbit Sync',
    systemIntegrity: 'System Integrity',
    inventoryTracking: 'Inventory Tracking',
    h2oFilters: 'H2O Filters',
    powerCells: 'Power Cells',
    medKits: 'Med Kits',
    units: 'Units',
    printQueue: '3D Print Queue',
    valveAdaptor: 'Valve Adaptor Type-B',
    printing: 'Printing...',
    printerStatus: 'Printer Status: Active',
    moduleConfig: 'Module Config',
    positionSync: 'Position Sync',
    selectModulesToSync: 'Select multiple modules to sync position',
    // ESG Panel
    esgMonitor: 'ESG Resource Monitor',
    bioInkReserves: 'Bio-ink Reserves',
    recyclingRate: 'Recycling Rate',
    energyEfficiency: 'Energy Efficiency',
    logisticCrisis: 'LOGISTIC CRISIS: RESTOCK NEEDED',
    physicalInventory: 'Physical Inventory',
    initiatePhysicalRepair: 'INITIATE PHYSICAL REPAIR',
    // Radar Chart Labels
    lblBioInk: 'Bio-ink',
    lblRecycle: 'Recycle',
    lblEnergy: 'Energy',
    lblH2o: 'H2O',
    lblPower: 'Power',
    lblMeds: 'Meds',
    // Equipment Modules
    o2Regenerator: 'O2 REGENERATOR',
    o2RegeneratorDesc: 'Status: Nominal. Efficiency 98%.',
    waterReclamation: 'WATER RECLAMATION',
    waterReclamationDesc: 'Flow rate stable. Filtration units active.',
    commArray: 'COMM ARRAY',
    commArrayDesc: 'Signal strength: 98%. No anomalies.',
  },
  zh: {
    infiniteCanvas: '任務控制台',
    selectObjectToTransform: '選取多個物件進行對齊。',
    addNote: '系統備忘錄',
    addArrow: '向量連結',
    addDrawing: '結構草圖',
    addImages: '視覺數據',
    imageEdit: '視覺診斷',
    removeOrEditObject: '刪除或編輯物件',
    expandImage: '擴展圖像',
    color: '顏色',
    controls: '控制',
    settings: '設定',
    undo: '復原',
    redo: '重做',
    export: '匯出',
    import: '匯入',
    bringToFront: '移至最前',
    sendToBack: '移至最後',
    delete: '刪除',
    resetView: '重設視圖',
    generatingImages: 'Gemini 3 生成中...',
    thisMayTakeAMoment: '正在利用次世代 Flash 運算能力。',
    chooseAnImage: '選擇圖片',
    addToCanvas: '新增至畫布',
    download: '下載',
    close: '關閉',
    duplicate: '複製',
    changeColor: '變更顏色',
    downloadImage: '下載圖片',
    editDrawing: '編輯手繪',
    changeLanguage: 'English',
    alignPanelRight: '面板靠右',
    alignPanelLeft: '面板靠左',
    interactionMode: '觸控模式',
    panMode: '平移',
    selectMode: '選取',
    analyzeDraft: 'Gemini 3 分析',
    analyzing: '思考中...',
    contentDescription: 'Gemini 3 洞察',
    styleSuggestions: '風格建議',
    copy: '複製',
    copied: '已複製！',
    hide: '隱藏',
    show: '顯示',
    clear: '清除',
    translate: '翻譯',
    translating: '翻譯中...',
    optimizePrompt: 'Gemini 3 優化',
    optimizing: '優化中...',
    optimizedPrompt: '優化結果',
    variations: '創意變體',
    drawingPad: '繪圖板',
    pencil: '鉛筆',
    eraser: '橡皮擦',
    size: '筆刷大小',
    saveDrawing: '儲存繪圖',
    cancel: '取消',
    shapes: '形狀',
    line: '直線',
    rectangle: '矩形',
    circle: '圓形',
    triangle: '三角形',
    star: '星形',
    arrow: '箭頭',
    group: '群組',
    ungroup: '解散群組',
    copyToClipboard: '複製到剪貼簿',
    pasteFromClipboard: '從剪貼簿貼上',
    layout: '佈局與對齊',
    snapToGrid: '對齊格線',
    alignLeft: '靠左對齊',
    alignCenter: '水平置中',
    alignRight: '靠右對齊',
    alignTop: '靠上對齊',
    alignMiddle: '垂直置中',
    alignBottom: '靠下對齊',
    distributeHorizontally: '水平分佈',
    distributeVertically: '垂直分佈',
    tidyUp: '自動整理',
    editImage: '編輯圖片',
    brush: '筆刷',
    brushSize: '筆刷大小',
    zoom: '縮放',
    clearMask: '清除遮罩',
    saveToCanvas: '儲存至畫布',
    describeYourEdit: '描述您的編輯...',
    editObject: '編輯物件',
    removeObject: '移除物件',
    adjustments: '調整',
    brightness: '亮度',
    contrast: '對比度',
    saturation: '飽和度',
    temperature: '色溫',
    tint: '色調',
    highlight: '亮部',
    shadow: '陰影',
    sharpness: '銳利度',
    reset: '重設',
    resetAll: '重設全部',
    // Telemetry & HUD
    driftModule: 'ESA-496 [漂移監測]',
    slopeModule: 'ESA-555 [趨勢預測]',
    nominal: '數值正常',
    warning: '警示狀態',
    critical: '嚴重危險',
    tMinus7Days: 'T-7 天',
    predictionAnxiety: '預測：12分鐘後可能出現焦慮峰值。',
    recomProtocol: '建議：啟動心理安定協議',
    bioLinkActive: '生物連結已啟動',
    uptime: '運行時間',
    currentProtocol: '當前心理安定協議',
    standby: '待命中',
    systemActive: '系統運作中',
    missionSectorAlpha: '任務區塊 Alpha',
    aegisSteward: 'Aegis 守護者',
    regenerate: '重新生成',
    applyAndContinue: '應用並繼續',
    generate: '生成',
    // Mission Console
    crewPhysiologicalData: '組員生理數據',
    heartRate: '心率',
    stressLevel: '壓力指數',
    o2Saturation: '血氧飽和度',
    normal: '正常',
    lifeSupportSystem: '維生系統',
    psychologicalStability: '心理安定',
    resourceAllocation: '資源分配',
    emergencyProtocol: '緊急安定協議',
    emergencyProtocolAlert: '🚨 緊急安定協議已啟動 🚨\n\n正在啟動心理急救...\n已開始深呼吸引導程序。',
    missionProgress: '任務進度',
    orbitSync: '軌道同步率',
    systemIntegrity: '系統完整性',
    inventoryTracking: '物資配給狀態',
    h2oFilters: '水循環濾芯',
    powerCells: '能量電池',
    medKits: '急救包',
    units: '單位',
    printQueue: '3D 列印隊列',
    valveAdaptor: 'B型閥門轉接頭',
    printing: '列印中...',
    printerStatus: '列印狀態：運作中',
    moduleConfig: '模組配置',
    positionSync: '位置同步',
    selectModulesToSync: '選取多個模組以同步位置',
    // ESG Panel
    esgMonitor: 'ESG 資源監控',
    bioInkReserves: '生物墨水儲量',
    recyclingRate: '循環回收率',
    energyEfficiency: '能源效率',
    logisticCrisis: '後勤危機：需要補給',
    physicalInventory: '實體庫存清單',
    initiatePhysicalRepair: '啟動實體維修程序',
    // Radar Chart Labels
    lblBioInk: '生物墨水',
    lblRecycle: '循環率',
    lblEnergy: '能源效率',
    lblH2o: '淨水',
    lblPower: '電力',
    lblMeds: '醫療',
    // Equipment Modules
    o2Regenerator: '氧氣再生系統',
    o2RegeneratorDesc: '狀態：正常。效率 98%。',
    waterReclamation: '水資源回收系統',
    waterReclamationDesc: '流速穩定，過濾單元運作中。',
    commArray: '通訊陣列',
    commArrayDesc: '訊號強度：98%。無異常。',
  }
};


interface ContextMenuData {
  x: number;
  y: number;
  worldPoint: Point;
  elementId: string | null;
}

export interface OutpaintingState {
  element: ImageElement;
  frame: {
    position: Point;
    width: number;
    height: number;
  };
}

const App: React.FC = () => {
  const {
    state: elements,
    setState: setElements,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistoryState<CanvasElement[]>(INITIAL_ELEMENTS);

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [resetView, setResetView] = useState<() => void>(() => () => { });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [outpaintingState, setOutpaintingState] = useState<OutpaintingState | null>(null);
  const [imageStyle, setImageStyle] = useState<string>('Default');
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('1:1');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [panelAlignment, setPanelAlignment] = useState<'left' | 'right'>('right');
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('pan');
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
  const [analyzingElementId, setAnalyzingElementId] = useState<string | null>(null);
  const [analysisVisibility, setAnalysisVisibility] = useState<Record<string, boolean>>({});
  const [translatingElementId, setTranslatingElementId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [viewport, setViewport] = useState<ViewportData>({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    zoom: 1
  });

  // Crisis Scenario State
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyStep, setEmergencyStep] = useState<'idle' | 'alert' | 'breathing' | 'focus' | 'ar'>('idle');
  const [breathingText, setBreathingText] = useState('BREATHE IN'); // New State
  const [showAROverlay, setShowAROverlay] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Breathing Cycle Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emergencyStep === 'breathing') {
      setBreathingText('BREATHE IN');
      interval = setInterval(() => {
        setBreathingText(prev => prev === 'BREATHE IN' ? 'BREATHE OUT' : 'BREATHE IN');
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [emergencyStep]);

  const triggerCalmingProtocol = useCallback(() => {
    setIsEmergency(true);
    setEmergencyStep('alert');

    // 1. Reset View to ensure elements are visible and centered
    if (canvasApiRef.current) {
      canvasApiRef.current.resetView();
    }

    // 2. Turn O2 Critical
    setElements(prev => prev.map(el =>
      el.id === 'o2-regenerator' ? { ...el, status: 'critical' } : el
    ));

    // 3. Transition to Breathing after Delay - REMOVED for manual click interaction
    // setTimeout(() => {
    //   setEmergencyStep('breathing');
    // }, 3000);

  }, [setElements]);

  const handleBreathingClick = () => {
    setEmergencyStep('focus');
    // Show AR Overlay immediately as per requirement
    setShowAROverlay(true);
  };

  const handleARComplete = () => {
    // 1. Trigger Bambu Bridge
    fetch('http://localhost:8999/print')
      .then(res => res.json())
      .then(data => console.log('Bridge result:', data))
      .catch(err => console.error('Bridge failed:', err));

    // 2. Reset UI
    setShowAROverlay(false);
    setIsEmergency(false);
    setEmergencyStep('idle');
    setNotification('Protocol Aegis: Alignment Stabilized. Physical Repair Initiated.');

    // 3. Restore O2 Status
    setElements(prev => prev.map(el =>
      el.id === 'o2-regenerator' ? { ...el, status: 'operational' } : el
    ));

    setTimeout(() => setNotification(null), 5000);
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const canvasApiRef = useRef<CanvasApi>(null);
  const lastImagePosition = useRef<Point | null>(null);
  const zIndexCounter = useRef(INITIAL_ELEMENTS.length);
  const dragCounter = useRef(0);
  const lastWorldMousePosition = useRef<Point | null>(null);

  const ai = useRef<GoogleGenAI | null>(null);

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  }, []);

  const getAi = useCallback(() => {
    if (!ai.current) {
      if (!process.env.API_KEY) {
        alert("API_KEY environment variable is not set.");
        return null;
      }
      ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai.current;
  }, []);

  const getCenterOfViewport = useCallback((): Point => {
    if (canvasApiRef.current) {
      const screenCenter: Point = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      return canvasApiRef.current.screenToWorld(screenCenter);
    }
    return { x: 0, y: 0 };
  }, []);

  const getTargetPosition = useCallback((): Point => {
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    if (selected.length > 0) {
      const getRotatedCorners = (el: CanvasElement): Point[] => {
        const { x, y } = el.position;
        const { width, height, rotation } = el;
        const rad = rotation * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const halfW = width / 2;
        const halfH = height / 2;
        const corners = [
          { x: -halfW, y: -halfH }, { x: halfW, y: -halfH },
          { x: halfW, y: halfH }, { x: -halfW, y: halfH }
        ];
        return corners.map(corner => ({
          x: x + corner.x * cos - corner.y * sin,
          y: y + corner.x * sin + corner.y * cos,
        }));
      };

      const allCorners = selected.flatMap(getRotatedCorners);
      const maxX = Math.max(...allCorners.map(c => c.x));
      const minY = Math.min(...allCorners.map(c => c.y));
      const maxY = Math.max(...allCorners.map(c => c.y));

      return { x: maxX + 250, y: (minY + maxY) / 2 };
    }

    if (lastWorldMousePosition.current) {
      return { x: lastWorldMousePosition.current.x + 20, y: lastWorldMousePosition.current.y + 20 };
    }

    return getCenterOfViewport();
  }, [elements, selectedElementIds, getCenterOfViewport]);

  const handleCanvasMouseMove = (worldPoint: Point) => {
    lastWorldMousePosition.current = worldPoint;
  };

  const handleViewportChange = useCallback((newViewport: ViewportData) => {
    setViewport(newViewport);
  }, []);

  const handleZoomIn = () => canvasApiRef.current?.zoomIn();
  const handleZoomOut = () => canvasApiRef.current?.zoomOut();
  const handlePanTo = (worldPoint: Point) => canvasApiRef.current?.panTo(worldPoint);

  const addElement = useCallback((newElement: Omit<NoteElement, 'id' | 'zIndex'> | Omit<ImageElement, 'id' | 'zIndex'> | Omit<ArrowElement, 'id' | 'zIndex'> | Omit<DrawingElement, 'id' | 'zIndex'>) => {
    const elementWithId: CanvasElement = {
      ...newElement,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      zIndex: zIndexCounter.current++,
    } as CanvasElement;
    setElements(prev => [...prev, elementWithId]);
  }, [setElements]);

  const addNote = useCallback((position?: Point) => {
    addElement({
      type: 'note',
      position: position || getTargetPosition(),
      width: 150,
      height: 100,
      rotation: 0,
      content: 'New Note',
      color: COLORS[Math.floor(Math.random() * COLORS.length)].bg,
    });
  }, [addElement, getTargetPosition]);

  const addDrawing = useCallback((position?: Point) => {
    addElement({
      type: 'drawing',
      position: position || getTargetPosition(),
      width: 400,
      height: 300,
      rotation: 0,
      src: '',
    });
  }, [addElement, getTargetPosition]);

  const handleStartOutpainting = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId && el.type === 'image') as ImageElement | undefined;
    if (element) {
      setOutpaintingState({
        element,
        frame: {
          position: { ...element.position },
          width: element.width,
          height: element.height,
        }
      });
      setSelectedElementIds([]);
      setContextMenu(null);
    }
  }, [elements]);

  const handleUpdateOutpaintingFrame = useCallback((newFrame: { position: Point; width: number; height: number; }) => {
    setOutpaintingState(prev => prev ? { ...prev, frame: { ...prev.frame, ...newFrame } } : null);
  }, []);

  const handleCancelOutpainting = () => {
    setOutpaintingState(null);
  };

  const handleOutpaintingGenerate = useCallback(async (prompt: string) => {
    if (!outpaintingState) return;

    const genAI = getAi();
    if (!genAI) return;

    setIsGenerating(true);
    const { element, frame } = outpaintingState;

    try {
      const taskCanvas = document.createElement('canvas');
      taskCanvas.width = Math.ceil(frame.width);
      taskCanvas.height = Math.ceil(frame.height);
      const ctx = taskCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      const originalImage = new Image();
      originalImage.src = element.src;
      await new Promise<void>((resolve, reject) => {
        originalImage.onload = () => resolve();
        originalImage.onerror = reject;
      });

      const drawX = (frame.width / 2) + (element.position.x - frame.position.x) - (element.width / 2);
      const drawY = (frame.height / 2) + (element.position.y - frame.position.y) - (element.height / 2);
      ctx.drawImage(originalImage, drawX, drawY, element.width, element.height);

      const taskImageB64 = taskCanvas.toDataURL('image/png');
      const [header, data] = taskImageB64.split(',');
      const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
      const imagePart = { inlineData: { data, mimeType } };
      const finalPrompt = `This is an outpainting task. The existing image is part of a larger scene. Fill the surrounding transparent areas to naturally and seamlessly extend the image. User guidance: "${prompt || 'Continue the scene naturally.'}"`;
      const textPart = { text: finalPrompt };

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      if (!part?.inlineData) throw new Error("AI did not return an image.");
      const newImageSrc = `data:image/png;base64,${part.inlineData.data}`;

      const updatedElement: ImageElement = { ...element, src: newImageSrc, position: { ...frame.position }, width: frame.width, height: frame.height };
      setElements(prev => prev.map(el => el.id === element.id ? updatedElement : el));
    } catch (error) {
      console.error("Error during outpainting:", error);
      alert("Failed to expand the image. Please check the console.");
    } finally {
      setIsGenerating(false);
      setOutpaintingState(null);
    }
  }, [outpaintingState, getAi, setElements]);

  const handleAutoPromptGenerate = useCallback(async (state: OutpaintingState): Promise<string> => {
    const genAI = getAi();
    if (!genAI) {
      throw new Error("AI not initialized.");
    }

    const { element, frame } = state;

    const taskCanvas = document.createElement('canvas');
    taskCanvas.width = Math.ceil(frame.width);
    taskCanvas.height = Math.ceil(frame.height);
    const ctx = taskCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    const originalImage = new Image();
    originalImage.src = element.src;
    await new Promise<void>((resolve, reject) => {
      originalImage.onload = () => resolve();
      originalImage.onerror = reject;
    });

    const drawX = (frame.width / 2) + (element.position.x - frame.position.x) - (element.width / 2);
    const drawY = (frame.height / 2) + (element.position.y - frame.position.y) - (element.height / 2);
    ctx.drawImage(originalImage, drawX, drawY, element.width, element.height);

    const taskImageB64 = taskCanvas.toDataURL('image/png');
    const [header, data] = taskImageB64.split(',');
    const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
    const imagePart = { inlineData: { data, mimeType } };

    const analysisPrompt = "Analyze the provided image, which shows a smaller picture placed on a larger transparent canvas for an expansion task. Based on the picture's content and its placement, infer the user's intent. Generate a concise, direct prompt for another AI to fill the transparent area. For example, if the expansion is below a person, suggest 'add their legs and feet.' If it's to the sides of a landscape, suggest 'expand the beautiful mountain scenery.' The prompt should be short, clear, and contain only the instruction.";
    const textPart = { text: analysisPrompt };

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, textPart] },
    });

    const generatedPrompt = response.text.trim();
    if (!generatedPrompt) {
      throw new Error("AI failed to generate a descriptive prompt.");
    }
    return generatedPrompt;
  }, [getAi]);


  // Mission Logic
  const handleRetrieveRepairManual = useCallback(() => {
    alert("System: Accessing Maintenance Log #739...\nAligning hinge axis to 34.5 degrees is recommended.");
  }, []);

  const handlePsychologicalStateCheck = useCallback(() => {
    // Protocol Steward Logic
    alert("Aegis Steward: Heart rate stable. Stress level nominal. \nRecommendation: Proceed with maintenance task.");
  }, []);

  const addArrow = useCallback((position?: Point) => {
    const start = position || getTargetPosition();
    const end = { x: start.x + 150, y: start.y };

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const width = Math.sqrt(dx * dx + dy * dy);
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    const centerPosition = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    addElement({
      type: 'arrow',
      start,
      end,
      position: centerPosition,
      width,
      height: 30,
      rotation,
      color: 'text-red-500',
    });
  }, [addElement, getTargetPosition]);

  const triggerImageUpload = (position?: Point) => {
    lastImagePosition.current = position || null;
    imageInputRef.current?.click();
  };

  const addImagesToCanvas = useCallback((files: File[], basePosition: Point) => {
    const imagePromises = files.map((file, index) => {
      return new Promise<Omit<ImageElement, 'id' | 'zIndex'> | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          if (!src) return resolve(null);

          const img = new Image();
          img.onload = () => {
            const MAX_DIMENSION = 300;
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
              if (width > height) {
                height = (height / width) * MAX_DIMENSION;
                width = MAX_DIMENSION;
              } else {
                width = (width / height) * MAX_DIMENSION;
                height = MAX_DIMENSION;
              }
            }
            const position = { x: basePosition.x + index * 20, y: basePosition.y + index * 20 };
            resolve({ type: 'image', position, src, width, height, rotation: 0 });
          };
          img.onerror = () => resolve(null);
          img.src = src;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(results => {
      const newElements = results.filter((el): el is Omit<ImageElement, 'id' | 'zIndex'> => el !== null);
      if (newElements.length > 0) {
        setElements(prev => [
          ...prev,
          ...newElements.map(el => ({
            ...el,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            zIndex: zIndexCounter.current++,
          } as CanvasElement))
        ]);
      }
    });
  }, [setElements]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const position = lastImagePosition.current || getTargetPosition();
    addImagesToCanvas(Array.from(files), position);

    lastImagePosition.current = null;

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [addImagesToCanvas, getTargetPosition]);

  const handleGenerate = useCallback(async (selectedElements: CanvasElement[]) => {
    const genAI = getAi();
    if (!genAI) return;

    const imageElements = selectedElements.filter(el => el.type === 'image' || el.type === 'drawing') as (ImageElement | DrawingElement)[];
    const noteElements = selectedElements.filter(el => el.type === 'note') as NoteElement[];

    if (imageElements.length === 0 && noteElements.length === 0) {
      alert("Please select at least one image, drawing, or note to provide context for generation.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages(null);

    try {
      const instructions = noteElements.map(note => note.content).join(' \n');
      let finalInstructions = instructions;
      if (imageStyle && imageStyle !== 'Default') {
        finalInstructions = instructions ? `${instructions}, ${imageStyle} Style` : `${imageStyle} Style`;
      }

      let parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[];

      if (imageElements.length > 0) {
        const imageParts = imageElements.filter(el => el.src).map(el => {
          const [header, data] = el.src.split(',');
          const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
          return { inlineData: { data, mimeType } };
        });

        const promptForEditing = finalInstructions || "Creatively reimagine and enhance the image(s).";
        const textPart = { text: promptForEditing };
        parts = [...imageParts, textPart];

      } else {
        const promptText = `Generate a completely new image based on this description: "${finalInstructions}"`;
        const textPart = { text: promptText };
        parts = [textPart];
      }

      const generateSingleImage = async () => {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            imageConfig: {
              aspectRatio: imageAspectRatio,
            }
          },
        });
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        return null;
      };

      const [image1, image2] = await Promise.all([generateSingleImage(), generateSingleImage()]);
      const validImages = [image1, image2].filter((img): img is string => img !== null);
      setGeneratedImages(validImages);

    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  }, [getAi, imageStyle, imageAspectRatio]);


  const handleSelectElement = useCallback((id: string | null, shiftKey: boolean) => {
    if (contextMenu) setContextMenu(null);

    if (id === null) {
      if (!shiftKey) setSelectedElementIds([]);
      return;
    }

    const clickedElement = elements.find(el => el.id === id);

    if (clickedElement?.groupId && !shiftKey) {
      const groupMemberIds = elements
        .filter(el => el.groupId === clickedElement.groupId)
        .map(el => el.id);
      setSelectedElementIds(groupMemberIds);
      return;
    }

    setSelectedElementIds(prevIds => {
      if (shiftKey) {
        return prevIds.includes(id) ? prevIds.filter(prevId => prevId !== id) : [...prevIds, id];
      } else {
        return prevIds.includes(id) ? prevIds : [id];
      }
    });
  }, [contextMenu, elements]);

  const handleMarqueeSelect = useCallback((ids: string[], shiftKey: boolean) => {
    setSelectedElementIds(prevIds => {
      if (shiftKey) {
        const newIds = ids.filter(id => !prevIds.includes(id));
        return [...prevIds, ...newIds];
      } else {
        return ids;
      }
    });
  }, []);


  const updateElements = useCallback((updatedElement: CanvasElement, dragDelta?: Point) => {
    setElements(prevElements => {
      const snap = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

      if (dragDelta && selectedElementIds.length > 1 && selectedElementIds.includes(updatedElement.id)) {
        const selectedSet = new Set(selectedElementIds);
        return prevElements.map(el => {
          if (el.id === updatedElement.id) {
            const snappedX = snap(updatedElement.position.x);
            const snappedY = snap(updatedElement.position.y);
            return { ...updatedElement, position: { x: snappedX, y: snappedY } } as CanvasElement;
          }
          if (selectedSet.has(el.id)) {
            const newX = el.position.x + dragDelta.x;
            const newY = el.position.y + dragDelta.y;
            return { ...el, position: { x: snap(newX), y: snap(newY) } } as CanvasElement;
          }
          return el;
        });
      } else {
        return prevElements.map(el => {
          if (el.id === updatedElement.id) {
            const snappedX = snap(updatedElement.position.x);
            const snappedY = snap(updatedElement.position.y);
            return { ...updatedElement, position: { x: snappedX, y: snappedY } } as CanvasElement;
          }
          return el;
        });
      }
    }, { addToHistory: false });
  }, [selectedElementIds, setElements, snapToGrid]);

  const updateMultipleElements = useCallback((updates: (Partial<CanvasElement> & { id: string })[], addToHistory: boolean = false) => {
    const updatesMap = new Map(updates.map(u => [u.id, u]));
    setElements(prev => prev.map(el => {
      if (updatesMap.has(el.id)) {
        return { ...el, ...updatesMap.get(el.id) } as CanvasElement;
      }
      return el;
    }), { addToHistory });
  }, [setElements]);

  const handleInteractionEnd = useCallback(() => {
    setElements(currentElements => currentElements, { addToHistory: true });
  }, [setElements]);

  const deleteElement = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.filter(el => !selectedSet.has(el.id)));
    setSelectedElementIds([]);
  }, [selectedElementIds, setElements]);

  const getSelectedGroupInfo = useMemo(() => {
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    if (selected.length === 0) return { canGroup: false, canUngroup: false, isGroup: false };

    const groupIds = new Set(selected.map(el => el.groupId).filter(Boolean));
    const hasUngrouped = selected.some(el => !el.groupId);

    const canGroup = selected.length > 1 && !(groupIds.size === 1 && !hasUngrouped);
    const canUngroup = selected.length > 0 && groupIds.size === 1 && !hasUngrouped;

    return { canGroup, canUngroup, isGroup: canUngroup };
  }, [elements, selectedElementIds]);

  const groupElements = useCallback(() => {
    if (!getSelectedGroupInfo.canGroup) return;
    const newGroupId = `group-${Date.now()}`;
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.map(el =>
      selectedSet.has(el.id) ? { ...el, groupId: newGroupId } as CanvasElement : el
    ));
  }, [selectedElementIds, setElements, getSelectedGroupInfo.canGroup]);

  const ungroupElements = useCallback(() => {
    if (!getSelectedGroupInfo.canUngroup) return;

    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    const groupIdToUngroup = selected[0]?.groupId;
    if (!groupIdToUngroup) return;

    setElements(prev => prev.map(el => {
      if (el.groupId === groupIdToUngroup) {
        const { groupId, ...rest } = el;
        return rest as CanvasElement;
      }
      return el;
    }));
  }, [elements, selectedElementIds, setElements, getSelectedGroupInfo.canUngroup]);

  // Alignment functionality
  const alignSelected = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    if (selected.length <= 1) return;

    let targetValue = 0;
    if (type === 'left') targetValue = Math.min(...selected.map(el => el.position.x - el.width / 2));
    if (type === 'center') targetValue = selected.reduce((acc, el) => acc + el.position.x, 0) / selected.length;
    if (type === 'right') targetValue = Math.max(...selected.map(el => el.position.x + el.width / 2));
    if (type === 'top') targetValue = Math.min(...selected.map(el => el.position.y - el.height / 2));
    if (type === 'middle') targetValue = selected.reduce((acc, el) => acc + el.position.y, 0) / selected.length;
    if (type === 'bottom') targetValue = Math.max(...selected.map(el => el.position.y + el.height / 2));

    const updates = selected.map(el => {
      let newPos = { ...el.position };
      if (type === 'left') newPos.x = targetValue + el.width / 2;
      if (type === 'center') newPos.x = targetValue;
      if (type === 'right') newPos.x = targetValue - el.width / 2;
      if (type === 'top') newPos.y = targetValue + el.height / 2;
      if (type === 'middle') newPos.y = targetValue;
      if (type === 'bottom') newPos.y = targetValue - el.height / 2;
      return { id: el.id, position: newPos };
    });

    updateMultipleElements(updates, true);
  }, [elements, selectedElementIds, updateMultipleElements]);

  const distributeSelected = useCallback((type: 'horizontal' | 'vertical') => {
    const selected = [...elements.filter(el => selectedElementIds.includes(el.id))];
    if (selected.length <= 2) return;

    if (type === 'horizontal') {
      // Sort by left edge
      selected.sort((a, b) => (a.position.x - a.width / 2) - (b.position.x - b.width / 2));
      const leftMost = selected[0].position.x - selected[0].width / 2;
      const rightMost = selected[selected.length - 1].position.x + selected[selected.length - 1].width / 2;
      const totalWidthOfItems = selected.reduce((sum, el) => sum + el.width, 0);
      const totalGap = (rightMost - leftMost) - totalWidthOfItems;
      const gap = totalGap / (selected.length - 1);

      let currentX = leftMost;
      const updates = selected.map((el, i) => {
        const newX = currentX + el.width / 2;
        currentX += el.width + gap;
        return {
          id: el.id,
          position: { ...el.position, x: newX }
        };
      });
      updateMultipleElements(updates, true);
    } else {
      // Sort by top edge
      selected.sort((a, b) => (a.position.y - a.height / 2) - (b.position.y - b.height / 2));
      const topMost = selected[0].position.y - selected[0].height / 2;
      const bottomMost = selected[selected.length - 1].position.y + selected[selected.length - 1].height / 2;
      const totalHeightOfItems = selected.reduce((sum, el) => sum + el.height, 0);
      const totalGap = (bottomMost - topMost) - totalHeightOfItems;
      const gap = totalGap / (selected.length - 1);

      let currentY = topMost;
      const updates = selected.map((el, i) => {
        const newY = currentY + el.height / 2;
        currentY += el.height + gap;
        return {
          id: el.id,
          position: { ...el.position, y: newY }
        };
      });
      updateMultipleElements(updates, true);
    }
  }, [elements, selectedElementIds, updateMultipleElements]);

  const tidyUpSelected = useCallback(() => {
    const selected = [...elements.filter(el => selectedElementIds.includes(el.id))];
    if (selected.length <= 1) return;

    // 1. 依照自然閱讀順序排序（先比 Y，差距不大再比 X）
    selected.sort((a, b) => {
      if (Math.abs(a.position.y - b.position.y) > 80) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });

    // 2. 智慧計算佈局參數
    const padding = 60;
    const avgW = selected.reduce((s, el) => s + el.width, 0) / selected.length;
    const avgH = selected.reduce((s, el) => s + el.height, 0) / selected.length;

    // 計算選取物件組的邊界
    const allCorners = selected.flatMap(el => {
      const halfW = el.width / 2;
      const halfH = el.height / 2;
      return [
        { x: el.position.x - halfW, y: el.position.y - halfH },
        { x: el.position.x + halfW, y: el.position.y + halfH }
      ];
    });
    const minX = Math.min(...allCorners.map(c => c.x));
    const minY = Math.min(...allCorners.map(c => c.y));
    const maxX = Math.max(...allCorners.map(c => c.x));
    const groupWidth = maxX - minX;

    // 決定欄數 (基於平均寬度與選取區域總寬度)
    let cols = Math.floor(groupWidth / (avgW + padding));
    if (cols < 1) cols = 1;
    if (cols > selected.length) cols = selected.length;

    // 使用最大寬度/高度作為網格單元大小
    const cellW = Math.max(...selected.map(el => el.width)) + padding;
    const cellH = Math.max(...selected.map(el => el.height)) + padding;

    const updates = selected.map((el, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      return {
        id: el.id,
        position: {
          x: minX + col * cellW + el.width / 2,
          y: minY + row * cellH + el.height / 2
        },
        rotation: 0 // 整理時順便歸零旋轉
      };
    });

    updateMultipleElements(updates, true);
  }, [elements, selectedElementIds, updateMultipleElements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (outpaintingState) {
        return;
      }

      const target = e.target as HTMLElement;
      const isEditingText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText) {
        e.preventDefault();
        deleteElement();
        return;
      }

      if (isCtrlOrCmd && !isEditingText) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key.toLowerCase() === 'g') {
          e.preventDefault();
          if (e.shiftKey) ungroupElements(); else groupElements();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteElement, undo, redo, outpaintingState, groupElements, ungroupElements]);

  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      preventDefaults(e);
      dragCounter.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        if (Array.from(e.dataTransfer.items).some(item => item.kind === 'file' && item.type.startsWith('image/'))) {
          setIsDraggingOver(true);
        }
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      preventDefaults(e);
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDraggingOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      preventDefaults(e);
      dragCounter.current = 0;
      setIsDraggingOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0 && canvasApiRef.current) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (imageFiles.length > 0) {
          const dropPoint = { x: e.clientX, y: e.clientY };
          const worldPoint = canvasApiRef.current.screenToWorld(dropPoint);
          addImagesToCanvas(imageFiles, worldPoint);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addImagesToCanvas]);

  const bringToFront = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const maxZ = Math.max(...elements.map(el => el.zIndex), 0);
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.map(el => selectedSet.has(el.id) ? { ...el, zIndex: maxZ + 1 } as CanvasElement : el));
    zIndexCounter.current = maxZ + 2;
  }, [selectedElementIds, elements, setElements]);

  const sendToBack = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const minZ = Math.min(...elements.map(el => el.zIndex), 0);
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.map(el => selectedSet.has(el.id) ? { ...el, zIndex: minZ - 1 } as CanvasElement : el));
  }, [selectedElementIds, elements, setElements]);

  const getResetViewCallback = useCallback((callback: () => void) => {
    setResetView(() => callback);
  }, []);

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const canChangeColor = selectedElements.some(el => el.type === 'note' || el.type === 'arrow');
  const showImageEditInMenu = selectedElements.length === 1 && selectedElements[0].type === 'image';

  const handleColorChange = (newColor: string) => {
    if (!canChangeColor) return;
    const selectedSet = new Set(selectedElementIds);
    setElements(prev => prev.map(el => {
      if (selectedSet.has(el.id)) {
        if (el.type === 'note') return { ...el, color: newColor } as CanvasElement;
        if (el.type === 'arrow') {
          const newTextColor = newColor.replace('bg-', 'text-');
          return { ...el, color: newTextColor } as CanvasElement;
        }
      }
      return el;
    }));
  };

  const downloadGeneratedImage = (imageUrl: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-canvas-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addGeneratedImageToCanvas = useCallback((imageUrl: string) => {
    if (!imageUrl) return;

    const src = imageUrl;
    const img = new Image();
    img.onload = () => {
      const MAX_DIMENSION = 400;
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_DIMENSION;
          width = MAX_DIMENSION;
        } else {
          width = (width / height) * MAX_DIMENSION;
          height = MAX_DIMENSION;
        }
      }
      addElement({
        type: 'image',
        position: getTargetPosition(),
        src,
        width,
        height,
        rotation: 0,
      });
    };
    img.src = src;
  }, [addElement, getTargetPosition]);

  const downloadImage = useCallback((elementId: string) => {
    if (!elementId) return;
    const element = elements.find(el => el.id === elementId);
    if (element && (element.type === 'image' || element.type === 'drawing') && element.src) {
      const link = document.createElement('a');
      link.href = element.src;
      const mimeType = element.src.match(/data:(.*);base64/)?.[1] || 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      link.download = `canvas-image-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [elements]);

  const handleCopyToClipboard = useCallback(async (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    try {
      if (element.type === 'note') {
        await navigator.clipboard.writeText(element.content);
      } else if (element.type === 'image' || element.type === 'drawing') {
        const response = await fetch(element.src);
        const blob = await response.blob();

        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [elements]);

  const handleCopySelection = useCallback(async () => {
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    if (selected.length === 0) return;

    if (selected.length === 1) {
      const el = selected[0];
      try {
        if (el.type === 'note') {
          await navigator.clipboard.writeText(el.content);
          return;
        } else if ((el.type === 'image' || el.type === 'drawing') && el.src) {
          const response = await fetch(el.src);
          const blob = await response.blob();
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          return;
        }
      } catch (err) {
        console.warn("Smart copy failed, falling back to JSON copy", err);
      }
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [elements, selectedElementIds]);

  const handlePasteFromClipboard = useCallback(async () => {
    const processTextContent = (text: string): boolean => {
      try {
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : [data];
        const validItems = items.filter((i: any) => i.type && i.position);

        if (validItems.length > 0) {
          const targetPos = getTargetPosition();
          const minX = Math.min(...validItems.map((i: any) => i.position.x));
          const minY = Math.min(...validItems.map((i: any) => i.position.y));

          const newElements = validItems.map((item: any) => ({
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            zIndex: zIndexCounter.current++,
            position: {
              x: item.position.x - minX + targetPos.x,
              y: item.position.y - minY + targetPos.y
            }
          }));

          setElements(prev => [...prev, ...newElements]);
          setSelectedElementIds(newElements.map((el: any) => el.id));
          return true;
        }
      } catch (e) { }

      const position = getTargetPosition();
      addElement({
        type: 'note',
        position,
        width: 200,
        height: 150,
        rotation: 0,
        content: text,
        color: COLORS[Math.floor(Math.random() * COLORS.length)].bg,
      });
      return true;
    };

    try {
      if (typeof navigator.clipboard.read === 'function') {
        try {
          const clipboardItems = await navigator.clipboard.read();
          let hasHandled = false;

          for (const item of clipboardItems) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src) {
                  const img = new Image();
                  img.onload = () => {
                    const MAX_DIMENSION = 300;
                    let { width, height } = img;
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                      if (width > height) {
                        height = (height / width) * MAX_DIMENSION;
                        width = MAX_DIMENSION;
                      } else {
                        width = (width / height) * MAX_DIMENSION;
                        height = MAX_DIMENSION;
                      }
                    }
                    addElement({
                      type: 'image',
                      position: getTargetPosition(),
                      src,
                      width,
                      height,
                      rotation: 0,
                    });
                  };
                  img.src = src;
                }
              };
              reader.readAsDataURL(blob);
              hasHandled = true;
              break;
            }

            if (!hasHandled && item.types.includes('text/plain')) {
              const blob = await item.getType('text/plain');
              const text = await blob.text();
              if (text) {
                hasHandled = processTextContent(text);
                if (hasHandled) break;
              }
            }
          }
          return;
        } catch (readErr: any) {
          const isNotAllowed = readErr.name === 'NotAllowedError' || readErr.message?.includes('denied');
          if (isNotAllowed) return;
          throw readErr;
        }
      } else {
        throw new Error("Clipboard API read not supported");
      }
    } catch (err) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) processTextContent(text);
      } catch (textErr) {
        console.error("Paste failed:", textErr);
      }
    }
  }, [addElement, getTargetPosition, setElements]);

  const handleContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent, worldPoint: Point, elementId: string | null) => {
    e.preventDefault();

    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;

    if (elementId && !selectedElementIds.includes(elementId)) {
      handleSelectElement(elementId, false);
    }
    setContextMenu({ x: point.clientX, y: point.clientY, worldPoint, elementId });

  }, [selectedElementIds, handleSelectElement]);

  const handleExportCanvas = () => {
    const elementsWithAnalysis = elements.map(el => {
      const analysis = analysisResults[el.id];
      if (analysis) {
        return { ...el, analysis };
      }
      return el;
    });

    const dataStr = JSON.stringify(elementsWithAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `infinite-canvas-export-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') throw new Error("File could not be read.");
        const data = JSON.parse(result);

        let finalElements: CanvasElement[] = [];
        let finalAnalysisResults: Record<string, AnalysisResult> = {};

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item && typeof item === 'object' && item.id) {
              const { analysis, ...elementData } = item;
              finalElements.push(elementData as CanvasElement);
              if (analysis) finalAnalysisResults[item.id] = analysis;
            }
          });
        } else if (data && typeof data === 'object' && Array.isArray(data.elements)) {
          finalElements = data.elements;
          finalAnalysisResults = data.analysisResults || {};
        } else {
          throw new Error("Invalid file format.");
        }

        setElements(finalElements);
        setAnalysisResults(finalAnalysisResults);
        setAnalysisVisibility({});

        const maxZ = Math.max(0, ...finalElements.map(el => el.zIndex || 0));
        zIndexCounter.current = maxZ + 1;
      } catch (error) {
        console.error("Error importing canvas:", error);
        alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = "";
  };

  const duplicateElement = useCallback((elementId: string) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (!elementToDuplicate) return;

    const commonProperties = {
      position: {
        x: elementToDuplicate.position.x + 20,
        y: elementToDuplicate.position.y + 20,
      },
      width: elementToDuplicate.width,
      height: elementToDuplicate.height,
      rotation: elementToDuplicate.rotation,
    };

    let newElement: Omit<NoteElement, 'id' | 'zIndex'> | Omit<ImageElement, 'id' | 'zIndex'> | Omit<DrawingElement, 'id' | 'zIndex'> | Omit<ArrowElement, 'id' | 'zIndex'>;

    switch (elementToDuplicate.type) {
      case 'note':
        newElement = { ...commonProperties, type: 'note', content: elementToDuplicate.content, color: elementToDuplicate.color, textAlign: elementToDuplicate.textAlign };
        break;
      case 'image':
        newElement = { ...commonProperties, type: 'image', src: elementToDuplicate.src };
        break;
      case 'drawing':
        newElement = { ...commonProperties, type: 'drawing', src: elementToDuplicate.src };
        break;
      case 'arrow':
        newElement = { ...commonProperties, type: 'arrow', start: { x: elementToDuplicate.start.x + 20, y: elementToDuplicate.start.y + 20 }, end: { x: elementToDuplicate.end.x + 20, y: elementToDuplicate.end.y + 20 }, color: elementToDuplicate.color };
        break;
      default:
        return;
    }
    addElement(newElement);
  }, [elements, addElement]);

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement;
      const isEditingText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isEditingText) return;

      event.preventDefault();
      const items = event.clipboardData?.items;
      if (!items) return;

      const position = getTargetPosition();
      const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) addImagesToCanvas([file], position);
        return;
      }

      const textItem = Array.from(items).find(item => item.type === 'text/plain');
      if (textItem) {
        textItem.getAsString(text => {
          addElement({ type: 'note', position, width: 200, height: 150, rotation: 0, content: text, color: COLORS[Math.floor(Math.random() * COLORS.length)].bg });
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addElement, addImagesToCanvas, getTargetPosition]);

  const handleAnalyzeElement = useCallback(async (elementId: string) => {
    const genAI = getAi();
    if (!genAI) return;

    const element = elements.find(el => el.id === elementId);
    if (!element || (element.type !== 'image' && element.type !== 'drawing') || !element.src) return;

    setAnalyzingElementId(elementId);
    try {
      const [header, data] = element.src.split(',');
      const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/png';
      const imagePart = { inlineData: { data, mimeType } };

      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            imagePart,
            { text: "Analyze this image. Provide a detailed description and 2-3 creative style or composition suggestions to help optimize a prompt for image generation." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const resultJson = JSON.parse(response.text);
      setAnalysisResults(prev => ({ ...prev, [elementId]: { en: { description: resultJson.description, suggestions: resultJson.suggestions } } }));
      setAnalysisVisibility(prev => ({ ...prev, [elementId]: true }));
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setAnalyzingElementId(null);
    }
  }, [getAi, elements]);

  const handleOptimizeNotePrompt = useCallback(async (elementId: string) => {
    const genAI = getAi();
    if (!genAI) return;
    const element = elements.find(el => el.id === elementId);
    if (!element || element.type !== 'note' || !element.content.trim()) return;
    setAnalyzingElementId(elementId);
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: element.content,
        config: {
          systemInstruction: `Optimize the prompt for image generation. Return JSON with 'description' and 'suggestions' array.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      const resultJson = JSON.parse(response.text);
      setAnalysisResults(prev => ({ ...prev, [elementId]: { en: resultJson } }));
      setAnalysisVisibility(prev => ({ ...prev, [elementId]: true }));
    } catch (error) {
      console.error("Optimization Error:", error);
    } finally {
      setAnalyzingElementId(null);
    }
  }, [getAi, elements]);

  const handleToggleAnalysisVisibility = useCallback((elementId: string) => {
    setAnalysisVisibility(prev => ({ ...prev, [elementId]: !prev[elementId] }));
  }, []);

  const handleClearAnalysis = useCallback((elementId: string) => {
    setAnalysisResults(prev => { const next = { ...prev }; delete next[elementId]; return next; });
    setAnalysisVisibility(prev => { const next = { ...prev }; delete next[elementId]; return next; });
  }, []);

  const handleTranslateAnalysis = useCallback(async (elementId: string) => {
    const genAI = getAi();
    if (!genAI) return;
    const analysis = analysisResults[elementId];
    if (!analysis || analysis.zh) return;
    setTranslatingElementId(elementId);
    try {
      const prompt = `Translate this JSON object values to Traditional Chinese. Keep structure:\n\n${JSON.stringify(analysis.en)}`;
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      setAnalysisResults(prev => ({ ...prev, [elementId]: { ...prev[elementId], zh: JSON.parse(response.text) } }));
    } catch (error) {
      console.error("Translation Error:", error);
    } finally {
      setTranslatingElementId(null);
    }
  }, [getAi, analysisResults]);


  const contextMenuElement = contextMenu?.elementId ? elements.find(el => el.id === contextMenu.elementId) : null;

  // ESG State
  const [bioInkLevel, setBioInkLevel] = useState(85);
  const [recyclingRate, setRecyclingRate] = useState(92);
  const [energyEfficiency, setEnergyEfficiency] = useState(98);

  // Bridge Logic
  const handleConnectToBambu = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8999/print', {
        method: 'GET',
      });
      const data = await response.json();
      if (data.success) {
        setNotification("BAMBU STUDIO LINK ESTABLISHED - REPAIR PROTOCOL INITIATED");
        setTimeout(() => setNotification(null), 5000);
      } else {
        alert("Launch Failed: " + data.message);
      }
    } catch (e) {
      alert("Bridge Unavailable. Please run 'python src/tools/bridge.py'");
    }
  }, []);

  const handleBioInkDepletion = useCallback(() => {
    // console.log("CRITICAL: Bio-ink depleted!");
  }, []);

  return (
    <main className="relative w-screen h-screen bg-slate-900 text-gray-100 font-sans overflow-hidden" onClick={() => setContextMenu(null)}>
      <SpaceBackground />
      <InfiniteCanvas
        ref={canvasApiRef}
        elements={elements}
        selectedElementIds={selectedElementIds}
        onSelectElement={handleSelectElement}
        onMarqueeSelect={handleMarqueeSelect}
        onUpdateElement={updateElements}
        onUpdateMultipleElements={updateMultipleElements}
        onInteractionEnd={handleInteractionEnd}
        setResetViewCallback={getResetViewCallback}
        onGenerate={handleGenerate}
        onContextMenu={(e, worldPoint, elementId) => {
          e.preventDefault();
          const point = 'touches' in e ? e.touches[0] : e;
          setContextMenu({ x: point.clientX, y: point.clientY, worldPoint, elementId });
        }}
        onMouseMove={handleCanvasMouseMove}
        onViewportChange={handleViewportChange}
        imageStyle={imageStyle}
        onSetImageStyle={setImageStyle}
        imageAspectRatio={imageAspectRatio}
        onSetImageAspectRatio={setImageAspectRatio}
        outpaintingState={outpaintingState}
        onUpdateOutpaintingFrame={handleUpdateOutpaintingFrame}
        onCancelOutpainting={handleCancelOutpainting}
        onOutpaintingGenerate={handleOutpaintingGenerate}
        onAutoPromptGenerate={handleAutoPromptGenerate}
        interactionMode={interactionMode}
        t={t}
        language={language}
        analysisResults={analysisResults}
        analyzingElementId={analyzingElementId}
        onAnalyzeElement={handleAnalyzeElement}
        onOptimizeNotePrompt={handleOptimizeNotePrompt}
        analysisVisibility={analysisVisibility}
        onToggleAnalysisVisibility={handleToggleAnalysisVisibility}
        onClearAnalysis={handleClearAnalysis}
        onTranslateAnalysis={handleTranslateAnalysis}
        translatingElementId={translatingElementId}
        sidebarOffset={!isMenuCollapsed && panelAlignment === 'left' ? 288 : 0}
      />


      {/* EVA SYSTEM WATERMARK */}
      <div className="absolute top-6 left-6 z-[60] pointer-events-none select-none">
        <h1 className="text-4xl font-black text-white/20 tracking-[0.2em] font-mono border-l-4 border-white/20 pl-4">
          EVA SYSTEM
        </h1>
        <p className="text-[10px] text-white/10 uppercase tracking-[0.5em] pl-4 mt-1">
          ADVANCED BIOMETRIC CONTROL
        </p>
      </div>

      <TelemetryPanel t={t} visible={!isMenuCollapsed} isEmergency={isEmergency} />



      {/* Dynamic Notification Banner */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div className="px-6 py-3 bg-slate-900/90 backdrop-blur-md border border-[#00E5FF]/50 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center gap-3">
            <span className="text-2xl animate-pulse">🌿</span>
            <span className="font-mono text-[#00E5FF] text-sm tracking-wider">{notification}</span>
          </div>
        </div>
      )}

      {/* Full Screen Amber Alert Overlay */}
      {isEmergency && !showAROverlay && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="bg-amber-500/10 absolute inset-0 animate-pulse"></div>
          <div className="border-y-4 border-amber-500/50 w-full py-10 bg-black/40 backdrop-blur-sm text-center transform rotate-0">
            <h1 className="text-6xl font-black text-amber-500 tracking-[1rem] animate-pulse">PROTOCOL AEGIS</h1>
            <p className="text-amber-300 font-mono mt-4 text-xl tracking-widest">ESA-496: BIOMETRIC DRIFT DETECTED</p>
          </div>
        </div>
      )}

      {/* Demo Trigger Button (Bottom Left) */}
      <button
        onClick={triggerCalmingProtocol}
        className="absolute bottom-8 left-8 z-50 p-4 bg-slate-800 hover:bg-slate-700 text-amber-500 rounded-full shadow-lg border border-slate-600 transition-all hover:scale-110 active:scale-95 group"
        title="SIMULATE HIGH STRESS (Triggers Calming Protocol)"
      >
        <span className="text-xl group-hover:animate-spin">⚠️</span>
      </button>

      {/* EMERGENCY SCENARIO OVERLAYS */}
      {/* EMERGENCY SCENARIO OVERLAYS */}
      {isEmergency && emergencyStep === 'alert' && (
        <div
          onClick={() => setEmergencyStep('breathing')}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 cursor-pointer transition-all duration-1000"
        >
          <h1 className="text-4xl font-light text-teal-300 tracking-[0.3em] border-y border-teal-500/50 py-4 px-12 bg-teal-950/60 backdrop-blur-md animate-fadeIn">
            PSYCHOLOGICAL SUPPORT PROTOCOL
          </h1>
          <p className="mt-8 text-teal-400/50 text-sm tracking-widest animate-pulse font-mono">
            [ CLICK ANYWHERE TO INITIATE ]
          </p>
        </div>
      )}

      {(emergencyStep === 'breathing' || emergencyStep === 'focus') && (
        <div className="absolute inset-0 z-40 overflow-hidden animate-fadeIn">
          <style>{`
            @keyframes cinematic {
              from { opacity: 0; transform: scale(1.2); filter: blur(20px); }
              to { opacity: 0.6; transform: scale(1); filter: blur(0px); }
            }
            @keyframes gradient-overlay {
              from { opacity: 0; background-position: 0% 100%; }
              to { opacity: 1; background-position: 0% 0%; }
            }
          `}</style>
          {/* Forest Background */}
          <img
            src="/forest.gif" // Updated to GIF
            alt="Forest"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: 'cinematic 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-teal-900/10 to-black/40 mix-blend-overlay"
            style={{ animation: 'gradient-overlay 3s ease-out forwards' }}
          ></div>

          {/* Text Interaction */}
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div
              onClick={() => {
                if (emergencyStep === 'breathing') handleBreathingClick();
                if (emergencyStep === 'focus') setShowAROverlay(true);
              }}
              className={`
                            cursor-pointer transition-all duration-1000 transform
                            flex flex-col items-center justify-center gap-6 relative
                            ${emergencyStep === 'breathing' ? 'hover:scale-105' : 'hover:scale-105'}
                        `}
            >
              {emergencyStep === 'breathing' ? (
                <>
                  {/* Breathing Animation Circle */}
                  <div className={`absolute w-[500px] h-[500px] rounded-full border border-teal-400/30 opacity-50 ${breathingText === 'BREATHE IN' ? 'animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]' : 'scale-90 duration-[4000ms] transition-transform ease-in-out'}`}></div>
                  <div className={`absolute w-[300px] h-[300px] rounded-full bg-teal-500/10 blur-3xl ${breathingText === 'BREATHE IN' ? 'animate-pulse' : 'opacity-20 transition-opacity duration-[4000ms]'}`}></div>

                  <h2 className="text-6xl font-thin text-white tracking-[0.2em] drop-shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all duration-1000">
                    {breathingText}
                  </h2>
                  <p className="text-teal-200/80 text-sm font-mono tracking-widest mt-8 animate-pulse">
                    [ CLICK TO SYNC BIOMETRICS ]
                  </p>
                </>
              ) : (
                <div className="p-12 rounded-2xl border border-cyan-400/30 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(34,211,238,0.1)] group">
                  <h2 className="text-4xl font-bold text-cyan-400 tracking-widest border-b border-cyan-500/30 pb-4 mb-2 group-hover:text-cyan-300 transition-colors">
                    SMALL TASK FOCUS
                  </h2>
                  <p className="text-cyan-500/60 text-xs font-mono text-center tracking-widest mt-2 group-hover:text-cyan-400">
                    INITIATE ALIGNMENT SEQUENCE &gt;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAROverlay && (
        <ARAlignmentOverlay isOpen={showAROverlay} onComplete={handleARComplete} t={t} />
      )}

      {/* HUD Overlay (Right Side now) */}
      {/* HUD Overlay (Top Center) */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 backdrop-blur-md text-green-400 border border-green-500/50 px-4 py-2 rounded-lg font-mono text-sm shadow-[0_0_15px_rgba(74,222,128,0.2)]`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          {t('currentProtocol')}: {t('standby')}
        </div>
      </div>

      {/* Existing Side Panel (Right) */}
      <div
        className={`absolute top-4 z-20 p-4 bg-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700 w-72 flex flex-col gap-4 transition-all duration-300 ease-in-out ${isMenuCollapsed ? 'translate-x-full' : 'translate-x-0'} right-4 max-h-[calc(100vh-2rem)] overflow-y-auto`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-blue-400 flex items-center gap-1">
              <span className="text-2xl">🛡️</span> {t('missionSectorAlpha')}
            </h1>
            <p className="text-[10px] text-blue-300 uppercase tracking-widest font-black">{t('aegisSteward')} <span className="text-slate-500">| {t('systemActive')}</span></p>
          </div>
        </div>



        {/* ESG Panel (Moved Inside) */}
        <ESGPanel
          t={t}
          bioInkLevel={bioInkLevel}
          recyclingRate={recyclingRate}
          energyEfficiency={energyEfficiency}
          onBioInkDepletion={handleBioInkDepletion}
          className=" mb-2 border-none bg-slate-800/50"
        />


        {/* Mission Progress */}
        <div className="border border-slate-600 rounded-lg p-3 bg-slate-800/50 backdrop-blur-sm">
          <h2 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">{t('missionProgress')}</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>{t('orbitSync')}</span>
                <span className="text-blue-400">98%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>{t('systemIntegrity')}</span>
                <span className="text-green-400">100%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>



        {/* 3D Print Queue */}
        <div className="border border-slate-600 rounded-lg p-3 bg-slate-800/50 backdrop-blur-sm">
          <h2 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">{t('printQueue')}</h2>
          <div className="flex items-center gap-2 text-xs bg-slate-900/80 p-2 rounded border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <div className="flex-1">
              <div className="text-orange-300 font-bold">{t('valveAdaptor')}</div>
              <div className="text-gray-500 text-[10px]">{t('printing')} 45%</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-gray-500 text-center uppercase tracking-widest">{t('printerStatus')}</div>
        </div>

        {/* Physical Repair Bridge */}
        <button
          onClick={handleConnectToBambu}
          className="w-full py-2 bg-gradient-to-r from-emerald-900 to-slate-900 hover:from-emerald-800 hover:to-slate-800 border border-emerald-500/50 rounded-lg text-emerald-400 font-mono text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 group"
        >
          <span className="group-hover:animate-spin">⚙️</span>
          {t('initiatePhysicalRepair')}
        </button>

        <div className="border-t border-slate-700 pt-3 flex flex-col gap-2">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{t('moduleConfig')}</h2>

          {selectedElementIds.length > 1 ? (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <div className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-bold">{t('positionSync')}</div>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => alignSelected('left')} title={t('alignLeft')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex justify-center transition-colors text-gray-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20M8 6h12M8 12h8M8 18h10" /></svg>
                </button>
                <button onClick={() => alignSelected('center')} title={t('alignCenter')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex justify-center transition-colors text-gray-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M6 6h12M8 12h8M6 18h12" /></svg>
                </button>
                <button onClick={() => alignSelected('right')} title={t('alignRight')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex justify-center transition-colors text-gray-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 2v20M4 6h12M8 12h8M4 18h10" /></svg>
                </button>
                <button onClick={() => alignSelected('top')} title={t('alignTop')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex justify-center transition-colors text-gray-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4h20M6 8v12M12 8v8M18 8v10" /></svg>
                </button>
                <button onClick={() => alignSelected('middle')} title={t('alignMiddle')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex justify-center transition-colors text-gray-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M6 6h12M12 8h8M18 6h6" /></svg>
                </button>
                <button onClick={() => alignSelected('bottom')} title={t('alignBottom')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex justify-center transition-colors text-gray-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M6 4v12M12 4v8M18 4v10" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 border border-slate-700 border-dashed rounded-lg text-center">
              <p className="text-[10px] text-gray-500 italic">{t('selectModulesToSync')}</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-700">
          <button onClick={toggleLanguage} className="w-full px-3 py-2 text-xs font-bold bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600">{t('changeLanguage')}</button>
        </div>

      </div>

      <button
        onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
        className="absolute top-4 z-20 p-2.5 bg-slate-800/90 backdrop-blur-md rounded-full shadow-xl border border-slate-700 hover:bg-slate-700 transition-all duration-300 ease-in-out"
        style={{ [panelAlignment]: isMenuCollapsed ? '1rem' : 'calc(1rem + 18rem + 0.5rem)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-300 transition-transform ${isMenuCollapsed ? (panelAlignment === 'left' ? 'rotate-180' : '') : (panelAlignment === 'left' ? '' : 'rotate-180')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>



      <div className={`transition-all duration-300 ease-in-out absolute bottom-4 z-20 ${!isMenuCollapsed ? 'right-[320px]' : 'right-4'}`}>
        <Minimap elements={elements} viewport={viewport} onPanTo={handlePanTo} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      </div>

      {
        isGenerating && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-400/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🍌</div>
            </div>
            <p className="mt-6 text-xl font-black tracking-widest uppercase">{t('generatingImages')}</p>
            <p className="text-blue-300 animate-pulse">{t('thisMayTakeAMoment')}</p>
          </div>
        )
      }

      {
        generatedImages && generatedImages.length > 0 && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setGeneratedImages(null)}>
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800">{t('chooseAnImage')}</h2>
                <button onClick={() => setGeneratedImages(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                {generatedImages.map((imgSrc, index) => (
                  <div key={index} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex flex-col">
                    <img src={imgSrc} className="w-full h-auto object-contain max-h-[50vh]" />
                    <div className="p-4 flex gap-3 bg-white border-t">
                      <button onClick={() => addGeneratedImageToCanvas(imgSrc)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">{t('addToCanvas')}</button>
                      <button onClick={() => downloadGeneratedImage(imgSrc)} className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {
        contextMenu && (
          <ContextMenu
            menuData={contextMenu}
            onClose={() => setContextMenu(null)}
            actions={{
              addNote, addArrow, addDrawing,
              startOutpainting: handleStartOutpainting,
              addImage: triggerImageUpload, deleteElement, bringToFront, sendToBack,
              changeColor: handleColorChange, downloadImage, duplicateElement,
              toggleLanguage, groupElements, ungroupElements,
              copyToClipboard: handleCopyToClipboard,
              tidyUp: tidyUpSelected,
              retrieveRepairManual: handleRetrieveRepairManual,
              psychologicalStateCheck: handlePsychologicalStateCheck,
            }}
            canChangeColor={canChangeColor}
            canGroup={getSelectedGroupInfo.canGroup}
            canUngroup={getSelectedGroupInfo.canUngroup}
            selectedCount={selectedElementIds.length}
            elementType={contextMenuElement?.type || null}
            t={t}
          />
        )
      }

      {
        isDraggingOver && (
          <div className="absolute inset-0 z-[100] bg-blue-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none border-8 border-dashed border-blue-500 m-4 rounded-3xl">
            <div className="bg-white p-10 rounded-3xl shadow-2xl text-center">
              <span className="text-6xl mb-4 block">📸</span>
              <p className="text-2xl font-black text-gray-800">Drop to import images</p>
            </div>
          </div>
        )
      }
    </main >
  );
};

export default App;
