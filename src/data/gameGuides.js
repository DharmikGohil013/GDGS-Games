// ─── Per-game copy: controls, tips and SEO-friendly descriptions ───
// Used by the play page. Any id missing here falls back to generic text.

export const GAME_GUIDES = {
  'gravity-switch': {
    tagline: 'Flip gravity, dodge the spikes, chain the combo.',
    description: 'Gravity Switch is a one-button arcade reflex game. Tap to invert gravity, slip between floor and ceiling hazards, and collect orbs without breaking your chain. The longer you survive, the faster it gets.',
    controls: [
      { key: 'Space / Tap', label: 'Invert gravity' },
      { key: 'P / Esc', label: 'Pause' },
    ],
    tips: [
      'Flip early — the transition takes a few frames.',
      'Orbs collected back to back multiply your score.',
      'Speed ramps every few seconds; stop reacting and start reading ahead.',
    ],
  },
  hextris: {
    tagline: 'Rotate the hexagon, match three, keep the stack low.',
    description: 'Hextris Stack is a fast hexagonal puzzle game. Spin the central hexagon so falling blocks land on matching colours, clear three or more at once, and keep every side of the stack from overflowing.',
    controls: [
      { key: '← →', label: 'Rotate the hexagon' },
      { key: '↓', label: 'Speed up the falling block' },
      { key: 'Tap left / right', label: 'Rotate on touch' },
    ],
    tips: [
      'Clear chains back to back to build the combo multiplier.',
      'Rotate toward the tallest side when in doubt.',
      'Fast-dropping into a matching colour keeps the combo timer alive.',
    ],
  },
  'color-switch': {
    tagline: 'Match the colour, pass the ring, beat the height.',
    description: 'Color Switch is the classic neon colour-matching arcade game. Tap to jump, and only pass through obstacle segments that match your current colour. Colour swaps change everything mid-flight.',
    controls: [
      { key: 'Space / Tap', label: 'Jump' },
      { key: 'P / Esc', label: 'Pause' },
    ],
    tips: [
      'Short taps give finer control than holding.',
      'Line up the colour before you commit to the gap.',
      'Pick a harder mode for a bigger score multiplier.',
    ],
  },
  'tower-stacker': {
    tagline: 'Land dead centre to keep your full width.',
    description: 'Tower Stacker is a precision stacking game. Drop each sliding block onto the tower — any overhang gets sliced off and the next block is narrower. Land three perfect drops in a row and you win width back.',
    controls: [
      { key: 'Click / Tap', label: 'Drop the block' },
      { key: 'Space', label: 'Drop the block' },
    ],
    tips: [
      'Perfect drops are worth far more than safe ones.',
      'Watch the dashed guides — they mark the perfect window.',
      'Wind starts wobbling the block around floor 18.',
    ],
  },
  'neon-snake': {
    tagline: 'Chain berries fast to multiply every bite.',
    description: 'Neon Snake is the arcade classic rebuilt with combo chains, five power-ups, wall portals and hazards that spawn as you grow. Eat quickly to keep the chain alive and your multiplier climbing.',
    controls: [
      { key: '↑ ↓ ← →', label: 'Steer (WASD works too)' },
      { key: 'Swipe', label: 'Steer on touch' },
      { key: 'Shift', label: 'Dash — costs one body segment' },
    ],
    tips: [
      'Gold berries grow you by three but are worth 45 points.',
      'Plasma berries expire — grab them first.',
      'Ghost lets you pass through walls and your own tail.',
    ],
  },
  'block-merge': {
    tagline: 'Merge on back-to-back moves to build the chain.',
    description: 'Block Merge is 2048 with a chain multiplier, golden tiles and three rescue tools. Slide the board, merge matching numbers, and keep merging every move to stack the multiplier before the board fills.',
    controls: [
      { key: '↑ ↓ ← →', label: 'Slide the board' },
      { key: 'Swipe', label: 'Slide on touch' },
      { key: 'Z / H / F', label: 'Undo · Hammer · Shuffle' },
    ],
    tips: [
      'Keep your biggest tile pinned to one corner.',
      'Milestone tiles (128, 256, 512) hand out extra tools.',
      'A stuck board is survivable while you still hold a tool.',
    ],
  },
  'turbo-drift': {
    tagline: 'Hold the slide, bank the drift, burn the nitro.',
    description: 'Turbo Drift is an endless 3D highway racer. Grip falls away as you accelerate, so steering hard at speed breaks the car into a scoring drift. Bank drifts and near misses to charge nitro.',
    controls: [
      { key: '← →', label: 'Steer (A / D works too)' },
      { key: 'Space', label: 'Nitro boost' },
      { key: 'Drag', label: 'Steer on touch' },
    ],
    tips: [
      'Release the steer to bank a drift — holding forever scores nothing.',
      'Shaving past traffic charges nitro and pays a bonus.',
      'Nitro is invincibility-free: you still crash into traffic.',
    ],
  },
  'ball-drop': {
    tagline: 'Aim wide for the big multipliers.',
    description: 'Ball Drop is plinko with a risk dial. Aim the dropper, release a ball, and watch it bounce into a multiplier bucket. Switch to Wild mode for huge edge payouts and a dead centre that eats your ball.',
    controls: [
      { key: 'Move', label: 'Aim the dropper' },
      { key: 'Click / Tap', label: 'Release a ball' },
      { key: 'R', label: 'Switch risk mode' },
    ],
    tips: [
      'The outermost buckets refund a ball, so aiming wide is nearly free.',
      'Gold pegs charge your next ball for double value.',
      'Landing 2x or better keeps the chain multiplier alive.',
    ],
  },
  'city-sprint': {
    tagline: 'Time the double jump, keep the coin chain.',
    description: 'City Sprint is a rooftop endless runner. Jump and double-jump across the skyline, collect coin chains for a multiplier, and keep ahead of an ever-climbing speed.',
    controls: [
      { key: 'Space / Tap', label: 'Jump (tap again to double jump)' },
      { key: 'P / Esc', label: 'Pause' },
    ],
    tips: [
      'Save the second jump for the gap, not the obstacle.',
      'Coins collected in a row raise the bonus.',
      'Landing early costs you distance — ride the arc.',
    ],
  },
  'infinite-runner': {
    tagline: 'Five biomes, procedural terrain, run forever.',
    description: 'Infinite Runner is a pixel-art endless runner with procedurally generated worlds, five distinct biomes and stacking power-ups. Every run is different and the terrain never repeats.',
    controls: [
      { key: 'Space / Tap', label: 'Jump' },
      { key: 'Hold', label: 'Jump higher' },
      { key: 'P / Esc', label: 'Pause' },
    ],
    tips: [
      'Power-ups stack — grab a second before the first expires.',
      'Each biome changes the terrain rhythm, not just the colours.',
      'Harder modes pay a bigger distance multiplier.',
    ],
  },
};

export function getGuide(game) {
  const guide = GAME_GUIDES[game.id];
  if (guide) return guide;

  const name = game.title || game.id;
  const category = game.category || 'arcade';
  return {
    tagline: `Play ${name} free in your browser.`,
    description: `${name} is a free ${category} browser game on Playzy. No download, no install — it loads straight in your browser on desktop and mobile.`,
    controls: [
      { key: 'Mouse / Tap', label: 'Primary action' },
      { key: 'Space', label: 'Primary action' },
    ],
    tips: [],
  };
}
