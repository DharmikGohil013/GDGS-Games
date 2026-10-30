export type FlowerColor = 'lilac' | 'sky' | 'orange' | 'gold' | 'mint' | 'coral';

export interface ColorMeta {
  id: FlowerColor;
  name: string;
  hex: string;
  beeAsset: string;
  flowerAsset: string;
  symbolAsset: string;
  symbolName: string;
}

export const COLOR_CONFIGS: Record<FlowerColor, ColorMeta> = {
  lilac: {
    id: 'lilac',
    name: 'Lilac',
    hex: '#A770EB',
    beeAsset: '/embedded/bloom-loop/assets/aistudio/bee_lilac_body_b418ecea.png',
    flowerAsset: '/embedded/bloom-loop/assets/aistudio/flower_tile_lilac_a179215a.png',
    symbolAsset: '/embedded/bloom-loop/assets/aistudio/colour_symbol_star_5309d7bd.png',
    symbolName: 'Star'
  },
  sky: {
    id: 'sky',
    name: 'Sky Blue',
    hex: '#38BDF8',
    beeAsset: '/embedded/bloom-loop/assets/aistudio/bee_sky_body_560a3965.png',
    flowerAsset: '/embedded/bloom-loop/assets/aistudio/flower_tile_sky_eac90c25.png',
    symbolAsset: '/embedded/bloom-loop/assets/aistudio/colour_symbol_diamond_a2959fe5.png',
    symbolName: 'Diamond'
  },
  orange: {
    id: 'orange',
    name: 'Tangerine',
    hex: '#FB923C',
    beeAsset: '/embedded/bloom-loop/assets/aistudio/bee_orange_body_9ec86a8f.png',
    flowerAsset: '/embedded/bloom-loop/assets/aistudio/flower_tile_orange_beaac329.png',
    symbolAsset: '/embedded/bloom-loop/assets/aistudio/colour_symbol_square_e5e09b45.png',
    symbolName: 'Square'
  },
  gold: {
    id: 'gold',
    name: 'Honey Gold',
    hex: '#FACC15',
    beeAsset: '/embedded/bloom-loop/assets/aistudio/bee_gold_body_755065ad.png',
    flowerAsset: '/embedded/bloom-loop/assets/aistudio/flower_tile_gold_2f23cdb4.png',
    symbolAsset: '/embedded/bloom-loop/assets/aistudio/colour_symbol_triangle_4bf984e4.png',
    symbolName: 'Triangle'
  },
  mint: {
    id: 'mint',
    name: 'Garden Mint',
    hex: '#2DD4BF',
    beeAsset: '/embedded/bloom-loop/assets/aistudio/bee_mint_body_0af6277b.png',
    flowerAsset: '/embedded/bloom-loop/assets/aistudio/flower_tile_mint_c8e94ede.png',
    symbolAsset: '/embedded/bloom-loop/assets/aistudio/colour_symbol_plus_eae344de.png',
    symbolName: 'Plus'
  },
  coral: {
    id: 'coral',
    name: 'Coral Rose',
    hex: '#F43F5E',
    beeAsset: '/embedded/bloom-loop/assets/aistudio/bee_coral_body_521a593c.png',
    flowerAsset: '/embedded/bloom-loop/assets/aistudio/flower_tile_coral_e0e1b2bc.png',
    symbolAsset: '/embedded/bloom-loop/assets/aistudio/colour_symbol_circle_f70c739a.png',
    symbolName: 'Circle'
  }
};

export interface FlowerTile {
  id: string;
  row: number;
  col: number;
  color: FlowerColor;
  cleared: boolean;
  clearingAnim?: number; // 0..1 for pop effect
}

export interface BeeDrone {
  id: string;
  color: FlowerColor;
  totalAmmo: number;
  currentAmmo: number;
  // Loop position is 0..1 around the perimeter:
  // 0.0 = top-left corner heading right
  // 0.25 = top-right corner heading down
  // 0.5 = bottom-right corner heading left
  // 0.75 = bottom-left corner heading up
  loopProgress: number; 
  status: 'dock' | 'loop' | 'flying_away' | 'cleared';
  speed: number; // progress units per second (e.g. 0.18)
  lastFiredTargetId?: string;
  cooldownUntilNextShot: number; // seconds
}

export interface LevelData {
  id: number;
  name: string;
  gridRows: number;
  gridCols: number;
  // null means empty cell in custom shapes (e.g. heart, diamond, cross)
  layout: (FlowerColor | null)[][];
  beeQueue: { color: FlowerColor; ammo: number }[];
  parMoves?: number;
  targetStars: [number, number, number];
  description?: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  colorAssist: boolean;
  reducedMotion: boolean;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';
