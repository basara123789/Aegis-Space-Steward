import React from 'react';
import type { Point } from '../types';

interface HexGridBackgroundProps {
    pan: Point;
    zoom: number;
}

export const HexGridBackground: React.FC<HexGridBackgroundProps> = ({ pan, zoom }) => {
    const R = 160; // Radius (Center to Vertex)
    const W = Math.sqrt(3) * R; // Width (Flat to Flat)
    const H = 2 * R; // Height (Vertex to Vertex)

    // Pattern dimensions to ensure seamless tiling
    // We need a tile that repeats.
    // Standard hex grid tile is W wide and 3*R high (covering 2 vertical steps)
    // But wait, horizontal repeat is W. Vertical repeat is 3*R (distance between row N and row N+2)

    const patternWidth = W;
    const patternHeight = 3 * R;

    // Path for one hexagon (pointy topped) placed at (cx, cy)
    // Vertices: (0,-R), (W/2,-R/2), (W/2,R/2), (0,R), (-W/2,R/2), (-W/2,-R/2)
    // We'll construct a path relative to 0,0

    const createHexPath = (cx: number, cy: number) => {
        const w2 = W / 2;
        const r2 = R / 2;
        // Points relative to cx, cy
        return `M ${cx} ${cy - R} 
            L ${cx + w2} ${cy - R / 2} 
            L ${cx + w2} ${cy + R / 2} 
            L ${cx} ${cy + R} 
            L ${cx - w2} ${cy + R / 2} 
            L ${cx - w2} ${cy - R / 2} 
            Z`;
    };

    return (
        <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 0 }}
        >
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern
                        id="hex-grid-pattern"
                        x={pan.x % (patternWidth * zoom)}
                        y={pan.y % (patternHeight * zoom)}
                        width={patternWidth * zoom}
                        height={patternHeight * zoom}
                        patternUnits="userSpaceOnUse"
                    >
                        <g transform={`scale(${zoom})`}>
                            {/* 
                  We need to draw enough partial hexes to cover the tile.
                  Center 1: (0, 0)
                  Center 2: (W/2, 1.5R)
                  Also corners to fill gaps?
                  (0,0) covers corners (0,0), (W,0), (0, 3R), (W, 3R)
                  (W/2, 1.5R) covers the middle shift.
              */}
                            <path
                                d={`${createHexPath(0, 0)} ${createHexPath(W / 2, 1.5 * R)} ${createHexPath(W, 0)} ${createHexPath(0, 3 * R)} ${createHexPath(W, 3 * R)}`}
                                fill="none"
                                stroke="#1e293b" // slate-800
                                strokeWidth="2"
                                strokeOpacity="0.5"
                            />
                        </g>
                    </pattern>
                    <radialGradient id="fade-mask-gradient">
                        <stop offset="60%" stopColor="white" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <mask id="fade-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="url(#fade-mask-gradient)" />
                    </mask>
                </defs>

                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="url(#hex-grid-pattern)"
                    mask="url(#fade-mask)"
                />
            </svg>
        </div>
    );
};
