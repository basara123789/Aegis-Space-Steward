
import React, { useEffect, useRef, useState } from 'react';

interface TelemetryPanelProps {
    t: (key: string) => string;
    visible: boolean;
    isEmergency?: boolean;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ t, visible, isEmergency = false }) => {
    const driftCanvasRef = useRef<HTMLCanvasElement>(null);
    const trendCanvasRef = useRef<HTMLCanvasElement>(null);
    const [driftStatus, setDriftStatus] = useState<'NOMINAL' | 'WARNING' | 'REGULATING'>('NOMINAL');

    // Sync drift status with emergency prop
    useEffect(() => {
        if (isEmergency) {
            setDriftStatus('REGULATING');
        } else {
            setDriftStatus('NOMINAL');
        }
    }, [isEmergency]);

    // ESA-496: Telemetry Drift Simulation
    useEffect(() => {
        const canvas = driftCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let points: { x: number; y: number; life: number }[] = [];
        let frameId: number;

        const animate = () => {
            // Clear with trail effect
            ctx.fillStyle = isEmergency ? 'rgba(10, 30, 40, 0.2)' : 'rgba(10, 17, 40, 0.2)'; // Calmer Deep Blue
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Nominal Zone (ESA-496 Model)
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 60;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = isEmergency ? '#4ADE80' : '#00E5FF'; // Green (Calm) / Cyan
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Add new point - ORDER MODE if emergency (Regulating)
            if (Math.random() > (isEmergency ? 0.3 : 0.8)) {
                // Random drift calculation
                const angle = Math.random() * Math.PI * 2;

                // Emergency (Regulating): Gather in center
                const baseDist = isEmergency ? radius * 0.3 : radius * 0.8;
                const dist = Math.random() * baseDist;

                points.push({
                    x: centerX + Math.cos(angle) * dist,
                    y: centerY + Math.sin(angle) * dist,
                    life: 1.0
                });
            }

            // Check Drift Status override
            if (!isEmergency) {
                const outlierCount = points.filter(p => {
                    const d = Math.hypot(p.x - centerX, p.y - centerY);
                    return d > radius;
                }).length;
                setDriftStatus(outlierCount > 2 ? 'WARNING' : 'NOMINAL');
            }

            // Draw Points
            points.forEach((p, i) => {
                p.life -= 0.02;

                const dist = Math.hypot(p.x - centerX, p.y - centerY);
                const isOutlier = dist > radius;

                ctx.beginPath();
                ctx.arc(p.x, p.y, isOutlier ? 3 : 2, 0, Math.PI * 2);
                ctx.fillStyle = isEmergency
                    ? `rgba(74, 222, 128, ${p.life})` // Zen Green
                    : (isOutlier
                        ? `rgba(255, 176, 0, ${p.life})` // Amber for Warning
                        : `rgba(0, 229, 255, ${p.life})`); // Cyan for Normal
                ctx.fill();
            });

            points = points.filter(p => p.life > 0);
            frameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(frameId);
    }, [isEmergency]);

    // ESA-555: Anxiety Slope Simulation
    useEffect(() => {
        const canvas = trendCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Simulate 7-day trend (minutes in this mock)
        // If emergency (Regulating), lower values smoothly
        const initialData = isEmergency
            ? Array(20).fill(0).map(() => 40 + Math.random() * 10) // Smooth low activity
            : Array(20).fill(0).map(() => 30 + Math.random() * 40);

        const dataPoints = [...initialData];
        let offset = 0;
        let frameId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = 8;
            const gap = 4;
            const speed = 0.5;

            offset -= speed;
            if (offset <= -(barWidth + gap)) {
                offset = 0;
                dataPoints.shift();
                // Inject new data point based on simple anxiety volatility model
                let next;
                if (isEmergency) {
                    // Trending down to calm
                    const last = dataPoints[dataPoints.length - 1];
                    next = Math.max(20, last - Math.random() * 5);
                } else {
                    const last = dataPoints[dataPoints.length - 1];
                    const change = (Math.random() - 0.5) * 20;
                    next = Math.max(10, Math.min(90, last + change));
                }
                dataPoints.push(next);
            }

            // Draw Bars
            dataPoints.forEach((val, i) => {
                const x = i * (barWidth + gap) + offset;
                const h = (val / 100) * canvas.height;
                const y = canvas.height - h;

                // Logic Inverted: 
                // Normal = Green (#4ADE80)
                // Emergency = Yellow (#FFB000) or Red (#F43F5E) if high
                if (isEmergency) {
                    ctx.fillStyle = val > 80 ? '#F43F5E' : '#FFB000';
                } else {
                    ctx.fillStyle = '#4ADE80';
                }

                ctx.fillRect(x, y, barWidth, h);
            });

            // Draw Slope Prediction (Dashed Line)
            const lastX = (dataPoints.length - 1) * (barWidth + gap) + offset;
            const lastY = canvas.height - (dataPoints[dataPoints.length - 1] / 100) * canvas.height;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            // Validated Algorithm: Linear Regression Projection (Mock)
            // Emergency = Volatile Slope
            const slopeY = isEmergency ? (Math.random() * 40 - 20) : 10;
            ctx.lineTo(canvas.width, lastY + slopeY);
            ctx.strokeStyle = isEmergency ? '#F43F5E' : '#4ADE80'; // Red vs Green
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 2;
            ctx.stroke();

            frameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(frameId);
    }, [isEmergency]);

    return (
        <div className={`fixed left-4 top-24 bottom-24 w-64 bg-slate-900/90 backdrop-blur-md border-r-2 ${isEmergency ? 'border-green-500/50 shadow-[0_0_30px_rgba(74,222,128,0.2)]' : 'border-slate-700/50 shadow-[10px_0_20px_rgba(0,0,0,0.5)]'} flex flex-col pointer-events-none select-none z-40 overflow-hidden font-mono text-[10px] rounded-r-3xl transition-all duration-500 ease-in-out ${visible ? 'translate-x-0' : '-translate-x-[200%]'}`}>

            {/* Crew Physiological Data */}
            <div className="border-b border-slate-700 p-3">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-slate-300 tracking-widest font-bold">{t('crewPhysiologicalData')}</h3>
                    <span className="text-[9px] text-slate-500">LIVE</span>
                </div>
                <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center text-slate-400">
                        <span>{t('heartRate')}</span>
                        <span className="font-mono text-green-400 font-bold text-sm">72 <span className="text-[9px]">BPM</span></span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span>{t('stressLevel')}</span>
                        <span className="font-bold text-[#00E5FF]">{t('normal')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span>{t('o2Saturation')}</span>
                        <span className="font-mono text-[#00E5FF] font-bold text-sm">98%</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <button className="flex items-center justify-center gap-2 py-1.5 px-3 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 transition-all text-slate-300">
                        <span className="text-xs">🧬</span> {t('lifeSupportSystem')}
                    </button>
                    <button className="flex items-center justify-center gap-2 py-1.5 px-3 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 transition-all text-pink-300">
                        <span className="text-xs">🧠</span> {t('psychologicalStability')}
                    </button>
                </div>
            </div>

            {/* ESA-496 Module */}
            <div className="border-b border-slate-700 p-3">
                <div className="flex justify-between items-center mb-2">
                    <h3 className={`${isEmergency ? 'text-red-500 animate-pulse' : 'text-[#00E5FF]'} tracking-widest font-bold`}>{t('driftModule')}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isEmergency ? 'bg-red-500/20 text-red-500' : (driftStatus === 'NOMINAL' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-[#FFB000]/20 text-[#FFB000] animate-pulse')}`}>
                        {isEmergency ? 'CRITICAL' : driftStatus}
                    </span>
                </div>
                <div className={`relative w-full h-24 bg-[#0A1128] border ${isEmergency ? 'border-green-500/50' : 'border-slate-700'} rounded-lg overflow-hidden`}>
                    <canvas ref={driftCanvasRef} width={230} height={96} className="w-full h-full" />
                    <div className={`absolute inset-0 border ${isEmergency ? 'border-green-500/20' : 'border-[#00E5FF]/10'} pointer-events-none rounded-lg`}></div>

                    {/* Overlay Grid */}
                    <div className="absolute inset-0 w-full h-full opacity-20"
                        style={{ backgroundImage: `linear-gradient(${isEmergency ? '#4ADE80' : '#00E5FF'} 1px, transparent 1px), linear-gradient(90deg, ${isEmergency ? '#4ADE80' : '#00E5FF'} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
                    </div>
                </div>
                <div className="mt-1 flex justify-between text-slate-500">
                    <span>HRV-Z: {isEmergency ? 'COH' : '0.04'}</span>
                    <span>SYNC: {isEmergency ? '100%' : '99%'}</span>
                </div>
            </div>

            {/* ESA-555 Module */}
            <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                    <h3 className={`${isEmergency ? 'text-green-400' : 'text-[#FFB000]'} tracking-widest font-bold`}>{t('slopeModule')}</h3>
                    <span className="text-slate-400">{isEmergency ? 'STABLE' : t('tMinus7Days')}</span>
                </div>
                <div className={`relative w-full h-32 bg-[#0A1128] border ${isEmergency ? 'border-green-500/50' : 'border-slate-700'} rounded-lg overflow-hidden mb-2`}>
                    <canvas ref={trendCanvasRef} width={230} height={128} className="w-full h-full" />
                    {/* Scanline Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${isEmergency ? 'via-green-500/10' : 'via-[#FFB000]/5'} to-transparent h-full w-full animate-scan`}></div>
                </div>
                <div className={`${isEmergency ? 'text-green-400 opacity-90' : 'text-[#FFB000] opacity-80'} leading-tight`}>
                    {isEmergency ? 'BIO-FEEDBACK INTERVENTION ACTIVE' : t('predictionAnxiety')}
                    <br />
                    <span className={`${isEmergency ? 'text-white' : 'text-[#00E5FF] font-bold'}`}>
                        {isEmergency ? 'BREATHING CYCLE: INITIATED' : t('recomProtocol')}
                    </span>
                </div>
            </div>

            {/* Decorative Footer */}
            <div className="mt-auto p-3 border-t border-slate-700 bg-black/40">
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${isEmergency ? 'bg-green-400 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className={`${isEmergency ? 'text-green-400' : 'text-green-500'} font-bold`}>{t('bioLinkActive')}</span>
                </div>
                <div className="text-slate-600 text-[8px] break-all">
                    ID: 8820-AEGIS-CNES-ESA
                    <br />
                    {t('uptime')}: 4492h 12m
                </div>
            </div>
        </div>
    );
};
