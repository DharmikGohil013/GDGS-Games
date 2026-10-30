import { LevelData, FlowerColor } from './types.ts';

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: "Sprout Garden",
    gridRows: 4,
    gridCols: 4,
    description: "Welcome! Tap a bee from the docks to send it flying around the vine loop.",
    targetStars: [100, 250, 400],
    layout: [
      ['lilac', 'lilac', 'sky', 'sky'],
      ['lilac', 'lilac', 'sky', 'sky'],
      ['orange', 'orange', 'gold', 'gold'],
      ['orange', 'orange', 'gold', 'gold'],
    ],
    beeQueue: [
      { color: 'lilac', ammo: 4 },
      { color: 'sky', ammo: 4 },
      { color: 'orange', ammo: 4 },
      { color: 'gold', ammo: 4 },
    ]
  },
  {
    id: 2,
    name: "Tricolor Bloom",
    gridRows: 4,
    gridCols: 4,
    description: "Watch bees target outer matching petals first as they circle the vine.",
    targetStars: [150, 300, 500],
    layout: [
      ['mint', 'mint', 'coral', 'coral'],
      ['mint', 'gold', 'gold', 'coral'],
      ['mint', 'gold', 'gold', 'coral'],
      ['mint', 'mint', 'coral', 'coral'],
    ],
    beeQueue: [
      { color: 'mint', ammo: 6 },
      { color: 'coral', ammo: 6 },
      { color: 'gold', ammo: 4 },
    ]
  },
  {
    id: 3,
    name: "Sunflower Blossom",
    gridRows: 5,
    gridCols: 5,
    description: "Golden petals surround a rich orange core. Plan your bee launches!",
    targetStars: [200, 450, 700],
    layout: [
      [null, 'gold', 'gold', 'gold', null],
      ['gold', 'orange', 'orange', 'orange', 'gold'],
      ['gold', 'orange', 'lilac', 'orange', 'gold'],
      ['gold', 'orange', 'orange', 'orange', 'gold'],
      [null, 'gold', 'gold', 'gold', null],
    ],
    beeQueue: [
      { color: 'gold', ammo: 5 },
      { color: 'gold', ammo: 5 },
      { color: 'orange', ammo: 4 },
      { color: 'orange', ammo: 4 },
      { color: 'lilac', ammo: 1 },
    ]
  },
  {
    id: 4,
    name: "Garden Butterfly",
    gridRows: 5,
    gridCols: 5,
    description: "Symmetrical wings in sky blue and mint green.",
    targetStars: [250, 500, 800],
    layout: [
      ['sky', 'sky', null, 'mint', 'mint'],
      ['sky', 'coral', 'sky', 'coral', 'mint'],
      [null, 'sky', 'coral', 'mint', null],
      ['sky', 'coral', 'sky', 'coral', 'mint'],
      ['sky', 'sky', null, 'mint', 'mint'],
    ],
    beeQueue: [
      { color: 'sky', ammo: 5 },
      { color: 'mint', ammo: 5 },
      { color: 'sky', ammo: 4 },
      { color: 'mint', ammo: 4 },
      { color: 'coral', ammo: 5 },
    ]
  },
  {
    id: 5,
    name: "Strawberry Patch",
    gridRows: 5,
    gridCols: 5,
    description: "Juicy coral berries crowned with garden mint foliage.",
    targetStars: [300, 600, 950],
    layout: [
      [null, 'mint', 'mint', 'mint', null],
      ['coral', 'coral', 'coral', 'coral', 'coral'],
      ['coral', 'gold', 'coral', 'gold', 'coral'],
      [null, 'coral', 'coral', 'coral', null],
      [null, null, 'coral', null, null],
    ],
    beeQueue: [
      { color: 'mint', ammo: 3 },
      { color: 'coral', ammo: 6 },
      { color: 'coral', ammo: 6 },
      { color: 'gold', ammo: 2 },
    ]
  },
  {
    id: 6,
    name: "Lilac Meadow",
    gridRows: 6,
    gridCols: 6,
    description: "A pastel spiral of soft lilac, sky blue, and garden gold.",
    targetStars: [350, 750, 1100],
    layout: [
      ['lilac', 'lilac', 'lilac', 'lilac', 'lilac', 'lilac'],
      ['lilac', 'sky', 'sky', 'sky', 'sky', 'lilac'],
      ['lilac', 'sky', 'gold', 'gold', 'sky', 'lilac'],
      ['lilac', 'sky', 'gold', 'gold', 'sky', 'lilac'],
      ['lilac', 'sky', 'sky', 'sky', 'sky', 'lilac'],
      ['lilac', 'lilac', 'lilac', 'lilac', 'lilac', 'lilac'],
    ],
    beeQueue: [
      { color: 'lilac', ammo: 10 },
      { color: 'lilac', ammo: 10 },
      { color: 'sky', ammo: 6 },
      { color: 'sky', ammo: 6 },
      { color: 'gold', ammo: 4 },
    ]
  },
  {
    id: 7,
    name: "Rainbow Honeycomb",
    gridRows: 6,
    gridCols: 6,
    description: "All six vibrant garden colors in harmony!",
    targetStars: [400, 900, 1350],
    layout: [
      ['coral', 'coral', 'orange', 'orange', 'gold', 'gold'],
      ['coral', 'coral', 'orange', 'orange', 'gold', 'gold'],
      ['mint', 'mint', 'sky', 'sky', 'lilac', 'lilac'],
      ['mint', 'mint', 'sky', 'sky', 'lilac', 'lilac'],
      ['orange', 'coral', 'gold', 'mint', 'lilac', 'sky'],
      ['orange', 'coral', 'gold', 'mint', 'lilac', 'sky'],
    ],
    beeQueue: [
      { color: 'coral', ammo: 6 },
      { color: 'orange', ammo: 6 },
      { color: 'gold', ammo: 6 },
      { color: 'mint', ammo: 6 },
      { color: 'sky', ammo: 6 },
      { color: 'lilac', ammo: 6 },
    ]
  },
  {
    id: 8,
    name: "Master Gardener's Bloom",
    gridRows: 6,
    gridCols: 6,
    description: "The ultimate garden challenge. Manage your dock space carefully!",
    targetStars: [500, 1100, 1600],
    layout: [
      [null, 'coral', 'coral', 'coral', 'coral', null],
      ['mint', 'orange', 'gold', 'gold', 'orange', 'sky'],
      ['mint', 'orange', 'lilac', 'lilac', 'orange', 'sky'],
      ['mint', 'orange', 'lilac', 'lilac', 'orange', 'sky'],
      ['mint', 'orange', 'gold', 'gold', 'orange', 'sky'],
      [null, 'coral', 'coral', 'coral', 'coral', null],
    ],
    beeQueue: [
      { color: 'coral', ammo: 4 },
      { color: 'coral', ammo: 4 },
      { color: 'mint', ammo: 4 },
      { color: 'sky', ammo: 4 },
      { color: 'orange', ammo: 4 },
      { color: 'orange', ammo: 4 },
      { color: 'gold', ammo: 4 },
      { color: 'lilac', ammo: 4 },
    ]
  }
];
