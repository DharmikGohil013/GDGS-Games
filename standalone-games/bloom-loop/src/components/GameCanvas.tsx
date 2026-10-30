import React from 'react';
import { GameState, getBeeLoopCoords, PATIENCE_LAPS } from '../game/rules.ts';
import { COLOR_CONFIGS } from '../game/types.ts';

interface GameCanvasProps {
  gameState: GameState;
  colorAssist: boolean;
  reducedMotion: boolean;
}

// Board geometry as fractions of the square canvas, measured from the vine and planter art.
// Bees fly along the vine's centre line; flowers fill the planter.
const VINE_INSET = 0.125;
const GRID_INSET = 0.18;
const PLANTER_INSET = 0.05;

const pct = (fraction: number) => `${fraction * 100}%`;
const vineX = (x: number) => VINE_INSET + x * (1 - 2 * VINE_INSET);
const gridX = (x: number) => GRID_INSET + x * (1 - 2 * GRID_INSET);

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, colorAssist, reducedMotion }) => {
  const { gridRows, gridCols, tiles, loopBees, activeProjectiles, recentHits } = gameState;

  return (
    <div className="relative w-full aspect-square max-w-[430px] mx-auto select-none" style={{ touchAction: 'none' }}>
      {/* Outer Vine Loop Track */}
      <img
        src="/embedded/bloom-loop/assets/aistudio/vine_loop_track_675b3ef2.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xl"
      />

      {/* Planter Board */}
      <img
        src="/embedded/bloom-loop/assets/aistudio/board_planter_frame_3eda70fe.webp"
        alt=""
        className="absolute object-contain pointer-events-none"
        style={{ left: pct(PLANTER_INSET), top: pct(PLANTER_INSET), width: pct(1 - 2 * PLANTER_INSET), height: pct(1 - 2 * PLANTER_INSET) }}
      />

      {/* Flower Tiles: every cell is exactly 1/cols wide, so tile centres match the shot maths */}
      <div
        className="absolute grid"
        style={{
          left: pct(GRID_INSET),
          top: pct(GRID_INSET),
          width: pct(1 - 2 * GRID_INSET),
          height: pct(1 - 2 * GRID_INSET),
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}
      >
        {tiles.map((tile) => {
          const config = COLOR_CONFIGS[tile.color];
          const placement = { gridRow: tile.row + 1, gridColumn: tile.col + 1 };
          if (tile.cleared) {
            return (
              <div key={tile.id} style={placement} className="p-[6%] flex items-center justify-center">
                <div className={`w-full h-full rounded-xl bg-black/15 flex items-center justify-center ${reducedMotion ? '' : 'animate-bloom-pop'}`}>
                  <img
                    src="/embedded/bloom-loop/assets/aistudio/Soft_grey_flower_silhouette-24_7a08fa56.webp"
                    alt=""
                    className="w-1/2 h-1/2 opacity-25 object-contain"
                  />
                </div>
              </div>
            );
          }

          return (
            <div key={tile.id} style={placement} className="relative p-[4%] flex items-center justify-center">
              <img
                src={config.flowerAsset}
                alt={config.name}
                className="w-full h-full object-contain drop-shadow-md"
              />
              {colorAssist && (
                <div className="absolute top-[4%] right-[4%] w-[38%] max-w-4 aspect-square bg-white/85 rounded-full p-0.5 shadow-sm">
                  <img src={config.symbolAsset} alt={config.symbolName} className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Projectiles In Flight */}
      {activeProjectiles.map((proj) => {
        const startX = vineX(proj.fromX);
        const startY = vineX(proj.fromY);
        const endX = gridX(proj.toX);
        const endY = gridX(proj.toY);
        return (
          <div
            key={proj.id}
            className="absolute z-30 w-[7%] aspect-square pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: pct(startX + (endX - startX) * proj.progress),
              top: pct(startY + (endY - startY) * proj.progress),
            }}
          >
            <img
              src="/embedded/bloom-loop/assets/aistudio/pollen_projectile_69b46aa2.webp"
              alt=""
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        );
      })}

      {/* Bloom bursts: impact ring plus a score that floats up and fades */}
      {recentHits.map((hit) => (
        <div
          key={hit.id}
          className="absolute z-40 w-[13%] aspect-square pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: pct(gridX(hit.x)), top: pct(gridX(hit.y)) }}
        >
          {!reducedMotion && (
            <img
              src="/embedded/bloom-loop/assets/aistudio/impact_ring_1447061e.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-contain animate-impact-ring"
            />
          )}
          <span className="absolute left-1/2 top-0 text-xs font-bold text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-amber-300/40 animate-score-float">
            +{hit.scoreGained}
          </span>
        </div>
      ))}

      {/* Bees cruising clockwise along the vine */}
      {loopBees.map((bee) => {
        const { x, y, edge } = getBeeLoopCoords(bee.loopProgress);
        const config = COLOR_CONFIGS[bee.color];
        // The bee art faces right; mirror it while it flies right-to-left along the bottom
        const facingLeft = edge === 'bottom';
        const boredom = Math.max(0, Math.min(1, (bee.idleProgress / PATIENCE_LAPS - 0.5) * 2));

        return (
          <div
            key={bee.id}
            className="absolute z-20 w-[11%] aspect-square pointer-events-none -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={{ left: pct(vineX(x)), top: pct(vineX(y)) }}
          >
            <div className="relative w-full h-full" style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}>
              <img
                src="/embedded/bloom-loop/assets/aistudio/bee_wing_f6363491.webp"
                alt=""
                className={`absolute -left-[12%] -top-[14%] w-1/2 h-1/2 object-contain origin-bottom-right ${reducedMotion ? '' : 'animate-wing-left'}`}
              />
              <img
                src="/embedded/bloom-loop/assets/aistudio/bee_wing_f6363491.webp"
                alt=""
                className={`absolute -right-[12%] -top-[14%] w-1/2 h-1/2 object-contain origin-bottom-left scale-x-[-1] ${reducedMotion ? '' : 'animate-wing-right'}`}
              />
              <img src={config.beeAsset} alt={`${config.name} bee`} className="relative z-10 w-full h-full object-contain drop-shadow-md" />
            </div>

            {/* Remaining pollen shots */}
            <div
              className="absolute z-20 -bottom-[8%] -right-[8%] w-[48%] aspect-square flex items-center justify-center font-bold text-[11px] text-amber-950 rounded-full shadow-md"
              style={{
                backgroundImage: `url('/embedded/bloom-loop/assets/aistudio/ammo_badge_blank_76bd93ca.webp')`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {bee.currentAmmo}
            </div>

            {/* Getting bored: no reachable flower for over half its patience */}
            {boredom > 0 && (
              <div
                className="absolute z-30 -top-[45%] left-1/2 -translate-x-1/2 px-1.5 rounded-full bg-white/90 text-[10px] font-black text-rose-600 shadow whitespace-nowrap"
                style={{ opacity: 0.4 + boredom * 0.6 }}
              >
                Zz
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
