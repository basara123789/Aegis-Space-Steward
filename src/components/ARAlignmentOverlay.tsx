import React, { useState, useEffect } from 'react';

interface ARAlignmentOverlayProps {
    isOpen: boolean;
    onComplete: () => void;
    t: (key: string) => string;
}

export const ARAlignmentOverlay: React.FC<ARAlignmentOverlayProps> = ({ isOpen, onComplete, t }) => {
    const [alignment, setAlignment] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAlignment(0);
            setIsLocked(false);
        }
    }, [isOpen]);

    const handleAlignClick = () => {
        if (isLocked) return;

        // Simulate "locking in" effect
        setIsLocked(true);
        setTimeout(() => {
            onComplete();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            {/* HUD Layer */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 text-[#00E5FF] font-mono text-xs tracking-widest opacity-70">
                    PROTOCOL: AEGIS<br />
                    LAYER: B2108<br />
                    STATUS: <span className="text-amber-500 animate-pulse">ALIGNMENT REQUIRED</span>
                </div>

                {/* Corner Brackets */}
                <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#00E5FF]/50 rounded-tl-lg"></div>
                <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#00E5FF]/50 rounded-tr-lg"></div>
                <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#00E5FF]/50 rounded-bl-lg"></div>
                <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#00E5FF]/50 rounded-br-lg"></div>
            </div>

            {/* Interactive Core */}
            <div className="relative w-96 h-96 flex items-center justify-center">
                {/* Rotating Outer Ring */}
                <div className="absolute inset-0 border border-[#00E5FF]/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-4 border border-dashed border-[#00E5FF]/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                {/* Target Polygon (Static Guide) */}
                <div className="absolute w-48 h-48 border-2 border-amber-500/50 rotate-45 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                </div>

                {/* User Polygon (Interactive) - Simply clickable for MVP, could be draggable later */}
                <button
                    onClick={handleAlignClick}
                    className={`
                absolute w-48 h-48 border-2 transition-all duration-700 ease-out flex items-center justify-center group
                ${isLocked
                            ? 'border-[#00E5FF] rotate-45 scale-100 bg-[#00E5FF]/10 shadow-[0_0_30px_#00E5FF]'
                            : 'border-white rotate-12 scale-110 hover:scale-105 hover:rotate-6 hover:border-[#00E5FF] cursor-crosshair'
                        }
            `}
                >
                    {isLocked ? (
                        <span className="text-[#00E5FF] font-black tracking-widest text-xl animate-pulse">LOCKED</span>
                    ) : (
                        <span className="text-white/50 font-mono text-xs group-hover:text-[#00E5FF]">CLICK TO ALIGN</span>
                    )}
                </button>
            </div>

            <div className="absolute bottom-20 text-center font-mono text-gray-400 text-sm">
                <p>MANUAL OVERRIDE ENGAGED</p>
                <p className="text-xs opacity-50 mt-1">Align the cognitive stabilizers to restore system harmony.</p>
            </div>
        </div>
    );
};
