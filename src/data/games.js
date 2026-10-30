// Keep the public catalogue limited to games visitors can actually play.
// Generated placeholder titles and invented popularity numbers undermine trust.
// These previews were captured from the running games, not generated art.
const capturedGames = new Set([
    'apex-velocity', 'voxelcraft', 'gravity-switch', 'hextris',
    'color-switch', 'tower-stacker', 'neon-snake', 'block-merge',
    'turbo-drift', 'monsoon-rickshaw-rush', 'ball-drop', 'city-sprint',
    'infinite-runner', 'mario-king', 'gravity-shift',
]);

export const games = [
    { id: 'among-us-pixel-outpost', title: 'Among Us: Pixel Outpost', category: 'strategy', isPlayable: true, isNew: true, metaNote: 'Pixel mystery with AI crewmates', color: 'coral', iconType: 'star', engine: 'html5', image: '/images/among-us-pixel-outpost-gameplay.webp' },
    { id: 'bloom-loop', title: 'Bloom Loop: Garden Colour Flow', category: 'puzzle', isPlayable: true, isNew: true, metaNote: 'Garden colour puzzle', color: 'green', iconType: 'puzzle', engine: 'html5', image: '/images/bloom-loop-gameplay.webp' },
    { id: 'cash-tycoon', title: 'Cash Tycoon: Fame & Fortune', category: 'simulation', isPlayable: true, isNew: true, metaNote: 'Build a business tower', color: 'gold', iconType: 'stack', engine: 'html5', image: '/images/cash-tycoon-gameplay.webp' },
    { id: 'flappy-bird-3d', title: 'Flappy Bird 3D', category: 'arcade', isPlayable: true, isNew: true, metaNote: 'Colourful 3D flying arcade', color: 'blue', iconType: 'ball', engine: 'three', image: '/images/flappy-bird-3d-cover.webp' },
    { id: 'pixels-farm-craft', title: 'Pixels: Farm, Craft & Adventure', category: 'simulation', isPlayable: true, isNew: true, metaNote: 'Farm and explore a pixel world', color: 'green', iconType: 'platform', engine: 'html5', image: '/images/pixels-farm-craft-gameplay.webp' },
    { id: 'shop-tycoon', title: 'Shop Tycoon: Market Empire', category: 'simulation', isPlayable: true, isNew: true, metaNote: 'Run your own market', color: 'purple', iconType: 'stack', engine: 'html5', image: '/images/shop-tycoon-gameplay.webp' },
    { id: 'apex-velocity', title: 'Apex Velocity: F1 Supercar Studio', category: 'racing', isPlayable: true, isNew: true, isHot: true, metaNote: 'F1 supercar simulator & circuit builder', color: 'coral', iconType: 'car', engine: 'three', image: '/images/apex-velocity.png' },
    { id: 'voxelcraft', title: 'VoxelCraft: Survival & Building', category: '3d', isPlayable: true, isNew: true, metaNote: 'Survival & creative sandbox', color: 'green', iconType: 'stack', engine: 'three', image: '/images/voxelcraft-gameplay.webp' },
    { id: 'infinite-world', title: 'Infinite World', category: 'multiplayer', isPlayable: true, isNew: true, metaNote: 'Co-op city builder', color: 'blue', iconType: 'star', engine: 'three', isHot: true, image: '/images/infinite-world-city.jpg', legal: true },
    { id: 'gravity-switch', title: 'Gravity Switch', category: 'arcade', isPlayable: true, color: 'purple', iconType: 'runner', engine: 'canvas', isHot: true, isLightTheme: true, image: '/images/gravity-switch.jpg' },
    { id: 'hextris', title: 'Hextris Stack', category: 'puzzle', isPlayable: true, color: 'purple', iconType: 'puzzle', engine: 'canvas', isHot: true, image: '/images/hextris-stack.jpg' },
    { id: 'color-switch', title: 'Color Switch', category: 'arcade', isPlayable: true, color: 'purple', iconType: 'ball', engine: 'phaser', image: '/images/color-switch.jpg' },
    { id: 'tower-stacker', title: 'Tower Stacker', category: 'arcade', isPlayable: true, color: 'coral', iconType: 'stack', engine: 'phaser', image: '/images/tower-stacker.webp' },
    { id: 'neon-snake', title: 'Neon Snake', category: 'arcade', isPlayable: true, color: 'green', iconType: 'snake', engine: 'canvas', image: '/images/neon-snake-gameplay.jpg' },
    { id: 'block-merge', title: 'Block Merge', category: 'puzzle', isPlayable: true, color: 'purple', iconType: 'puzzle', engine: 'html5', image: '/images/block-merge-gameplay.jpg' },
    { id: 'turbo-drift', title: 'Turbo Drift', category: 'racing', isPlayable: true, color: 'blue', iconType: 'car', engine: 'three', image: '/images/turbo-drift-gameplay.jpg' },
    { id: 'monsoon-rickshaw-rush', title: 'Monsoon Rickshaw Rush', category: 'racing', isPlayable: true, isNew: true, color: 'gold', iconType: 'car', engine: 'three', image: '/images/monsoon-rickshaw-rush.jpg' },
    { id: 'ball-drop', title: 'Ball Drop', category: 'arcade', isPlayable: true, color: 'coral', iconType: 'ball', engine: 'pixi', image: '/images/ball-drop.webp' },
    { id: 'city-sprint', title: 'City Sprint', category: 'runner', isPlayable: true, color: 'gold', iconType: 'runner', engine: 'canvas', isLightTheme: true, image: '/images/city-sprint.webp' },
    { id: 'infinite-runner', title: 'Infinite Runner', category: 'runner', isPlayable: true, color: 'blue', iconType: 'runner', engine: 'phaser', image: '/images/infinite-runner.jpg' },
    { id: 'mario-king', title: 'Mario King', category: 'platformer', isPlayable: true, color: 'gold', iconType: 'platform', engine: 'canvas', isHot: true, image: '/images/mario-king.webp' },
    { id: 'gravity-shift', title: 'Gravity Shift', category: 'arcade', isPlayable: true, url: '/gravity-shift.html', color: 'blue', iconType: 'runner', engine: 'canvas', image: '/images/gravity-switch.jpg' }
].map((game) => ({
    ...game,
    ...(capturedGames.has(game.id) && {
        previewFrames: [1, 2, 3].map((frame) => `/images/gameplay/${game.id}/${frame}.png`),
    }),
}));

export default games;
