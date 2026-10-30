import React, { useEffect, useRef } from 'react';
import { GameState, getBeeLoopCoords } from '../game/rules.ts';
import { COLOR_CONFIGS } from '../game/types.ts';

interface GameCanvasProps {
  gameState: GameState;
  colorAssist: boolean;
  reducedMotion: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, colorAssist, reducedMotion }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    gridRows,
    gridCols,
    tiles,
    loopBees,
    activeProjectiles,
    recentHits,
  } = gameState;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-[430px] mx-auto select-none p-3 sm:p-5 flex items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      {/* Outer Vine Loop Track Background Frame */}
      <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-xl">
        <img
          src="/embedded/bloom-loop/assets/aistudio/vine_loop_track_675b3ef2.png"
          alt="Vine Loop Track"
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>

      {/* Planter Board Inner Frame */}
      <div className="relative z-10 w-[78%] h-[78%] rounded-3xl overflow-hidden flex items-center justify-center p-2.5 shadow-inner">
        {/* Board Planter Background Image */}
        <img
          src="/embedded/bloom-loop/assets/aistudio/board_planter_frame_3eda70fe.png"
          alt="Board Planter"
          className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none"
        />

        {/* Central Flower Tiles Grid */}
        <div
          className="relative z-10 w-full h-full grid gap-1.5 p-1.5 place-items-center"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((tile) => {
            const config = COLOR_CONFIGS[tile.color];
            if (tile.cleared) {
              return (
                <div
                  key={tile.id}
                  className="w-full h-full rounded-xl bg-black/15 border border-white/5 flex items-center justify-center transition-all duration-300"
                >
                  <img
                    src="/embedded/bloom-loop/assets/aistudio/Soft_grey_flower_silhouette-24_7a08fa56.png"
                    alt="Empty Silhouette"
                    className="w-1/2 h-1/2 opacity-20 object-contain"
                  />
                </div>
              );
            }

            return (
              <div
                key={tile.id}
                className="relative w-full h-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              >
                {/* Contact shadow */}
                <img
                  src="/embedded/bloom-loop/assets/aistudio/soft_contact_shadow_5cab107b.png"
                  alt="Shadow"
                  className="absolute -bottom-1 w-[80%] h-3 opacity-60 pointer-events-none"
                />

                {/* 3D Flower Tile Asset */}
                <img
                  src={config.flowerAsset}
                  alt={config.name}
                  className="relative z-10 w-full h-full object-contain drop-shadow filter transition-all duration-200"
                />

                {/* Accessibility Color-Assist Symbol Badge */}
                {colorAssist && (
                  <div className="absolute z-20 top-0.5 right-0.5 w-4 h-4 bg-white/85 rounded-full p-0.5 shadow-sm">
                    <img
                      src={config.symbolAsset}
                      alt={config.symbolName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Projectiles In Flight */}
      {activeProjectiles.map((proj) => {
        // Linear interpolation from perimeter (proj.fromX, proj.fromY) to target tile (proj.toX, proj.toY)
        // Note: fromX, fromY are in 0..1 perimeter space. toX, toY are in 0..1 grid space.
        // Convert to percentage of container:
        // Vine loop margin is roughly 11% inset from canvas edge, central grid is 78% of canvas.
        const loopMargin = 0.08;
        const loopSize = 0.84;
        const startX = (loopMargin + proj.fromX * loopSize) * 100;
        const startY = (loopMargin + proj.fromY * loopSize) * 100;

        const gridMargin = 0.14;
        const gridSize = 0.72;
        const endX = (gridMargin + proj.toX * gridSize) * 100;
        const endY = (gridMargin + proj.toY * gridSize) * 100;

        const currentX = startX + (endX - startX) * proj.progress;
        const currentY = startY + (endY - startY) * proj.progress;

        return (
          <div
            key={proj.id}
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-none"
            style={{ left: `${currentX}%`, top: `${currentY}%` }}
          >
            <div className="relative w-7 h-7 flex items-center justify-center">
              <img
                src="/embedded/bloom-loop/assets/aistudio/pollen_projectile_69b46aa2.png"
                alt="Pollen"
                className="w-full h-full object-contain animate-spin-slow drop-shadow-md"
              />
              <img
                src="/embedded/bloom-loop/assets/aistudio/sparkle_particle_e3f5d547.png"
                alt="Sparkle"
                className="absolute inset-0 w-full h-full object-contain animate-ping opacity-60"
              />
            </div>
          </div>
        );
      })}

      {/* Recent Hit Bursts (Impact rings, score popups) */}
      {recentHits.map((hit) => {
        const gridMargin = 0.14;
        const gridSize = 0.72;
        const posX = (gridMargin + hit.x * gridSize) * 100;
        const posY = (gridMargin + hit.y * gridSize) * 100;

        return (
          <div
            key={hit.id}
            className="absolute z-35 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
            style={{ left: `${posX}%`, top: `${posY}%` }}
          >
            {/* Impact ring effect */}
            <img
              src="/embedded/bloom-loop/assets/aistudio/impact_ring_1447061e.png"
              alt="Impact"
              className="w-14 h-14 object-contain animate-ping opacity-80"
            />
            {/* Floating combo score */}
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-amber-300/40">
              +{hit.scoreGained}
            </span>
          </div>
        );
      })}

      {/* Bees Cruising Clockwise on the Vine Loop */}
      {loopBees.map((bee) => {
        const { x, y, edge } = getBeeLoopCoords(bee.loopProgress);
        // Bee perimeter positioning:
        const loopMargin = 0.08;
        const loopSize = 0.84;
        const beeLeft = (loopMargin + x * loopSize) * 100;
        const beeTop = (loopMargin + y * loopSize) * 100;

        // Rotation facing direction of movement:
        // top: heading right (90deg)
        // right: heading down (180deg)
        // bottom: heading left (270deg)
        // left: heading up (0deg)
        let rotationDeg = 0;
        if (edge === 'top') rotationDeg = 90;
        else if (edge === 'right') rotationDeg = 180;
        else if (edge === 'bottom') rotationDeg = 270;
        else if (edge === 'left') rotationDeg = 0;

        const config = COLOR_CONFIGS[bee.color];

        return (
          <div
            key={bee.id}
            className="absolute z-25 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-none will-change-transform"
            style={{
              left: `${beeLeft}%`,
              top: `${beeTop}%`,
            }}
          >
            {/* Shadow under bee */}
            <img
              src="/embedded/bloom-loop/assets/aistudio/soft_contact_shadow_5cab107b.png"
              alt="Shadow"
              className="absolute -bottom-2 -left-2 w-14 h-4 opacity-50"
            />

            {/* Rotated Bee Drone Model */}
            <div
              className="relative w-12 h-12 flex items-center justify-center transition-transform"
              style={{ transform: `rotate(${rotationDeg}deg)` }}
            >
              {/* Left & Right Flapping Wings */}
              <img
                src="/embedded/bloom-loop/assets/aistudio/bee_wing_f6363491.png"
                alt="Wing Left"
                className={`absolute -left-2 -top-1 w-6 h-6 object-contain origin-bottom-right ${
                  reducedMotion ? '' : 'animate-wing-left'
                }`}
              />
              <img
                src="/embedded/bloom-loop/assets/aistudio/bee_wing_f6363491.png"
                alt="Wing Right"
                className={`absolute -right-2 -top-1 w-6 h-6 object-contain origin-bottom-left scale-x-[-1] ${
                  reducedMotion ? '' : 'animate-wing-right'
                }`}
              />

              {/* Clay Bee Body in matching color */}
              <img
                src={config.beeAsset}
                alt={config.name}
                className="relative z-10 w-11 h-11 object-contain drop-shadow-md"
              />

              {/* Ammo Badge showing remaining pollen shots */}
              <div
                className="absolute z-20 -bottom-1 -right-1 w-6 h-6 flex items-center justify-center font-bold text-xs text-amber-950 rounded-full shadow-md"
                style={{
                  backgroundImage: `url('/embedded/bloom-loop/assets/aistudio/ammo_badge_blank_76bd93ca.png')`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  transform: `rotate(${-rotationDeg}deg)`, // Keep badge upright
                }}
              >
                {bee.currentAmmo}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
