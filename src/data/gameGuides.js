// ─── Per-game copy: controls, tips and SEO-friendly descriptions ───
// Used by the play page. Any id missing here falls back to generic text.

export const GAME_GUIDES = {
  'among-us-pixel-outpost': {
    tagline: 'Solve a pixel space mystery with AI crewmates.',
    description: 'Explore a pixel space outpost, complete crew tasks, watch for sabotage, and vote in meetings against computer-controlled crewmates.',
    controls: [{ key: 'Keyboard / Mouse', label: 'Move, interact, and choose meeting actions' }],
    tips: ['Finish tasks while keeping track of suspicious crew behaviour.'],
  },
  'bloom-loop': {
    tagline: 'Guide bees through a colourful garden puzzle.',
    description: 'Direct bee drones around a vine loop and match colours to clear flower tiles with pollen bursts.',
    controls: [{ key: 'Mouse / Tap', label: 'Choose bees and garden actions' }],
    tips: ['Plan each bee route around the flower colours ahead.'],
  },
  'cash-tycoon': {
    tagline: 'Grow a business tower into a fortune.',
    description: 'Open businesses, hire managers, collect profits, and expand your tower in a colourful idle tycoon game.',
    controls: [{ key: 'Mouse / Tap', label: 'Manage businesses and upgrades' }],
    tips: ['Reinvest early profits to grow your income.'],
  },
  'flappy-bird-3d': {
    tagline: 'Fly through a colourful 3D obstacle course.',
    description: 'Guide a bird through a 3D world, time each flap, and pass between obstacles to build a high score.',
    controls: [{ key: 'Space / Click / Tap', label: 'Flap and stay airborne' }],
    tips: ['Use short, steady taps to keep your height under control.'],
  },
  'pixels-farm-craft': {
    tagline: 'Farm, craft, and explore a pixel world.',
    description: 'Grow crops, gather resources, craft supplies, and complete quests in a retro pixel adventure.',
    controls: [{ key: 'Keyboard / Mouse', label: 'Move, interact, and manage your farm' }],
    tips: ['Watch your energy while planning crop and crafting tasks.'],
  },
  'shop-tycoon': {
    tagline: 'Build and manage your own market.',
    description: 'Place shop fixtures, stock products, set prices, and manage staff in an isometric store simulation.',
    controls: [{ key: 'Mouse / Tap', label: 'Build, stock, and manage your shop' }],
    tips: ['Keep popular products stocked as your shop expands.'],
  },
  'apex-velocity': {
    tagline: 'F1 supercar simulator with custom circuit curves studio and garage tuning.',
    description: 'Apex Velocity is an open-world supercar driving simulator featuring realistic high-speed physics, custom spline track creator and curves studio, dynamic weather, day-night cycle, performance garage tuning, and real-time F1 telemetry. Race iconic tracks like Spa, Monza, Silverstone, and Suzuka or engineer and test your own circuits.',
    controls: [
      { key: 'W / Up Arrow', label: 'Throttle / accelerate' },
      { key: 'S / Down Arrow', label: 'Brake / reverse' },
      { key: 'A / D / Left / Right', label: 'Steer left / right' },
      { key: 'Space', label: 'Handbrake / drift' },
      { key: 'E / Shift', label: 'Toggle DRS (Drag Reduction System)' },
      { key: 'C', label: 'Cycle camera view (Chase, Cockpit, Hood, Cinematic)' },
      { key: 'R', label: 'Reset car onto track grid' },
      { key: 'M', label: 'Toggle sound effects & engine audio' },
      { key: 'H', label: 'Toggle bottom HUD control dock' },
      { key: 'Esc', label: 'Pause / resume driving' },
    ],
    tips: [
      'Activate DRS on long straights to reduce drag and reach top speeds above 350 km/h.',
      'Brake early before tight corners and trail off the brake to hit the apex cleanly.',
      'Head into the Garage to tune your car horsepower, downforce, brake bias, and tire compound.',
      'Use the Curves Studio to design your own custom tracks with banked curves, elevation, and terrain.',
    ],
  },
  'voxelcraft': {
    tagline: 'Mine, craft, build, and survive your own voxel world.',
    description: 'Explore a procedurally generated 3D block world in VoxelCraft: Survival & Building. Gather resources, craft tools, build a shelter, and face hostile mobs in Survival mode, or explore and build in Creative mode with flight. Choose a world seed before you start. Play with a keyboard and mouse on desktop; worlds last for the current session.',
    controls: [
      { key: 'WASD / Mouse', label: 'Move and look around; click the world to capture the mouse' },
      { key: 'Space / Shift', label: 'Jump / sprint' },
      { key: 'Left click', label: 'Hold to mine blocks or click to attack' },
      { key: 'Right click', label: 'Place a block, eat food, or interact' },
      { key: 'E / Esc', label: 'Open inventory / close inventory or pause' },
      { key: '1–9 / Mouse wheel', label: 'Select a hotbar slot' },
      { key: 'F', label: 'Toggle flight in Creative mode' },
      { key: 'P / M', label: 'Pause or resume / toggle sound' },
    ],
    tips: [
      'Gather wood and build a shelter before night brings hostile mobs.',
      'Use the right pickaxe to mine stone faster and keep food in your hotbar.',
      'Try Creative mode to explore and practice building without survival damage.',
      'Use fullscreen for more room. Leaving or reloading the game starts a fresh world.',
    ],
  },
  'gravity-shift': {
    tagline: 'Jump between platforms and stay ahead of the hazards.',
    description: 'Gravity Shift is an arcade platform game where you jump between platforms, avoid hazards and try to survive as the game speeds up.',
    controls: [
      { key: 'Space / W / Up Arrow', label: 'Jump between platforms' },
    ],
    tips: ['Watch the next platform before you jump, and leave room to react as the pace increases.'],
  },
  'infinite-world': {
    tagline: 'Build a 3D city together — live, with friends.',
    description: 'Infinite World is a 3D city builder you can play alone or with friends in realtime. Lay roads, towers, parks, rail and rivers, grow from a hamlet into a metropolis, and invite a partner to build the same world with you live. Keep your world private or make it public so anyone can watch.',
    controls: [
      { key: 'Click / Drag', label: 'Build — drag to lay roads, rail and water' },
      { key: 'Right-drag / Shift-drag', label: 'Move the camera' },
      { key: 'Wheel', label: 'Zoom' },
      { key: 'R', label: 'Rotate the building' },
      { key: 'X', label: 'Demolish' },
      { key: 'V', label: 'Drive through your city' },
      { key: 'C (in Drive)', label: 'Switch camera: Near, Seat, Chase, Hood, Drone' },
    ],
    tips: [
      'The first 20 minutes are free — build big, then manage your coins.',
      'Tap Share to get an invite code: your partner builds with you instantly.',
      'Homes near roads, parks and services earn more rent.',
      'Cars can drive directly into City Parking Lots and plazas — park in marked bays to rest!',
    ],
  },
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
  'monsoon-rickshaw-rush': {
    tagline: 'Pick up fares and race through Mumbai in the monsoon.',
    description: 'Take the wheel of a Mumbai auto-rickshaw, collect passengers, and deliver them through busy monsoon streets. Dodge traffic and slippery puddles, tune your ride in the garage, and earn fares before the shift ends.',
    controls: [
      { key: 'WASD / Arrows', label: 'Accelerate, reverse, and steer' },
      { key: 'Space', label: 'Brake' },
      { key: 'Shift', label: 'Use nitro' },
      { key: 'H', label: 'Sound the horn' },
      { key: 'R', label: 'Reposition the rickshaw' },
      { key: 'Esc / P', label: 'Pause or resume' },
      { key: 'Touch controls', label: 'Drive on mobile' },
    ],
    tips: [
      'Pick up the passenger marked on your map, then drive to the drop-off marker.',
      'Brake before tight turns to keep traction on wet roads.',
      'Use nitro on open stretches to reach fares faster.',
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
  'mario-king': {
    tagline: 'Six kingdoms, one crown — stomp your way to the throne.',
    description: 'Mario King is a pixel-art platforming adventure across six hand-built kingdoms. Run, jump and stomp goombas across grass, desert, cave, ice and sky worlds, then storm the castle for a boss fight against the King himself.',
    controls: [
      { key: '← → / A D', label: 'Run left / right' },
      { key: 'Space / ↑ / W', label: 'Jump — hold for a higher jump' },
      { key: '↓ / S', label: 'Duck — dodge low attacks' },
      { key: 'Stomp', label: 'Jump on enemies to defeat them' },
    ],
    tips: [
      'Chain stomps in the air without touching ground to multiply your score.',
      'Star power lets you plow through enemies — save it for tight enemy clusters.',
      'The King only takes damage from a stomp — duck under his throw and jump on his head three times.',
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
