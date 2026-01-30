
import React, { useRef, useEffect, useState } from 'react';
import type { Point, ElementType } from '../types';
import { COLORS } from '../App';

interface ContextMenuData {
    x: number;
    y: number;
    worldPoint: Point;
    elementId: string | null;
}

interface ContextMenuProps {
    menuData: ContextMenuData;
    onClose: () => void;
    actions: {
        addNote: (position: Point) => void;
        addArrow: (position?: Point) => void;
        addDrawing: (position?: Point) => void;
        startOutpainting: (elementId: string) => void;
        addImage: (position?: Point) => void;
        deleteElement: () => void;
        bringToFront: () => void;
        sendToBack: () => void;
        changeColor: (color: string) => void;
        downloadImage: (elementId: string) => void;
        duplicateElement: (elementId: string) => void;
        toggleLanguage: () => void;
        groupElements: () => void;
        ungroupElements: () => void;
        copyToClipboard: (elementId: string) => void;
        tidyUp: () => void;
        retrieveRepairManual: () => void;
        psychologicalStateCheck: () => void;
    };
    canChangeColor: boolean;
    canGroup: boolean;
    canUngroup: boolean;
    selectedCount: number;
    elementType: ElementType | null;
    t: (key: string) => string;
}

const MenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; className?: string }> = ({ onClick, children, disabled, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 disabled:text-gray-600 disabled:bg-transparent flex items-center gap-2 ${className || ''}`}
    >
        {children}
    </button>
);

export const ContextMenu: React.FC<ContextMenuProps> = ({ menuData, onClose, actions, canChangeColor, canGroup, canUngroup, selectedCount, elementType, t }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [colorSubMenuVisible, setColorSubMenuVisible] = useState(false); // Kept for type safety though likely unused

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // ... existing logic
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleAction = (action: Function) => {
        action();
        onClose();
    };

    const showTechSpecs = () => {
        alert("Technical Specifications:\nModel: MK-IV Life Support Node\nstatus: Nominal\nLast Service: 2049-05-12");
        onClose();
    };

    const showMaintenanceHistory = () => {
        alert("Maintenance History:\n2049-01: Filter Replacement\n2048-11: Pressure Valve calibration");
        onClose();
    };

    const menuStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${menuData.x}px`,
        top: `${menuData.y}px`,
        zIndex: 50,
    };

    const isHinge = menuData.elementId === 'life-support-hinge';

    return (
        <div
            ref={menuRef}
            style={menuStyle}
            className="w-56 rounded-md bg-slate-800 border border-slate-600 shadow-xl ring-1 ring-black ring-opacity-50 focus:outline-none py-1 text-gray-200"
            onClick={(e) => e.stopPropagation()}
        >
            {menuData.elementId || selectedCount > 0 ? (
                // Element(s) Menu
                <>
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-slate-700 mb-1">
                        Equipment Controls
                    </div>
                    {/* Equipment Special Menu */}
                    {isHinge || (menuData.elementId?.startsWith('o2-') || menuData.elementId?.startsWith('water-') || menuData.elementId?.startsWith('comm-')) ? (
                        <>
                            <MenuItem onClick={() => handleAction(actions.retrieveRepairManual)} className="text-blue-400 font-bold hover:bg-slate-700">
                                🛠️ {t('retrieveRepairManual') || '檢索維修手冊'}
                            </MenuItem>
                            <MenuItem onClick={() => handleAction(actions.psychologicalStateCheck)} className="text-purple-400 font-bold hover:bg-slate-700">
                                🧠 {t('psychologicalStateCheck') || '心理狀態檢查'}
                            </MenuItem>
                            {menuData.elementId?.startsWith('o2-') && (
                                <MenuItem onClick={() => alert("Initiating 3D Print Sequence: O2 Valve Node...")} className="text-orange-400 font-bold hover:bg-slate-700">
                                    🖨️ 3D Print Repair Part
                                </MenuItem>
                            )}
                            <div className="border-t my-1 border-slate-700" />
                        </>
                    ) : null}

                    <MenuItem onClick={showTechSpecs} className="text-cyan-400 font-bold hover:bg-slate-700">
                        📊 Technical Specs
                    </MenuItem>
                    <MenuItem onClick={showMaintenanceHistory} className="text-orange-400 font-bold hover:bg-slate-700">
                        📜 Maintenance History
                    </MenuItem>

                    <div className="border-t my-1 border-slate-700" />

                    {selectedCount > 1 && (
                        <>
                            <MenuItem onClick={() => handleAction(actions.tidyUp)} className="text-indigo-400 font-bold hover:bg-slate-700">
                                Tidy Up
                            </MenuItem>
                            <div className="border-t my-1 border-slate-700" />
                        </>
                    )}

                    {canGroup && <MenuItem onClick={() => handleAction(actions.groupElements)} className="hover:bg-slate-700">{t('group')}</MenuItem>}
                    {canUngroup && <MenuItem onClick={() => handleAction(actions.ungroupElements)} className="hover:bg-slate-700">{t('ungroup')}</MenuItem>}

                    <div className="border-t my-1 border-slate-700" />

                    <MenuItem onClick={() => handleAction(actions.bringToFront)} className="hover:bg-slate-700">{t('bringToFront')}</MenuItem>
                    <MenuItem onClick={() => handleAction(actions.sendToBack)} className="hover:bg-slate-700">{t('sendToBack')}</MenuItem>

                    <div className="border-t my-1 border-slate-700" />
                    <MenuItem onClick={() => handleAction(actions.deleteElement)} className="text-red-400 hover:bg-slate-700">{t('delete')}</MenuItem>
                </>
            ) : (
                // Canvas Menu
                <>
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-slate-700 mb-1">
                        Sector Actions
                    </div>
                    <MenuItem onClick={() => alert("Scanning Sector...")} className="hover:bg-slate-700">📡 Scan Sector</MenuItem>
                    <MenuItem onClick={() => alert("Reporting Anomaly...")} className="hover:bg-slate-700">⚠️ Report Anomaly</MenuItem>
                    <div className="border-t my-1 border-slate-700" />
                    <MenuItem onClick={() => handleAction(actions.toggleLanguage)} className="hover:bg-slate-700">{t('changeLanguage')}</MenuItem>
                </>
            )}
        </div>
    );
};
