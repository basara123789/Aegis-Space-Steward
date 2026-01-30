import React from 'react';

const SpaceBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-slate-950 z-0 perspective-[500px]">
            {/* Deep Space Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-black" />

            {/* Warp Field Layers */}
            <div className="star-field layer-1"></div>
            <div className="star-field layer-2"></div>
            <div className="star-field layer-3"></div>
            <div className="star-field layer-4"></div>

            {/* Ambient Glow (Breathing) */}
            <div className="absolute inset-0 bg-blue-900/10 animate-[pulse_6s_ease-in-out_infinite] mix-blend-screen pointer-events-none"></div>

            <style>{`
        .star-field {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: 
            /* Generated random stars using box-shadow for performance */
            0px -200px #fff, 200px 100px #fff, -150px 200px #fff, -300px -100px #bae6fd,
            100px -300px #fff, -100px 150px #fff, 300px -50px #fff, 150px 250px #bae6fd,
            -50px -250px #fff, 250px 50px #fff, -250px -150px #fff, 50px 300px #bae6fd,
            -200px 0px #fff, 0px 200px #fff, 200px -200px #fff, -200px 200px #fff;
          transform-origin: center center;
          opacity: 0;
        }

        .layer-1 { animation: warp 4s linear infinite; }
        .layer-2 { animation: warp 4s linear infinite 1s; box-shadow: 100px 100px #fff, -200px -200px #fff, 300px -100px #fff, -50px 250px #fff, 150px -250px #fde047; }
        .layer-3 { animation: warp 4s linear infinite 2s; box-shadow: -100px 100px #fff, 200px -200px #fff, -300px 50px #fff, 50px -300px #fff, -150px 150px #fde047; }
        .layer-4 { animation: warp 4s linear infinite 3s; box-shadow: 0px 300px #fff, -300px 0px #fff, 150px -150px #fff, -150px -150px #fff, 300px 300px #fde047; }

        @keyframes warp {
          0% {
            transform: scale(0.1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: scale(4); /* Explode outwards */
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
};

export default SpaceBackground;
