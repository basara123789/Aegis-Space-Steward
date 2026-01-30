import React, { useEffect, useState } from 'react';
import { Leaf, FlaskConical, Zap, AlertTriangle, Recycle } from 'lucide-react';
import { cn } from '../tools/cn.ts';

interface ESGPanelProps {
  bioInkLevel: number;
  recyclingRate: number;
  energyEfficiency: number;
  inventory?: {
    h2o: number;
    power: number;
    medKits: number;
  };
  onBioInkDepletion: () => void;
  className?: string; // Allow custom classNames
  t: (key: string) => string;
}

export const ESGPanel: React.FC<ESGPanelProps> = ({
  bioInkLevel,
  recyclingRate,
  energyEfficiency,
  inventory = { h2o: 2, power: 8, medKits: 3 }, // Defaults
  onBioInkDepletion,
  className,
  t
}) => {
  const [isCrisis, setIsCrisis] = useState(false);

  useEffect(() => {
    if (bioInkLevel < 20) {
      setIsCrisis(true);
      onBioInkDepletion();
    } else {
      setIsCrisis(false);
    }
  }, [bioInkLevel, onBioInkDepletion]);

  return (
    <div className={cn(
      "p-4 rounded-lg border backdrop-blur-md transition-all duration-300",
      "bg-amber-950/30 border-amber-500/30 text-amber-100",
      className
    )}>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-amber-500/30 pb-2">
        <Leaf className="w-5 h-5 text-green-400" />
        <span>{t('esgMonitor')}</span>
      </h2>

      <div className="space-y-6">
        {/* Bio-ink Level */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-400" /> {t('bioInkReserves')}
            </span>
            <span className={cn("font-mono font-bold", bioInkLevel < 20 ? "text-red-500 animate-pulse" : "text-cyan-300")}>
              {bioInkLevel}%
            </span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-amber-900/50">
            <div
              className={cn("h-full transition-all duration-500",
                bioInkLevel < 20 ? "bg-red-500 animate-pulse" : "bg-cyan-500"
              )}
              style={{ width: `${bioInkLevel}%` }}
            />
          </div>
          {isCrisis && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse mt-1 bg-red-950/50 p-2 rounded border border-red-500/50">
              <AlertTriangle className="w-4 h-4" />
              {t('logisticCrisis')}
            </div>
          )}
        </div>

        {/* Waste Recycling Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Recycle className="w-4 h-4 text-green-400" /> {t('recyclingRate')}
            </span>
            <span className="font-mono font-bold text-green-300">{recyclingRate}%</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-amber-900/50">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${recyclingRate}%` }}
            />
          </div>
        </div>

        {/* Energy Efficiency */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> {t('energyEfficiency')}
            </span>
            <span className="font-mono font-bold text-yellow-300">{energyEfficiency}%</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-amber-900/50">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${energyEfficiency}%` }}
            />
          </div>
        </div>

        {/* Inventory Section (Merged) */}
        <div className="pt-4 border-t border-amber-900/30 space-y-3">
          <h3 className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">{t('physicalInventory')}</h3>
          <ul className="text-xs space-y-2 text-amber-200/80">
            <li className="flex justify-between items-center group">
              <span className="flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
                <span className="text-cyan-500">💧</span> {t('h2oFilters')}
              </span>
              <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-cyan-400">{inventory.h2o} {t('units')}</span>
            </li>
            <li className="flex justify-between items-center group">
              <span className="flex items-center gap-2 group-hover:text-green-300 transition-colors">
                <span className="text-green-500">🔋</span> {t('powerCells')}
              </span>
              <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-green-400">{inventory.power} {t('units')}</span>
            </li>
            <li className="flex justify-between items-center group">
              <span className="flex items-center gap-2 group-hover:text-red-300 transition-colors">
                <span className="text-red-500">💊</span> {t('medKits')}
              </span>
              <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-red-400">{inventory.medKits} {t('units')}</span>
            </li>
          </ul>
        </div>

        {/* Radar Chart Section */}
        <div className="pt-4 border-t border-amber-900/30 flex justify-center pb-2">
          <ESG_RadarChart
            data={[
              { label: t('lblBioInk'), value: bioInkLevel, fullMark: 100, color: '#22d3ee' },   // Cyan
              { label: t('lblRecycle'), value: recyclingRate, fullMark: 100, color: '#4ade80' }, // Green
              { label: t('lblEnergy'), value: energyEfficiency, fullMark: 100, color: '#facc15' },// Yellow
              { label: t('lblH2o'), value: Math.min((inventory.h2o / 5) * 100, 100), fullMark: 100, color: '#38bdf8' }, // Sky
              { label: t('lblPower'), value: Math.min((inventory.power / 10) * 100, 100), fullMark: 100, color: '#a3e635' }, // Lime
              { label: t('lblMeds'), value: Math.min((inventory.medKits / 5) * 100, 100), fullMark: 100, color: '#f87171' }, // Red
            ]}
          />
        </div>
      </div>

      {/* Decorative Footer */}
      <div className="mt-2 text-[10px] text-amber-500/40 text-center font-mono tracking-widest uppercase">
        ESG-PROTO-V.2.5.1 // UN Sustainability Goals Active
      </div>
    </div>
  );
};

// Enhanced SVG Radar Chart Component
const ESG_RadarChart = ({ data }: { data: { label: string; value: number; fullMark: number; color: string }[] }) => {
  const size = 180;
  const center = size / 2;
  const radius = (size / 2) - 30; // Padding for labels

  // Helper to calculate points
  const getPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const points = data.map((d, i) => getPoint(d.value, i, data.length));
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Background Web
  const levels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Web Grid */}
        {levels.map((level, i) => (
          <polygon
            key={i}
            points={data.map((_, index) => {
              const { x, y } = getPoint(100 * level, index, data.length);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#4b5563"
            strokeOpacity="0.3"
            strokeWidth="1"
            strokeDasharray={i === levels.length - 1 ? "0" : "4 2"}
          />
        ))}

        {/* Axes */}
        {data.map((d, i) => {
          const { x, y } = getPoint(100, i, data.length);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke={d.color} strokeOpacity="0.2" strokeWidth="1" />;
        })}

        {/* Data Polygon with Gradient */}
        <polygon
          points={polygonPoints}
          fill="url(#radar-gradient)"
          stroke="#22d3ee"
          strokeWidth="1.5"
          filter="url(#glow)"
        />

        {/* Data Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={data[i].color}
            stroke="#000"
            strokeWidth="1"
          />
        ))}

        {/* Labels */}
        {data.map((d, i) => {
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
          const labelRadius = radius + 15;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <g key={i}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={d.color}
                fontSize="9"
                className="font-mono font-bold tracking-tighter"
                style={{ textShadow: `0 0 10px ${d.color}40` }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
