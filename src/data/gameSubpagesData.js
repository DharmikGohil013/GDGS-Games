// ─── Comprehensive 6-page data for all 22 Playzy games ───
// 1. What is this game | 2. About this game | 3. Tutorial | 4. Support | 5. Terms | 6. Privacy

export const SUBPAGE_TYPES = [
  { id: 'what-is', label: 'What is this game?', shortLabel: 'Overview', icon: 'info' },
  { id: 'about', label: 'About this game', shortLabel: 'About', icon: 'book' },
  { id: 'tutorial', label: 'Tutorial & Guide', shortLabel: 'Tutorial', icon: 'compass' },
  { id: 'support', label: 'Support & FAQ', shortLabel: 'Support', icon: 'help' },
  { id: 'terms', label: 'Terms & Conditions', shortLabel: 'Terms', icon: 'shield' },
  { id: 'privacy', label: 'Privacy Policy', shortLabel: 'Privacy', icon: 'lock' },
];

export const SUBPAGE_ALIASES = {
  policy: 'privacy',
  guide: 'tutorial',
  overview: 'what-is',
};

const SUPPORT_EMAIL = 'dharmikgohil.work@gmail.com';

export function getGameScreenshots(game) {
  const images = [];
  if (game.previewFrames && game.previewFrames.length > 0) {
    images.push(...game.previewFrames);
  } else {
    if (game.image) images.push(game.image);
    if (game.id === 'infinite-world') {
      images.push('/images/infinite-world.jpg');
      images.push('/images/infinite-world-city.jpg');
    }
  }
  return images;
}

export const GAME_DETAILS = {
  'apex-velocity': {
    whatIs: {
      headline: 'The Ultimate Web-Based F1 Supercar Driving Simulator & Circuit Builder',
      summary: 'Apex Velocity is an ultra-responsive, browser-native 3D open-wheel and supercar driving experience designed for pure motorsport adrenaline. Built on high-performance Three.js WebGL physics, it bridges realistic aerodynamic vehicle dynamics with creative sandbox freedom. Players can master demanding laps across legendary tracks like Monza, Spa-Francorchamps, and Suzuka, or open the in-depth Curves Studio to sculpt their own custom high-speed tracks complete with banked hairpins, rolling elevation changes, and custom surface grip.',
      coreFeatures: [
        { title: 'True Aero & Telemetry Physics', desc: 'Simulated Drag Reduction System (DRS), tire compound wear, slip angles, downforce, and live telemetry feed showing speed, G-force, and RPM.' },
        { title: 'Custom Spline Circuit Studio', desc: 'Powerful track architect allowing you to lay down custom asphalt ribbons, banking angles, curb apexes, and grandstands.' },
        { title: 'Dynamic Weather & Time of Day', desc: 'Experience sun glare, dusk transitions, midnight headlights, and rain squalls affecting tire adhesion in real time.' },
        { title: 'Performance Garage Tuning', desc: 'Fine-tune gear ratios, front-to-rear brake bias, suspension stiffness, and aero downforce to shave tenths off your lap time.' },
      ],
      specs: {
        category: 'Racing / 3D Simulation',
        engine: 'Three.js / WebGL / Custom Physics',
        input: 'Keyboard, Gamepad, Touch Controls',
        platform: 'Web Browser (Desktop & Mobile)',
        audio: 'Synthesized V6 Turbo Hybrid Audio Engine',
        saveState: 'Local Browser Storage (Best Laps & Custom Circuits)',
      },
      whyPlay: [
        'Zero waiting: Instant start directly in modern browsers without 50GB downloads.',
        'High framerate: Optimized WebGL engine delivering 60+ FPS on standard integrated GPUs.',
        'Complete creative autonomy: Build circuits and immediately test-drive them without leaving the canvas.',
      ],
    },
    about: {
      headline: 'Engineering the Thrill of Modern Formula Motorsport on the Open Web',
      lore: 'In the elite world of apex motorsport, races are won not just by brave steering, but by aerodynamic mastery, millimeter tire control, and precision circuit engineering. Apex Velocity places you in the driver’s cockpit of an experimental ground-effect prototype racer where every curb strike, brake lockup, and DRS straightaway surge demands total focus.',
      mechanics: 'The vehicle model computes independent suspension travel, slip-ratio tire grip curves, and active aerodynamic downforce. Activating DRS trims rear wing drag, boosting straight-line terminal velocity beyond 350 km/h, but requires early braking at corner entry to re-engage stability. The Curves Studio uses cubic Hermite splines to generate smooth, continuous asphalt ribbons with banking and elevation gradients.',
      tech: 'Engineered with Three.js and custom GLSL shaders, Apex Velocity features procedural asphalt textures, bloom post-processing, screen-space tire smoke particles, and multi-camera chase, cockpit, hood, and cinematic viewpoints.',
      developmentNotes: 'Crafted as a demonstration of high-performance web graphics, Apex Velocity avoids third-party bloat to maintain rock-solid 60 FPS performance and zero input latency.',
    },
    tutorial: {
      headline: 'Driver’s Handbook: Race Craft, Keybindings & Lap Optimization',
      quickStart: [
        { step: '1', title: 'Grid Launch & Gear Acceleration', desc: 'Press W or Up Arrow to accelerate. Ease off slightly if wheels spin off the line, then apply full throttle through the rev band.' },
        { step: '2', title: 'Corner Entry & Trail Braking', desc: 'Hit S or Down Arrow before turning. Bleed off the brake gradually as you turn in toward the apex to keep front grip pinned.' },
        { step: '3', title: 'DRS Activation on Straights', desc: 'Tap E or Left Shift when entering DRS activation zones to open the rear wing flap for a 20+ km/h top-speed advantage.' },
        { step: '4', title: 'Garage Optimization', desc: 'If the rear end steps out on corner exit, enter the Garage to adjust downforce higher or move brake bias 2% forward.' },
      ],
      controls: [
        { key: 'W / Up Arrow', action: 'Throttle / Accelerate forward', device: 'Keyboard', tip: 'Smooth inputs prevent excessive tire wheelspin' },
        { key: 'S / Down Arrow', action: 'Brake / Reverse', device: 'Keyboard', tip: 'Threshold brake before the corner apex, not during it' },
        { key: 'A / D or Left / Right', action: 'Steering rack left / right', device: 'Keyboard', tip: 'Avoid abrupt lock-to-lock snaps at high speed' },
        { key: 'Space', action: 'Handbrake / Drift initiation', device: 'Keyboard', tip: 'Useful for tight hairpin pivots' },
        { key: 'E / Shift', action: 'Toggle DRS flap', device: 'Keyboard', tip: 'Only engage on long straightaways' },
        { key: 'C', action: 'Cycle Camera Views', device: 'Keyboard', tip: 'Cockpit view enhances apex spotting' },
        { key: 'R', action: 'Reset car onto track centre', device: 'Keyboard', tip: 'Recovers instantly from sand trap spins' },
        { key: 'M', action: 'Toggle audio & engine sound', device: 'Keyboard', tip: 'Mutes and unmutes synthesized engine audio' },
        { key: 'H', action: 'Toggle HUD telemetry dock', device: 'Keyboard', tip: 'Frees up full screen real estate for recording' },
      ],
      scoring: 'Lap times are recorded down to the millisecond with sector deltas. Clean laps without track limit violations are saved to your personal local leaderboard.',
      proTips: [
        'Apex clipping: Place inside tires on the striped curb without touching deep grass to carry 10 km/h more corner exit speed.',
        'Downforce vs Top Speed: High downforce yields cornering grip at Spa, while low downforce dominates the high-speed straights of Monza.',
        'Tire heat management: Avoid sliding sideways through high-speed sweepers, which spikes tire temperature and diminishes grip.',
      ],
      mistakes: [
        { mistake: 'Braking too late inside the corner', fix: 'Brake in a straight line before turning the wheel, then release brake pressure as you turn.' },
        { mistake: 'Leaving DRS open into braking zones', fix: 'Tap DRS to close the wing before hitting the brakes to restore aerodynamic downforce.' },
      ],
    },
    support: {
      headline: 'Apex Velocity Help Center & Performance Troubleshooting',
      faqs: [
        { q: 'Why is my steering sluggish or dropping frames?', a: 'Make sure Hardware Acceleration is enabled in your browser settings (Chrome/Edge/Brave: Settings > System > Use hardware acceleration). Ensure your laptop is plugged in or set to High Performance GPU.' },
        { q: 'How do I save custom tracks built in Curves Studio?', a: 'Tracks created in the Curves Studio automatically persist to your browser’s LocalStorage under the active session profile.' },
        { q: 'Can I play with an external game controller or wheel?', a: 'Yes! Standard Xbox, PlayStation, and generic USB gamepads supporting the HTML5 Gamepad API are detected automatically when a button is pressed.' },
        { q: 'Why is there no engine sound on page load?', a: 'Modern browsers block audio autoplay until a direct user gesture (mouse click or keypress) occurs. Click anywhere on the track to unlock the audio context.' },
        { q: 'How do I reset my best lap time records?', a: 'You can clear your local personal records from the in-game settings modal or by clearing site data in browser developer tools.' },
      ],
      troubleshooting: [
        { issue: 'Black screen or WebGL context lost', fix: 'Update your graphics drivers and ensure WebGL 2.0 is active at chrome://gpu.' },
        { issue: 'Car pulls to one side without input', fix: 'Recalibrate your gamepad thumbstick deadzone in browser gamepad settings or disconnect secondary controllers.' },
      ],
    },
    terms: {
      headline: 'Terms of Use — Apex Velocity: F1 Supercar Studio',
      sections: [
        { title: '1. Acceptance & License', content: 'By launching and playing Apex Velocity on Playzy, you are granted a revocable, non-exclusive, personal license to run and enjoy the simulation for non-commercial entertainment.' },
        { title: '2. Fair Play & Time Trial Integrity', content: 'Players agree not to inject memory hacks, speed modifiers, or automated telemetry bots that forge invalid lap times.' },
        { title: '3. Intellectual Property', content: 'All 3D vehicle geometries, procedural spline algorithms, engine sound synthesizers, and branding are the intellectual property of Dharmik Gohil and Playzy.' },
        { title: '4. Service Availability & As-Is Warranty', content: 'Apex Velocity is provided free of charge on an “as-is” basis without warranty of continuous uninterrupted availability or device compatibility.' },
      ],
    },
    privacy: {
      headline: 'Privacy & Data Policy — Apex Velocity',
      sections: [
        { title: '1. What We Store Locally', content: 'Apex Velocity stores your best lap records, custom track spline coordinates, audio volume preferences, and garage tuning setups directly in your browser’s HTML5 LocalStorage.' },
        { title: '2. No Personal Data Collection', content: 'No real names, physical locations, email addresses, or device identifiers are collected, transmitted, or sold to third parties.' },
        { title: '3. Analytics & Performance Metrics', content: 'Playzy collects only aggregated, anonymous operational telemetry (such as page views and WebGL error counts) to debug engine crashes.' },
        { title: '4. Data Deletion', content: 'You can completely wipe all saved lap times and custom circuits at any time by clearing your browser cache and cookies for playzyy.me.' },
      ],
    },
  },

  'voxelcraft': {
    whatIs: {
      headline: 'Procedural 3D Block Survival & Creative Voxel Sandbox',
      summary: 'VoxelCraft: Survival & Building is an open-ended 3D procedural sandbox that invites you into an endless voxel wilderness. Powered by an ultra-fast Three.js block renderer, you can chop timber, mine underground caverns for coal and iron ore, craft sturdy survival tools, and erect defensive shelters against dangerous nocturnal mobs. For builders who wish to create without constraints, Creative mode unlocks instant flight, indestructible building materials, and unrestricted architectural freedom.',
      coreFeatures: [
        { title: 'Dual Survival & Creative Modes', desc: 'Choose between challenging health, hunger, and mob survival, or boundless creative flight and instant block placement.' },
        { title: 'Dynamic Procedural Biomes', desc: 'Explore rolling green hills, dense oak woodlands, stone bluffs, desert dunes, and subterranean ore veins.' },
        { title: 'Comprehensive Crafting Tree', desc: 'Craft wooden planks, workbenches, pickaxes, swords, torches, stone brickwork, and furnace smelters.' },
        { title: 'Day-Night Lighting & Shadow Cycle', desc: 'Watch the sun arc across the horizon, casting dynamic voxel shadows and requiring torch placement as darkness falls.' },
      ],
      specs: {
        category: '3D Sandbox / Voxel Survival',
        engine: 'Three.js / WebGL Custom Chunk Mesher',
        input: 'Keyboard & Mouse (Pointer Lock API)',
        platform: 'Desktop Browser (Chrome, Firefox, Safari, Edge)',
        audio: 'Ambient Nature & Block Footstep Foley',
        saveState: 'Session Memory & Seed Generation',
      },
      whyPlay: [
        'Runs directly in your browser: No Java installs, modpack launchers, or multi-gigabyte client downloads required.',
        'Instant world generation: Enter your favorite seed number and materialize a fresh terrain within two seconds.',
        'Zero paywalls: Complete crafting recipe catalog and building materials available freely.',
      ],
    },
    about: {
      headline: 'The Craft of Procedural Voxels: Infinite Canvas in the Browser',
      lore: 'You awaken on the coastline of an uncharted block realm with only your bare hands and the rising morning sun. Every mountain peak, subterranean cave fissure, and ancient tree is formed of discrete voxel blocks awaiting your chisel. As dusk approaches, strange shadows emerge from the deep cavern hollows, turning the peaceful landscape into a desperate test of resourcefulness.',
      mechanics: 'Terrain is generated using 3D Simplex noise functions combined with greedy voxel face-culling algorithms, packing thousands of blocks into optimized GPU draw calls. The physics engine tracks discrete AABB block collision boxes, gravity acceleration, jump impulses, and raycast reach vectors.',
      tech: 'VoxelCraft utilizes Three.js with custom chunk management that streams and unloads terrain around the player camera to prevent browser memory leaks. Pointer Lock API locks the cursor for fluid first-person perspective navigation.',
      developmentNotes: 'Built to demonstrate that voxel sandbox gaming can thrive on the web with near-instant load times and buttery smooth 60 FPS gameplay on standard laptops.',
    },
    tutorial: {
      headline: 'Survivalist’s Manual: Gathering, Mining, Crafting & Shelter',
      quickStart: [
        { step: '1', title: 'Gather Raw Wood', desc: 'Approach an oak tree, hold Left Click to punch wood blocks until they break into collectible logs.' },
        { step: '2', title: 'Open Inventory & Craft Planks', desc: 'Press E to open your crafting grid. Convert wood logs into timber planks, then assemble a Crafting Table.' },
        { step: '3', title: 'Craft Wooden Pickaxe & Mine Stone', desc: 'Place your Crafting Table, construct wooden sticks and a wooden pickaxe, then mine cobblestone from the nearest cliff.' },
        { step: '4', title: 'Construct Night Shelter & Torches', desc: 'Before dusk arrives, build a 4x4 dirt or stone shelter with a doorway and place torches to illuminate the interior.' },
      ],
      controls: [
        { key: 'W A S D', action: 'Move forward, strafe left, back, right', device: 'Keyboard', tip: 'Hold W while sprinting for faster traversal' },
        { key: 'Mouse Look', action: 'Look around (Pointer Lock)', device: 'Mouse', tip: 'Click anywhere on the world to lock your mouse cursor' },
        { key: 'Space', action: 'Jump / Ascend in Flight', device: 'Keyboard', tip: 'Time jumps to scale 1-block terrain terraces' },
        { key: 'Left Shift', action: 'Sprint / Descend in Flight', device: 'Keyboard', tip: 'Consumes stamina in survival mode' },
        { key: 'Left Click', action: 'Mine / Attack block or mob', device: 'Mouse', tip: 'Hold down to continuously chip away at tough blocks' },
        { key: 'Right Click', action: 'Place block / Interact / Eat food', device: 'Mouse', tip: 'Aims at the targeted block face highlighted in wireframe' },
        { key: 'E / Esc', action: 'Open inventory / Pause menu', device: 'Keyboard', tip: 'Releases mouse pointer lock when menu is opened' },
        { key: '1 to 9 / Wheel', action: 'Select active Hotbar slot', device: 'Keyboard/Mouse', tip: 'Keep weapons and food on quick-access keys' },
        { key: 'F', action: 'Toggle Flying (Creative Mode)', device: 'Keyboard', tip: 'Double-tap or press F to glide effortlessly over terrain' },
      ],
      scoring: 'Survival score is determined by days survived, blocks mined, rare ore extracted, and structures erected.',
      proTips: [
        'Never dig straight down: You might fall into deep lava caverns or drop into a mob pit.',
        'Upgrade tools promptly: Stone pickaxes mine iron ore, while iron pickaxes mine gold and diamond blocks.',
        'Torch breadcrumbs: When exploring underground labyrinth caves, place torches exclusively on the right wall so following left torches always leads back to the surface.',
      ],
      mistakes: [
        { mistake: 'Caught without light at nightfall', fix: 'Always harvest coal early or craft charcoal in a furnace before exploring far from shelter.' },
        { mistake: 'Using the wrong tool on stone', fix: 'Mining stone with bare hands yields no cobblestone drops; always use a pickaxe.' },
      ],
    },
    support: {
      headline: 'VoxelCraft Player Support, FAQs & Performance Advice',
      faqs: [
        { q: 'Why won’t my mouse cursor lock into the game screen?', a: 'Modern browsers require you to click directly on the game canvas. If a browser extension interferes with the Pointer Lock API, press Esc and click once in the centre of the window.' },
        { q: 'Does my world save if I refresh or close the tab?', a: 'Currently, VoxelCraft runs high-speed procedural session memory. Take note of your world Seed number on the start screen so you can regenerate the exact same terrain landscape anytime.' },
        { q: 'How do I reduce stuttering or lag on low-end laptops?', a: 'Switch your browser into Fullscreen mode (F11 or the Fullscreen button) and close heavy background browser tabs to free GPU memory.' },
        { q: 'Why can’t I place blocks in certain locations?', a: 'Blocks cannot be placed inside your player character’s bounding box. Take half a step backward before placing a block beneath your feet.' },
      ],
      troubleshooting: [
        { issue: 'Pointer lock drops unexpectedly', fix: 'Pressing Esc intentionally releases the pointer to let you access browser tabs. Simply click back on the canvas to resume.' },
        { issue: 'Blocks appear transparent or invisible', fix: 'Ensure your graphics card supports WebGL 2.0 with Hardware Acceleration enabled.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — VoxelCraft: Survival & Building',
      sections: [
        { title: '1. Free Web Service', content: 'VoxelCraft is provided as a free-to-play web game for personal, non-commercial use on the Playzy network.' },
        { title: '2. Prohibited Conduct', content: 'Players may not attempt to reverse engineer, decompile, or scrape the voxel chunk rendering engine or inject automated scripts to flood server endpoints.' },
        { title: '3. Intellectual Property Notice', content: 'VoxelCraft is an independent voxel implementation inspired by the voxel genre. All code, custom textures, and shaders are proprietary to Dharmik Gohil and Playzy.' },
        { title: '4. Limitation of Liability', content: 'The game is provided without warranties of session data retention. Playzy is not liable for lost session builds resulting from browser restarts or memory flushes.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — VoxelCraft',
      sections: [
        { title: '1. Local Storage Only', content: 'VoxelCraft operates strictly in the client-side browser environment. Your settings, chosen seed, and key preferences remain inside your device.' },
        { title: '2. No Account Required', content: 'You are never required to provide your name, email, or credentials to play VoxelCraft.' },
        { title: '3. COPPA & Family Safety', content: 'VoxelCraft contains zero violent blood effects, zero chat tracking, and complies fully with child privacy standards.' },
      ],
    },
  },

  'infinite-world': {
    whatIs: {
      headline: 'Collaborative 3D Multiplayer City Builder & Realtime Sandbox',
      summary: 'Infinite World is an innovative real-time 3D city builder that you can play alone or collaboratively with friends worldwide. Construct sprawling metropolitan skylines featuring high-rise corporate towers, leafy suburban neighborhoods, industrial districts, water canals, and complex monorail transit networks. Switch seamlessly between god-like aerial camera planning and first-person Drive Mode to personally navigate sports cars and sedans through your bustling hand-crafted avenues.',
      coreFeatures: [
        { title: 'Live Co-Op Multiplayer', desc: 'Share an invite code or link with friends to build, zone, and landscape the exact same city in real time.' },
        { title: 'Integrated Drive Mode', desc: 'Hop behind the wheel of cars, taxis, and emergency vehicles to tour your road network from street level.' },
        { title: 'Dynamic Economy & Population', desc: 'Balance residential, commercial, and industrial zoning to generate tax revenue and attract thriving citizen populations.' },
        { title: 'Public & Private Worlds', desc: 'Keep your secret architectural projects private or publish them to the Explore directory for the community to tour.' },
      ],
      specs: {
        category: 'Multiplayer / 3D Simulation',
        engine: 'Three.js / WebSockets / Node.js Cluster',
        input: 'Mouse, Keyboard, Touch Controls',
        platform: 'Cross-platform Web Browser',
        audio: 'Urban Ambience & Vehicle Engine SFX',
        saveState: 'Cloud Database Storage (Hashed Account ID)',
      },
      whyPlay: [
        'Instant co-op: Share a simple 6-character room code to have your friends join your city immediately.',
        'Drive through your own creations: Experience your city from a citizen’s perspective with five custom vehicle camera angles.',
        'Lightweight and fast: Runs smoothly even on older laptops and tablets without dedicated GPUs.',
      ],
    },
    about: {
      headline: 'The Architecture of Collaborative Urban Construction',
      lore: 'From the founding brick of a sleepy coastal township to the soaring heights of a glowing neon megacity, Infinite World lets you author living urban history. Manage power grids, optimize commuter transit loops, and design breathtaking city parks alongside architects from around the globe.',
      mechanics: 'The game world is governed by grid-based zoning rules with continuous road curvature splines. Residential zones require clean road connections and park proximity to upgrade from bungalows to penthouses. WebSocket synchronization broadcasts player cursor positions, building placement, and demolition events in milliseconds.',
      tech: 'Engineered with Three.js WebGL rendering, instanced building meshes for maximum draw-call efficiency, and a robust WebSocket multiplayer backbone that ensures smooth state reconciliation across multiple simultaneous builders.',
      developmentNotes: 'Created by Dharmik Gohil to pioneer zero-friction multiplayer gaming in the browser, Infinite World eliminates cumbersome lobby systems in favor of rapid instant-join rooms.',
    },
    tutorial: {
      headline: 'Mayor’s Handbook: Urban Planning, Zoning, Transport & Co-Op',
      quickStart: [
        { step: '1', title: 'Lay Primary Road Arteries', desc: 'Select the Road tool and drag across the terrain to form your primary transportation grid.' },
        { step: '2', title: 'Zone Residential & Commercial Districts', desc: 'Place housing along tree-lined streets and position commercial shopping hubs near major intersections.' },
        { step: '3', title: 'Connect Public Utilities & Parks', desc: 'Install power plants, water towers, and recreational parks to boost land value and trigger skyscraper growth.' },
        { step: '4', title: 'Invite Friends & Drive Your City', desc: 'Tap the Share button to copy your world code, then press V to jump into Drive Mode and cruise your new avenues.' },
      ],
      controls: [
        { key: 'Left Click / Drag', action: 'Build selected structure or drag road / rail / water', device: 'Mouse', tip: 'Drag in straight lines for clean street layouts' },
        { key: 'Right-Drag / Shift-Drag', action: 'Rotate & pan the aerial camera', device: 'Mouse', tip: 'Gives full 360-degree vantage of your skyline' },
        { key: 'Mouse Wheel', action: 'Zoom in and out', device: 'Mouse', tip: 'Zoom down to street level to inspect traffic details' },
        { key: 'R', action: 'Rotate selected building', device: 'Keyboard', tip: 'Align front facades to face adjacent roadways' },
        { key: 'X', action: 'Toggle Bulldozer / Demolish tool', device: 'Keyboard', tip: 'Refunds a portion of structure construction costs' },
        { key: 'V', action: 'Enter / Exit Vehicle Drive Mode', device: 'Keyboard', tip: 'Instantly spawns a vehicle to drive on your roads' },
        { key: 'C (in Drive Mode)', action: 'Cycle Drive Cameras (Near, Seat, Chase, Hood, Drone)', device: 'Keyboard', tip: 'First-person seat camera provides highest driving immersion' },
      ],
      scoring: 'City prosperity is rated by total population, citizen happiness percentage, and hourly treasury revenue.',
      proTips: [
        'Buffer industrial pollution: Keep heavy industrial factories separated from quiet residential zones by a strip of commercial stores or public parks.',
        'Highways prevent gridlock: As population exceeds 10,000 citizens, upgrade narrow roads to multi-lane avenues and roundabouts.',
        'Plaza Parking: Cars can drive straight into city parking structures and plazas—park in marked bays to enjoy the vista.',
      ],
      mistakes: [
        { mistake: 'Over-zoning without roads', fix: 'Every residential tower requires direct road frontage to receive power and municipal services.' },
        { mistake: 'Inviting untrusted partners to private builds', fix: 'Partners have full demolition rights; only share invite codes with trusted collaborators.' },
      ],
    },
    support: {
      headline: 'Infinite World Technical Support & Account FAQs',
      faqs: [
        { q: 'How do I recover access to my city if I forgot my credentials?', a: 'Your login is your username plus your salted birthday hash. If you cannot remember your login, email support with your username and city name to recover your account.' },
        { q: 'Can other players edit my private world without permission?', a: 'No. Private worlds are strictly locked to the owner and invited partners with an active invite code.' },
        { q: 'What happens if the game says “Offline — reconnecting”?', a: 'Your offline edits are cached in memory and synchronized immediately upon reconnecting to the server cluster.' },
        { q: 'How do I report griefing or inappropriate city names?', a: 'Send an email to dharmikgohil.work@gmail.com with the world name, timestamp, and screenshot evidence for moderation review.' },
        { q: 'How can I request permanent deletion of my account and worlds?', a: 'Email support from the address associated with your inquiry; all worlds and database records are permanently purged within 30 days.' },
      ],
      troubleshooting: [
        { issue: 'WebSocket connection closed immediately', fix: 'Ensure your network firewall or VPN allows secure WebSocket connections on port 443 (WSS).' },
        { issue: 'Drive mode car gets stuck in terrain geometry', fix: 'Press V twice to exit and re-enter drive mode, which respawns your car on the nearest asphalt road.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Infinite World',
      sections: [
        { title: '1. Multiplayer Agreement', content: 'By joining, registering, or interacting with Infinite World, you agree to abide by these Terms, the Infinite World Privacy Policy, and general Playzy service guidelines.' },
        { title: '2. Account Security & Identity', content: 'You are responsible for safeguarding your login credentials. Usernames must remain respectful and free of hate speech, defamation, or impersonation.' },
        { title: '3. Community Worlds & Content Standards', content: 'Public worlds must not contain hateful, defamatory, violent, or sexually explicit structures or text. Playzy reserves the right to remove non-compliant worlds.' },
        { title: '4. Virtual Currency & Game Economy', content: 'In-game city coins and milestone unlocks have no real-world monetary value and cannot be exchanged, refunded, or traded.' },
        { title: '5. Service Modifications', content: 'Multiplayer server infrastructure may undergo periodic updates, database migrations, or maintenance without advance liability.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Infinite World',
      sections: [
        { title: '1. What We Collect', content: 'We collect your chosen username, a one-way cryptographically salted hash of your birthday (used strictly as an authentication key), and a randomly generated player code. We never collect real names, phone numbers, or credit cards.' },
        { title: '2. Gameplay & World Data', content: 'World layouts, building placement coordinates, population stats, and partner lists are stored securely in our database. Ephemeral live cursor positions are broadcast in real time and discarded.' },
        { title: '3. Technical Server Logs', content: 'Temporary IP addresses and session tokens are retained solely for rate-limiting, anti-abuse security, and bug mitigation.' },
        { title: '4. Zero Advertising or Tracking', content: 'Infinite World contains zero third-party advertising SDKs, zero cross-site tracker pixels, and sells no player telemetry.' },
        { title: '5. Account Erasure Rights', content: 'Players can request total deletion of their account, player ID, and associated worlds at any time by contacting dharmikgohil.work@gmail.com.' },
      ],
    },
  },

  'gravity-switch': {
    whatIs: {
      headline: 'Fast-Paced One-Touch Kinetic Gravity Inversion Arcade',
      summary: 'Gravity Switch is an exhilarating, lightning-fast one-button reflex runner that flips classical platforming on its head. Guide a kinetic energy cube through a treacherous neon labyrinth filled with floor spikes, ceiling lasers, and sudden drops. Instead of jumping, a single tap instantaneously flips gravitational pull between ceiling and floor, challenging players to navigate microsecond hazard corridors at ever-increasing speeds.',
      coreFeatures: [
        { title: 'Instantaneous Gravity Inversion', desc: 'Single tap or spacebar input flips gravity polarity instantaneously with zero inertia lag.' },
        { title: 'Kinetic Combo Chain System', desc: 'Collect glowing energy orbs in succession without missing to trigger massive score multiplier streaks.' },
        { title: 'Dynamic Speed Ramp', desc: 'The obstacle corridor accelerates smoothly every 10 seconds, pushing player anticipation and reflexes to the limit.' },
        { title: 'Minimalist High-Contrast Aesthetic', desc: 'Clean geometric vector art ensuring maximum readability and zero visual clutter at ultra-high speeds.' },
      ],
      specs: {
        category: 'Arcade / Reflex Runner',
        engine: 'HTML5 Canvas 2D Fast Renderer',
        input: 'Single Button / Tap / Spacebar',
        platform: 'Desktop & Mobile Web Browsers',
        audio: 'Electronic SFX & Rhythm Cues',
        saveState: 'Local Storage High Score & Stats',
      },
      whyPlay: [
        'Instant pick-up-and-play: Takes 5 seconds to learn, but provides endless depth for high-score chasers.',
        'Zero input delay: Optimized 60 FPS Canvas rendering ensures your flip occurs on the exact frame you press.',
        'Perfect for short breaks: Fast 60-second adrenaline bursts that fit into any schedule.',
      ],
    },
    about: {
      headline: 'Mastering the Physics of Polarity in a Cyber Labyrinth',
      lore: 'Trapped inside a particle accelerator conduit, your experimental kinetic cube must ride gravitational waveforms to avoid total matter annihilation. As the containment field collapses, gravity polarities invert at the speed of light.',
      mechanics: 'The physics engine models an instantaneous vertical velocity inversion while maintaining forward horizontal acceleration. Collision masks check precise bounding boxes against dangerous spike spikes and energy boundaries.',
      tech: 'Engineered entirely in raw HTML5 Canvas 2D, avoiding bulky external dependencies to guarantee zero frame stutter and instantaneous load times across all mobile and desktop devices.',
      developmentNotes: 'Created with a focus on razor-sharp responsive feel, ensuring every death feels fair and every near-miss delivers an exhilarating surge of triumph.',
    },
    tutorial: {
      headline: 'How to Play Gravity Switch: Timing, Combos & Survival Strategy',
      quickStart: [
        { step: '1', title: 'Tap to Invert Gravity', desc: 'Press Space or tap the screen to flip from the floor to the ceiling, and tap again to flip back down.' },
        { step: '2', title: 'Read Obstacles Ahead', desc: 'Don’t look at your cube—keep your eyes focused on the right third of the screen to anticipate approaching spikes.' },
        { step: '3', title: 'Chain Energy Orbs', desc: 'Collect glowing orbs on both ceiling and floor surfaces to build and sustain your combo multiplier.' },
        { step: '4', title: 'Survive Speed Transitions', desc: 'As speed ramps up, flip earlier than instinct suggests to compensate for forward momentum.' },
      ],
      controls: [
        { key: 'Spacebar / Left Click / Tap', action: 'Invert Gravity Polarity', device: 'Keyboard / Mouse / Touch', tip: 'Short, clean taps give the best rhythm' },
        { key: 'P / Esc', action: 'Pause / Resume Run', device: 'Keyboard', tip: 'Take a breather during high-speed marathon runs' },
      ],
      scoring: 'Score increases with distance traveled multiplied by your active orb streak counter. A single missed orb resets the combo multiplier.',
      proTips: [
        'Micro-flips: You can flip gravity before landing on the opposite surface to hover between double-hazard corridors.',
        'Rhythm over reaction: Patterns repeat in musical cadences—treat difficult obstacle clusters like a rhythm track.',
        'Center-line focus: Keep your eye on the middle horizon line so both ceiling and floor hazards enter your peripheral vision equally.',
      ],
      mistakes: [
        { mistake: 'Waiting until the last millisecond to flip', fix: 'Flip half a cube length earlier; momentum carries your hitbox forward during vertical travel.' },
        { mistake: 'Panic flipping in tight spaces', fix: 'Stick to the ceiling or floor until an actual obstacle forces an inversion.' },
      ],
    },
    support: {
      headline: 'Gravity Switch FAQs & Troubleshooting',
      faqs: [
        { q: 'Why did my flip fail to trigger on mobile?', a: 'Ensure you are tapping with one finger inside the game area. Avoid double-tap zoom gestures by tapping with light, distinct touches.' },
        { q: 'Is my high score saved across sessions?', a: 'Yes. Your all-time personal best score and run statistics are stored in your browser’s LocalStorage.' },
        { q: 'How can I fix micro-stuttering on 60Hz displays?', a: 'Close background streaming video tabs and make sure browser hardware acceleration is turned on.' },
      ],
      troubleshooting: [
        { issue: 'Key press feels delayed', fix: 'Ensure browser zoom is set to 100% and disconnect high-latency Bluetooth keyboards in favor of wired or internal keyboards.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Gravity Switch',
      sections: [
        { title: '1. Entertainment License', content: 'Gravity Switch is licensed for personal browser entertainment on Playzy. Reproduction or unauthorized embedding is prohibited.' },
        { title: '2. Leaderboard Fair Play', content: 'Scores submitted to daily missions must originate from genuine manual gameplay without bot automation.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Gravity Switch',
      sections: [
        { title: '1. Zero Personal Data', content: 'Gravity Switch collects no personal information, accounts, or emails.' },
        { title: '2. Local Data Usage', content: 'High scores, total attempts, and sound mute settings are saved solely on your local device.' },
      ],
    },
  },

  'hextris': {
    whatIs: {
      headline: 'Fast Hexagonal Match-3 Arcade Stacker',
      summary: 'Hextris Stack is an addictive, fast-paced puzzle arcade game that reimagines falling-block mechanics around a 360-degree rotating hexagonal core. Multi-colored polyomino bars cascade from the edges of the screen toward the central hexagon. Spin the hexagon left or right to catch the incoming bars, grouping three or more matching colors together to clear them and prevent the stack from overflowing past the gray boundary perimeter.',
      coreFeatures: [
        { title: '360° Hexagonal Rotation', desc: 'Spin the central hub seamlessly to distribute blocks across all six faces.' },
        { title: 'Cascading Match-3 Clears', desc: 'Connecting three matching blocks clears the cluster and drops outer blocks inward for automatic combos.' },
        { title: 'Fast-Drop Multiplier', desc: 'Hold down arrow to accelerate falling blocks and maintain high-scoring combo streaks.' },
        { title: 'Increasing Rotation Velocity', desc: 'Blocks fall faster and in denser clusters as your level and score escalate.' },
      ],
      specs: {
        category: 'Puzzle / Hexagonal Arcade',
        engine: 'HTML5 Canvas 2D',
        input: 'Arrow Keys, A/D, Touch Screen Buttons',
        platform: 'Desktop & Mobile Web',
        audio: 'Retro Synth Pops & Chimes',
        saveState: 'Local High Score & Level Record',
      },
      whyPlay: [
        'Engages multi-directional spatial reasoning unlike traditional flat puzzle grids.',
        'Delightful visual feedback with colorful particle bursts upon every match-3 clear.',
        'Runs flawlessly in any browser without battery drain or lag.',
      ],
    },
    about: {
      headline: 'The Geometry of Circular Tile Matching',
      lore: 'Step into the radiant core of the geometric nexus where energetic crystalline shards gravitate toward a harmonic central prism. Only rapid rotational alignment can stabilize the prism before critical mass overload.',
      mechanics: 'Incoming blocks approach along one of six radial axes. When a block lands, it snaps to the outermost layer of that hexagon face. If three or more adjacent blocks share an identical color swatch, they collapse, causing all remaining blocks on that face to fall toward the core.',
      tech: 'Rendered using mathematical polar-to-Cartesian coordinate projections on an HTML5 2D Canvas context, maintaining ultra-smooth 60 FPS vector line rendering.',
      developmentNotes: 'Inspired by the open-source puzzle classic, Hextris Stack on Playzy adds refined particle juice, improved touch rotation controls, and dynamic combo timers.',
    },
    tutorial: {
      headline: 'How to Master Hextris Stack: Rotation Tactics & Combo Chains',
      quickStart: [
        { step: '1', title: 'Spin the Hexagon', desc: 'Use Left and Right arrow keys or tap screen sides to rotate the core so the incoming bar lands on a matching color.' },
        { step: '2', title: 'Form Triads', desc: 'Align at least three blocks of the same color consecutively on one face or across adjacent faces to trigger a clear.' },
        { step: '3', title: 'Balance All Six Sides', desc: 'Keep the stack height uniform around the perimeter; letting one side grow unchecked leads to a quick game over.' },
        { step: '4', title: 'Fast-Drop for Combos', desc: 'Press Down Arrow when you have a guaranteed match to drop the block instantly and extend your combo window.' },
      ],
      controls: [
        { key: 'Left / Right Arrow (or A / D)', action: 'Rotate Hexagon 60° counter-clockwise / clockwise', device: 'Keyboard', tip: 'Tap lightly for single-face rotations' },
        { key: 'Down Arrow / S', action: 'Fast Drop incoming block', device: 'Keyboard', tip: 'Saves valuable seconds and multiplies score' },
        { key: 'Touch Left / Right screen half', action: 'Rotate core on mobile devices', device: 'Touchscreen', tip: 'Thumb tapping provides quick, ergonomic rotation' },
      ],
      scoring: 'Clearing 3 blocks awards base points multiplied by active combo level. Clearing 4 or 5 blocks in a single cascade awards massive bonus points.',
      proTips: [
        'Rotate toward danger: When in doubt, rotate your tallest face toward the incoming block only if it creates an instant clear.',
        'Color clustering: Dedicate two opposite faces to primary colors (e.g., Red on north, Blue on south) to simplify split-second decisions.',
        'Chain reactions: Setting up double tiers allows collapsing outer blocks to clear secondary matches automatically.',
      ],
      mistakes: [
        { mistake: 'Focusing entirely on one face', fix: 'Constantly scan all 6 sides; an overlooked tower will hit the outer perimeter without warning.' },
      ],
    },
    support: {
      headline: 'Hextris Stack Support & FAQs',
      faqs: [
        { q: 'Why did the game end even though only one side was full?', a: 'In Hextris, if any single side’s block stack extends past the outer gray hexagon boundary, the game ends immediately.' },
        { q: 'Can I play with touch controls on my phone?', a: 'Yes! Tapping the left half of your mobile screen rotates counter-clockwise; tapping the right half rotates clockwise.' },
        { q: 'Where are my high scores saved?', a: 'High scores are preserved in your browser’s LocalStorage under your active profile.' },
      ],
      troubleshooting: [
        { issue: 'Rotation responds twice on a single key tap', fix: 'Check your operating system key repeat settings or release the key swiftly rather than holding it down.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Hextris Stack',
      sections: [
        { title: '1. Personal Use', content: 'Hextris Stack is provided free for individual entertainment on Playzy.' },
        { title: '2. Fair Scoring', content: 'Players may not use memory injection tools to manipulate game scores or level states.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Hextris Stack',
      sections: [
        { title: '1. Data Collection', content: 'Hextris Stack collects zero personal information, tracking cookies, or contact data.' },
        { title: '2. Local Storage', content: 'Only your best score and sound toggle preferences are saved in your local browser cache.' },
      ],
    },
  },

  'color-switch': {
    whatIs: {
      headline: 'Neon Chromatic Rhythm & Obstacle Precision Arcade',
      summary: 'Color Switch is the legendary arcade sensation rebuilt with sleek neon aesthetics and responsive physics. Tap rhythmically to bounce your chromatic sphere upward through spinning color rings, rotating geometric crosses, and sliding bars. You can only pass through barrier segments that match the exact color of your ball. Grabbing kaleidoscopic color-swap orbs mid-ascent shifts your color instantaneously, keeping your reflexes and focus razor-sharp.',
      coreFeatures: [
        { title: 'Challenging Color-Matching Gates', desc: 'Bounce through rotating neon rings, squares, and crosses that only yield to matching hues.' },
        { title: 'Dynamic Mid-Air Color Shifters', desc: 'Passing through swirling kaleidoscopic orbs randomly transforms your sphere into a new color.' },
        { title: 'Physics Gravity & Tap Rhythm', desc: 'Precise gravity damping requires calculated taps to maintain perfect hover heights inside obstacles.' },
        { title: 'Star Collectibles & Modes', desc: 'Gather shiny stars inside hazardous obstacle centers to boost your score and unlock bonus game styles.' },
      ],
      specs: {
        category: 'Arcade / Precision Rhythm',
        engine: 'Phaser 3 Engine',
        input: 'Spacebar, Left Click, Tap',
        platform: 'Desktop & Mobile Web',
        audio: 'Electronic Bounce & Chime Foley',
        saveState: 'Local High Score & Star Tracker',
      },
      whyPlay: [
        'Intense, addictive gameplay loop where focus and timing are rewarded instantly.',
        'High-contrast neon visuals on dark backgrounds minimize eye strain during long sessions.',
        'Smooth 60 FPS physics powered by the Phaser 3 arcade engine.',
      ],
    },
    about: {
      headline: 'The Rhythm of Color and Gravity in Harmony',
      lore: 'Within the neon spectrum dimension, light frequencies determine whether matter can pass through barriers or shatter on contact. As a radiant photon sphere, your journey upward is a continuous dance of chromatic harmony.',
      mechanics: 'The Phaser 3 physics engine applies realistic gravity to your sphere with upward impulse bursts upon each tap. Color collision masks evaluate the hue of the sphere against the specific polygon segment of the obstacle upon contact.',
      tech: 'Built with Phaser 3 using WebGL hardware acceleration, procedural geometric rendering, and particle burst emitters for smooth visual flair.',
      developmentNotes: 'Optimized on Playzy to eliminate the touch latency found in old mobile web wrappers, giving desktop and mobile players instant response.',
    },
    tutorial: {
      headline: 'Color Switch Strategy Guide: Tapping Rhythm & Patience',
      quickStart: [
        { step: '1', title: 'Tap to Elevate', desc: 'Press Spacebar or tap the screen to bounce your ball upward against gravity.' },
        { step: '2', title: 'Inspect the Approaching Barrier', desc: 'Check the color of your ball and locate the matching colored quadrant on the spinning ring ahead.' },
        { step: '3', title: 'Hover Inside Obstacles', desc: 'Once inside a spinning ring, maintain a gentle hovering tap rhythm while waiting for the exit gap to align.' },
        { step: '4', title: 'Prepare for Color Swaps', desc: 'Passing through a multi-colored orb changes your ball instantly. Check your new color before advancing!' },
      ],
      controls: [
        { key: 'Spacebar / Tap / Click', action: 'Bounce ball upward with a physics impulse', device: 'Keyboard / Mouse / Touch', tip: 'Short, controlled taps are safer than frantic button mashing' },
        { key: 'P / Esc', action: 'Pause / Resume', device: 'Keyboard', tip: 'Pauses obstacle rotation and freezes ball momentum' },
      ],
      scoring: 'Score equals the number of obstacle rings successfully cleared plus bonus points for every star gathered inside the core.',
      proTips: [
        'Patience beats speed: There is no penalty for hovering inside an obstacle ring for multiple rotations until the safest exit appears.',
        'Watch the color orb: Anticipate the color swap right above each obstacle so you don’t crash into the next ring’s mismatched entry segment.',
        'Rhythmic cadence: Tap like a heartbeat—regular, metered taps keep your ball hovering at a consistent altitude.',
      ],
      mistakes: [
        { mistake: 'Double-tapping in a panic', fix: 'A double tap will rocket your ball into the top ceiling of the obstacle; stay calm and tap smoothly.' },
      ],
    },
    support: {
      headline: 'Color Switch FAQs & Device Support',
      faqs: [
        { q: 'Why did my ball burst on entry?', a: 'Your ball made contact with a segment of the obstacle whose color did not match your sphere. Only identical colors can pass safely.' },
        { q: 'Can I play this comfortably on mobile?', a: 'Yes! Color Switch is designed for seamless one-finger portrait and landscape touch play on iOS and Android browsers.' },
      ],
      troubleshooting: [
        { issue: 'Spacebar scrolls page down instead of bouncing', fix: 'Playzy includes an automatic space-scroll guard; if it occurs, click once inside the game frame to refocus the viewport.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Color Switch',
      sections: [
        { title: '1. Usage Rights', content: 'Color Switch is made available for free personal browser gaming via Playzy.' },
        { title: '2. Fair Competition', content: 'Leaderboard stars and milestone records must be achieved without external memory manipulation.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Color Switch',
      sections: [
        { title: '1. No PII Collection', content: 'No personal identification information is gathered or stored by this game.' },
        { title: '2. Local Settings', content: 'Only your best height, stars collected, and audio preferences are retained locally in browser storage.' },
      ],
    },
  },

  'tower-stacker': {
    whatIs: {
      headline: 'Precision Cantilever Slab Stacking Arcade',
      summary: 'Tower Stacker is an elegant, high-stakes game of timing, geometry, and spatial precision. Sliding block slabs glide back and forth over a rising skyscraper tower. Tap with millisecond accuracy to drop each floor directly on top of the base. Any portion of the block that overhangs the edge is cleanly sliced off and falls away, shrinking the target area for your next floor. Chain three perfect center drops in a row to expand your slab width back out!',
      coreFeatures: [
        { title: 'Surgical Physics Trimming', desc: 'Overhanging block mass is dynamically sliced off with realistic falling physics debris.' },
        { title: 'Streak-Based Slab Expansion', desc: 'Land consecutive perfect drops to trigger chime chords and restore lost slab width.' },
        { title: 'Dynamic Altitude Atmosphere', desc: 'Watch the sky gradient transition from sunrise pastel to starry outer space as your tower pierces the clouds.' },
        { title: 'High-Altitude Wind Wobble', desc: 'Beyond floor 18, crosswinds gently oscillate the sliding block for increased challenge.' },
      ],
      specs: {
        category: 'Arcade / Precision Stacking',
        engine: 'Phaser 3 Engine',
        input: 'Click, Spacebar, Tap',
        platform: 'Desktop & Mobile Web',
        audio: 'Harmonic Piano Scale Chimes',
        saveState: 'Local High Floor Record',
      },
      whyPlay: [
        'Satisfying musical feedback: Perfect placements play ascending musical notes on a harmonic scale.',
        'Visual zen: Soothing color palettes and clean isometric block geometry.',
        'High skill ceiling: Rewards calm nerves, steady rhythm, and sharp spatial awareness.',
      ],
    },
    about: {
      headline: 'The Zen of Architectural Balance and Precision',
      lore: 'In the City of Spires, architects compete to touch the stratosphere using single-slab cantilever construction. Every floor must be dropped true to the plumb line, or the tower narrows into oblivion.',
      mechanics: 'The Phaser 3 engine tracks horizontal coordinate deltas between the sliding slab and top platform. If the delta is within tolerance (under 3 pixels), a "Perfect!" drop is registered. Otherwise, the mesh is sliced into a surviving platform and a falling ragdoll scrap.',
      tech: 'Engineered with Phaser 3 using isometric projection matrices, smooth easing transitions, and harmonic Web Audio synthesizer nodes.',
      developmentNotes: 'Created to provide a tranquil yet thrilling skill game that runs instantly on any device with zero lag.',
    },
    tutorial: {
      headline: 'Tower Stacker Masterclass: Timing, Guides & Perfect Streaks',
      quickStart: [
        { step: '1', title: 'Watch the Sliding Rhythm', desc: 'Observe the speed and oscillating trajectory of the sliding slab as it passes over your base tower.' },
        { step: '2', title: 'Time the Drop', desc: 'Tap Space or click when the slab is dead center above the existing floor.' },
        { step: '3', title: 'Chain Perfect Drops', desc: 'Hitting three perfect center drops in a row rewards you with a chiming chord and widens your next block.' },
        { step: '4', title: 'Compensate for Wind', desc: 'Past floor 18, watch for slight wind gusts that subtly speed up or slow down the block.' },
      ],
      controls: [
        { key: 'Spacebar / Click / Tap', action: 'Drop the sliding block floor', device: 'Keyboard / Mouse / Touch', tip: 'Focus on the leading edge of the base block to anticipate the drop window' },
      ],
      scoring: 'Score equals the total number of floors stacked. Perfect drops award compounding bonus points.',
      proTips: [
        'Use dashed guides: Notice the faint alignment markers that indicate the exact center drop window.',
        'Don’t rush: The sliding slab will oscillate back and forth indefinitely; take an extra pass if your timing feels off.',
        'Listen to the pitch: The musical chime rises in pitch with every perfect drop, providing audio cues for rhythm.',
      ],
      mistakes: [
        { mistake: 'Dropping while panicking', fix: 'If you miss the center alignment, let the slab travel to the opposite edge and catch it on the rebound.' },
      ],
    },
    support: {
      headline: 'Tower Stacker Support & FAQs',
      faqs: [
        { q: 'Why did my block get so small so quickly?', a: 'Every time a drop overhangs, the excess width is chopped off permanently until you chain three perfect center drops.' },
        { q: 'Is there an end floor to the tower?', a: 'Tower Stacker is endless—the only limit is how high your precision can climb into the stars!' },
      ],
      troubleshooting: [
        { issue: 'Click registered twice', fix: 'Ensure you are tapping or clicking cleanly once without dragging across the canvas.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Tower Stacker',
      sections: [
        { title: '1. Service Scope', content: 'Tower Stacker is provided free for personal browser enjoyment on Playzy.' },
        { title: '2. Integrity of Scores', content: 'Manipulating floor heights via memory modification or scripted auto-clickers is prohibited.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Tower Stacker',
      sections: [
        { title: '1. Zero Tracking', content: 'No personal data or cookies are gathered by Tower Stacker.' },
        { title: '2. Local Storage', content: 'Your highest floor reached and total towers built are saved locally on your device.' },
      ],
    },
  },

  'neon-snake': {
    whatIs: {
      headline: 'Synthwave Cyber Classic with Portals, Powers & Multipliers',
      summary: 'Neon Snake is a high-octane reimagining of the all-time arcade classic draped in glowing 1980s synthwave aesthetics. Slither through a radiant cyber grid devouring luminous neon energy berries. Chain rapid bites to send your combo multiplier climbing, warp across perimeter grid portals to escape deadly dead-ends, and unleash five game-changing power-ups including Ghost Mode, Speed Dash, Magnetism, Freeze, and Golden Berries.',
      coreFeatures: [
        { title: '5 Game-Changing Cyber Power-Ups', desc: 'Activate Ghost mode to pass through your own tail, Magnet to vacuum berries, and Freeze to slow down time.' },
        { title: 'Perimeter Warp Portals', desc: 'Slither through the edge of the arena to instantly emerge on the opposite boundary.' },
        { title: 'Combo Multiplier Chain', desc: 'Eat berries in rapid succession before the decay meter empties to multiply your score up to 10x.' },
        { title: 'Speed Dash Mechanic', desc: 'Expend a single body segment to trigger an emergency burst of speed to snatch disappearing berries.' },
      ],
      specs: {
        category: 'Arcade / Cyber Classic',
        engine: 'HTML5 Canvas 2D',
        input: 'Arrow Keys, WASD, Swipe Gestures',
        platform: 'Desktop & Mobile Web',
        audio: 'Synthwave Bassline & Cyber Chimes',
        saveState: 'Local High Score & Longest Snake',
      },
      whyPlay: [
        'A fresh, modern twist on a beloved formula that keeps both casual players and hardcore snake veterans engaged.',
        'Gorgeous glowing neon visuals with dynamic scanlines and particle trails.',
        'Immediate, razor-sharp keyboard response with zero input latency.',
      ],
    },
    about: {
      headline: 'Cybernetic Evolution of the Grid Serpent',
      lore: 'Within the deep memory banks of the mainframe, an autonomous data serpent feeds on stray energy packets, expanding in length with every cycle while evading catastrophic logic crashes against its own trailing code.',
      mechanics: 'The grid updates at a variable tick frequency. Consuming berries lengthens the snake array by appending segment nodes. Power-ups alter collision rules—Ghost mode temporarily disables self-intersect checks, while Dash doubles step velocity for a fixed tick duration.',
      tech: 'Rendered using HTML5 Canvas 2D with shadowBlur glow filters, vector scanline overlays, and responsive touch swipe listeners.',
      developmentNotes: 'Created to prove that classic arcade staples can be modernized with deep mechanics and breathtaking retro-futuristic style.',
    },
    tutorial: {
      headline: 'Neon Snake Tactics: Coiling, Portals & Multiplier Maximization',
      quickStart: [
        { step: '1', title: 'Steer the Serpent', desc: 'Use Arrow keys or WASD to navigate toward glowing energy berries.' },
        { step: '2', title: 'Chain Rapid Bites', desc: 'Consume berries before the top combo bar drains to stack your score multiplier from 2x up to 10x.' },
        { step: '3', title: 'Collect Power-Ups', desc: 'Snatch glowing icons: Blue (Freeze time), Purple (Ghost phase), Yellow (Gold 45-point berry).' },
        { step: '4', title: 'Master the Perimeter Portals', desc: 'Don’t fear the arena edges—passing through any wall instantly warps you to the opposite side.' },
      ],
      controls: [
        { key: 'Arrow Keys / WASD', action: 'Steer snake Up, Down, Left, Right', device: 'Keyboard', tip: 'Buffer your next turn slightly ahead of the grid intersection' },
        { key: 'Shift', action: 'Speed Dash (Costs 1 body segment)', device: 'Keyboard', tip: 'Use only to reach expiring plasma berries in time' },
        { key: 'Touch Swipe', action: 'Steer on touch screens', device: 'Touchscreen', tip: 'Flick firmly in the intended direction' },
      ],
      scoring: 'Score increases with berry value multiplied by active combo tier. Gold berries award 45 base points; Plasma berries grant speed and bonus multipliers.',
      proTips: [
        'The outer perimeter coil: When your snake grows beyond 50 segments, wrap along the outer wall in a spiral pattern to conserve interior space.',
        'Ghost mode escape: If you trap yourself in a dead end, pop a Ghost power-up to glide straight through your own body unharmed.',
        'Warp shortcuts: Instead of turning 180 degrees through the crowded center, dive into the nearest wall portal to emerge safely on the far side.',
      ],
      mistakes: [
        { mistake: 'Reversing directly into your neck', fix: 'The game prevents instant 180-degree self-collisions, but rapid double-tapping can still cause accidents. Plan turns one grid ahead.' },
      ],
    },
    support: {
      headline: 'Neon Snake FAQs & Input Configuration',
      faqs: [
        { q: 'Can I turn off the scanline CRT effect?', a: 'Yes, toggle the visual settings icon on the HUD to switch between retro glow and clean flat graphics.' },
        { q: 'Why did my snake shrink?', a: 'Using the Shift key for an emergency Speed Dash consumes one body segment as fuel for the turbo burst.' },
      ],
      troubleshooting: [
        { issue: 'Snake turned in unexpected direction', fix: 'Make sure arrow keys are pressed one at a time without holding two keys simultaneously.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Neon Snake',
      sections: [
        { title: '1. Permitted Use', content: 'Neon Snake is free for browser gameplay on Playzy.' },
        { title: '2. Leaderboard Rules', content: 'Automated script bots and memory hacking tools are strictly forbidden.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Neon Snake',
      sections: [
        { title: '1. Data Privacy', content: 'Neon Snake collects no personal identity information or telemetry.' },
        { title: '2. Local Storage', content: 'High scores and longest snake length records are stored only on your local browser.' },
      ],
    },
  },

  'block-merge': {
    whatIs: {
      headline: 'Strategic Sliding 2048 with Rescue Tools & Multipliers',
      summary: 'Block Merge is a hyper-polished evolution of the beloved sliding tile puzzle. Slide numbered wooden and metallic tiles across a 4x4 board; when two tiles with the same number collide, they combine into their mathematical double (2+2=4, 4+4=8... 1024+1024=2048!). Unlike traditional implementations, Block Merge features a dynamic Chain Multiplier for consecutive merges, Golden Multiplier Tiles, and three clutch Rescue Tools (Undo, Hammer, and Board Shuffle) that give you tactical options when the grid tightens.',
      coreFeatures: [
        { title: 'Three Tactical Rescue Tools', desc: 'Deploy Hammer to shatter blocker tiles, Shuffle to redistribute the grid, and Undo to reverse accidental missteps.' },
        { title: 'Consecutive Merge Multiplier', desc: 'Merging tiles on back-to-back slides builds a score multiplier that supercharges your points.' },
        { title: 'Milestone Tool Drops', desc: 'Reaching milestone tiles like 128, 256, 512, and 1024 rewards bonus tools to extend your run.' },
        { title: 'Crisp Fluid Animations', desc: 'Satisfying magnetic snapping, tactile sound effects, and clean modern tile styling.' },
      ],
      specs: {
        category: 'Puzzle / Sliding Number Strategy',
        engine: 'HTML5 DOM & Canvas Hybrid',
        input: 'Arrow Keys, WASD, Touch Swipes',
        platform: 'Desktop & Mobile Web',
        audio: 'Wood Block Clacks & Brass Chimes',
        saveState: 'Local High Score & Active Board Save',
      },
      whyPlay: [
        'Rescue tools eliminate frustrating RNG deaths when you’re on the verge of creating 2048 or 4096.',
        'Continuous board saving lets you pause, close your tab, and return later without losing progress.',
        'Deep mental workout combining foresight, probability management, and spatial planning.',
      ],
    },
    about: {
      headline: 'The Mathematics of Order and Spatial Optimization',
      lore: 'On an ancient 4x4 computational matrix, numeric energy cores merge under gravitational compression. Mastering the mathematical progression from modest units to monumental power nodes is the mark of a master tactician.',
      mechanics: 'Sliding pushes all movable tiles in the chosen cardinal direction until obstructed by a wall or another tile. Consecutive merges increment a streak counter that scales score output. The 3 rescue tools grant non-sliding modifications to the board state.',
      tech: 'Built with optimized DOM transforms and CSS GPU acceleration to deliver buttery smooth 60 FPS sliding animations with zero layout thrashing.',
      developmentNotes: 'Designed to elevate the classic 2048 experience by rewarding strategic planning rather than leaving high scores up to pure luck.',
    },
    tutorial: {
      headline: 'Block Merge Strategy Guide: Corner Anchoring & Tool Management',
      quickStart: [
        { step: '1', title: 'Choose an Anchor Corner', desc: 'Designate one corner (e.g., bottom-right) as the permanent home for your highest-value tile.' },
        { step: '2', title: 'Slide in Two Primary Directions', desc: 'Favor Down and Right slides to keep small numbers feeding orderly into your giant corner tile.' },
        { step: '3', title: 'Build Descending Number Chains', desc: 'Arrange tiles in descending order (e.g., 512 → 256 → 128 → 64) along the bottom row for seamless domino merges.' },
        { step: '4', title: 'Deploy Rescue Tools Strategically', desc: 'Save the Hammer for low-value tiles (2s or 4s) trapped behind big numbers in critical rows.' },
      ],
      controls: [
        { key: 'Arrow Keys / WASD', action: 'Slide all tiles Up, Down, Left, Right', device: 'Keyboard', tip: 'Never press the direction opposite your anchor corner unless absolutely forced' },
        { key: 'Z', action: 'Undo last move', device: 'Keyboard', tip: 'Corrects split-second finger slips' },
        { key: 'H', action: 'Hammer (Shatter one chosen tile)', device: 'Keyboard', tip: 'Eliminates annoying low tiles trapped in corner chains' },
        { key: 'F', action: 'Shuffle (Randomize all board positions)', device: 'Keyboard', tip: 'A lifeline when no valid slides remain' },
      ],
      scoring: 'Merging tiles awards the value of the newly created block multiplied by your active streak multiplier.',
      proTips: [
        'Never press Up: If your corner is bottom-right, pressing Up dislodges your highest tile and allows a rogue "2" to spawn behind it, ruining your setup.',
        'Keep the bottom row full: Always ensure all 4 slots of your anchor row are occupied before sliding horizontally, preventing your king tile from sliding out of the corner.',
        'Earn tools through milestones: Reaching 256 and 512 grants extra Undos and Hammers—use them proactively to sustain long runs.',
      ],
      mistakes: [
        { mistake: 'Sliding randomly in all four directions', fix: 'Pick two dominant directions (e.g. Down and Right) and only use a third (Left) when unavoidable.' },
      ],
    },
    support: {
      headline: 'Block Merge FAQs & Save State Information',
      faqs: [
        { q: 'Does my game save if I close my browser window?', a: 'Yes! Block Merge automatically writes your current board configuration and tool counts to LocalStorage so you can resume anytime.' },
        { q: 'How do I earn more Hammer and Undo tools?', a: 'You unlock additional rescue tools by reaching higher milestone tiles (128, 256, 512, 1024, 2048).' },
      ],
      troubleshooting: [
        { issue: 'Board did not save after private window closed', fix: 'Incognito/Private browsing windows erase LocalStorage upon closing; play in a standard browser window to retain saves.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Block Merge',
      sections: [
        { title: '1. Personal Entertainment', content: 'Block Merge is provided free for individual entertainment on Playzy.' },
        { title: '2. Fair Scoring', content: 'Automated puzzle solvers or DOM manipulation to alter board values is prohibited.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Block Merge',
      sections: [
        { title: '1. No PII Stored', content: 'Block Merge collects zero personal information, user IDs, or cookies.' },
        { title: '2. Local Board State', content: 'Board matrices, high scores, and tool inventories reside exclusively in your browser’s LocalStorage.' },
      ],
    },
  },

  'turbo-drift': {
    whatIs: {
      headline: 'High-Speed Highway Drift Racer with Nitro & Near-Misses',
      summary: 'Turbo Drift is an exhilarating 3D endless highway driving experience that combines arcade handling with thrilling slip-angle drifting. Roar down a scenic coastal superhighway behind the wheel of a twin-turbo sports car. Grip diminishes as you accelerate, turning aggressive high-speed cornering into high-scoring power slides. Thread the needle between dense civilian commuter traffic to bank Near-Miss bonuses and charge your nitro booster for blistering straightaway sprints.',
      coreFeatures: [
        { title: 'Dynamic Slip-Angle Physics', desc: 'Realistic tire slip angles reward smooth counter-steering into controlled power drifts.' },
        { title: 'High-Risk Near-Miss Rewards', desc: 'Skim dangerously close to civilian sedans, trucks, and buses to charge nitro and earn multiplier cash.' },
        { title: 'Twin-Turbo Nitrous Boost', desc: 'Discharge stored nitro to warp forward at blinding speeds and shatter distance records.' },
        { title: '3D Procedural Traffic AI', desc: 'Commuter traffic changes lanes realistically, requiring constant vigilance and forward anticipation.' },
      ],
      specs: {
        category: 'Racing / Highway Drift Arcade',
        engine: 'Three.js / WebGL 3D',
        input: 'Arrow Keys, A/D, Spacebar, Touch Drag',
        platform: 'Desktop & Mobile Web',
        audio: 'Turbo Spool, Tire Screech & Exhaust Pops',
        saveState: 'Local High Score & Distance Record',
      },
      whyPlay: [
        'Delivers genuine high-speed driving thrills directly in your browser without 80GB downloads.',
        'Dynamic camera shake, motion blur, and screen-space tire smoke particles immerse you in the cockpit.',
        'Responsive controls that feel rewarding whether playing with keyboard, mouse, or touch.',
      ],
    },
    about: {
      headline: 'The Art of Highway Drifting at Terminal Velocity',
      lore: 'On the Suncoast Expressway, underground street racers take to the highway at twilight. Only drivers who can maintain sideways slip angles through dense commuter traffic earn the title of Drift King.',
      mechanics: 'Vehicle steering computes lateral velocity and tire friction coefficients. Steering hard while traveling above 100 km/h breaks rear traction into a drift state, accumulating points as long as the slide is held and safely banked upon straight recovery.',
      tech: 'Built with Three.js WebGL rendering, instanced highway segment meshes, dynamic lighting, shadow maps, and particle trails for tire burnouts.',
      developmentNotes: 'Created to capture the spirit of retro highway racing games like OutRun and Ridge Racer with modern 60 FPS WebGL performance.',
    },
    tutorial: {
      headline: 'Turbo Drift Driver’s Guide: Counter-Steering, Nitro & Traffic Weaving',
      quickStart: [
        { step: '1', title: 'Accelerate up to Speed', desc: 'Your car automatically builds forward speed; use Left and Right arrows to switch lanes and weave.' },
        { step: '2', title: 'Initiate a High-Speed Drift', desc: 'Steer firmly into a turn at high speed to break traction and begin banking drift points.' },
        { step: '3', title: 'Straighten Out to Bank Points', desc: 'Release steering and counter-steer gently to straighten the car and lock in your accumulated drift score.' },
        { step: '4', title: 'Discharge Nitro on Open Lanes', desc: 'Tap Spacebar to ignite twin-turbo nitrous for an intense burst of acceleration past heavy traffic.' },
      ],
      controls: [
        { key: 'Left / Right Arrow (or A / D)', action: 'Steer left / right into lanes and drifts', device: 'Keyboard', tip: 'Feather the keys rather than holding them down continuously' },
        { key: 'Spacebar', action: 'Fire Nitro Boost', device: 'Keyboard', tip: 'Only activate nitro when you have a clear sightline ahead' },
        { key: 'Touch Drag', action: 'Steer horizontally on mobile', device: 'Touchscreen', tip: 'Drag smoothly across the lower screen quadrant' },
      ],
      scoring: 'Score is determined by distance traveled, length of continuous banked drifts, and near-miss pass multipliers.',
      proTips: [
        'Bank before crashing: Unbanked drift points are lost if you collide with traffic; straighten out early to lock in your score.',
        'Near-miss chaining: Passing between two trucks in adjacent lanes triggers a double Near-Miss bonus that fills your nitro meter instantly.',
        'Watch brake lights: Commuter vehicles ahead will tap their red brake lights before changing lanes—read their signals!',
      ],
      mistakes: [
        { mistake: 'Holding nitro into heavy traffic', fix: 'Nitro does not make you invincible; you will still crash if you hit a civilian vehicle.' },
      ],
    },
    support: {
      headline: 'Turbo Drift FAQs & Performance Advice',
      faqs: [
        { q: 'How do I bank my drift points?', a: 'Simply release the steering key or counter-steer slightly to straighten the car out; your banked points will flash gold on screen.' },
        { q: 'Can I change my vehicle camera view?', a: 'Yes, tap the camera icon on the top right to switch between close chase, far chase, and bumper cams.' },
      ],
      troubleshooting: [
        { issue: 'Car feels too sensitive to keyboard taps', fix: 'Use light, rapid taps rather than holding keys down for smoother lane changes.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Turbo Drift',
      sections: [
        { title: '1. Entertainment License', content: 'Turbo Drift is licensed for free browser entertainment on Playzy.' },
        { title: '2. Prohibited Conduct', content: 'Automating inputs or hacking score values via external scripts is prohibited.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Turbo Drift',
      sections: [
        { title: '1. No Data Harvesting', content: 'Turbo Drift collects no personal information or persistent device IDs.' },
        { title: '2. Local Records', content: 'Distance records, high scores, and audio settings are kept strictly in LocalStorage.' },
      ],
    },
  },

  'monsoon-rickshaw-rush': {
    whatIs: {
      headline: 'Action Open-World Rickshaw Taxi Driving in Rainy Mumbai',
      summary: 'Monsoon Rickshaw Rush puts you behind the handlebars of an iconic black-and-yellow auto-rickshaw navigating the rain-soaked, neon-lit streets of Mumbai during the monsoon. Pick up stranded commuters, navigate bustling intersections, dodge puddle hydroplaning, weave past double-decker buses, and race against the ticking shift clock to deliver passengers safely to their destinations. Earn fare cash to upgrade your rickshaw’s nitro, suspension, and horn in the garage!',
      coreFeatures: [
        { title: 'Open-World Mumbai Streets', desc: 'Explore detailed city blocks featuring colonial architecture, Marine Drive promenades, and bustling bazaars.' },
        { title: 'Dynamic Monsoon Weather', desc: 'Torrential downpours, slick wet road reflections, and puddle splashes that test your traction.' },
        { title: 'Fare Pick-Up & Drop-Off System', desc: 'Follow GPS minimap waypoints to collect passengers, navigate traffic, and deliver them on time.' },
        { title: 'Custom Garage Upgrades', desc: 'Tune your rickshaw’s acceleration, top speed, wet braking grip, and install custom musical horns.' },
      ],
      specs: {
        category: 'Racing / Open-World Driving',
        engine: 'Three.js / WebGL 3D',
        input: 'WASD / Arrow Keys, Space, Shift, H',
        platform: 'Desktop & Mobile Web',
        audio: 'Mumbai Street Foley, Rain SFX & Auto Engine',
        saveState: 'Local Career Fares & Garage Upgrades',
      },
      whyPlay: [
        'A vibrant cultural setting rarely seen in racing games, bursting with personality and charm.',
        'Satisfying wet-weather vehicle physics that balance arcade drift fun with realistic hydroplane handling.',
        'Rich career progression: Upgrade your rickshaw from a sputtering runabout into a turbocharged city rocket.',
      ],
    },
    about: {
      headline: 'Navigating the Monsoon Torrent in Mumbai’s Three-Wheeled Icon',
      lore: 'When the annual monsoon clouds burst over the Arabian Sea, Mumbai transforms into a shimmering landscape of rain and reflection. As a fearless auto-rickshaw pilot, your trusty three-wheeler is the lifeline of the city, darting down narrow gullies where ordinary cars cannot fit.',
      mechanics: 'The three-wheeled physics simulation accurately models the unique single-front-wheel steering pivot and high center of gravity of an auto-rickshaw. Over-steering while cornering on wet asphalt breaks rear traction into a slide, while standing puddles cause momentary hydroplaning.',
      tech: 'Engineered in Three.js with custom wet-surface specular shaders, screen-space rain particle cascades, dynamic minimap radar, and atmospheric fog.',
      developmentNotes: 'Created by Dharmik Gohil with authentic Mumbai street soundscapes, regional taxi styling, and real-world landmark inspirations.',
    },
    tutorial: {
      headline: 'Rickshaw Driver’s Manual: Fares, Navigation, Drift & Upgrades',
      quickStart: [
        { step: '1', title: 'Locate Waiting Passengers', desc: 'Follow the yellow marker on your minimap radar to locate commuters waving for a ride.' },
        { step: '2', title: 'Stop in the Pick-Up Zone', desc: 'Brake inside the glowing circle until the passenger boards your rickshaw.' },
        { step: '3', title: 'Race to the Destination', desc: 'Follow the green navigation arrow to the destination before your passenger’s patience meter runs out.' },
        { step: '4', title: 'Visit the Garage to Upgrade', desc: 'Spend earned fare cash to upgrade your engine horsepower, tire wet grip, and nitro capacity.' },
      ],
      controls: [
        { key: 'W / Up Arrow', action: 'Accelerate forward', device: 'Keyboard', tip: 'Ease into throttle on wet roads' },
        { key: 'S / Down Arrow', action: 'Brake / Reverse', device: 'Keyboard', tip: 'Brake early before sharp street corners' },
        { key: 'A / D or Left / Right', action: 'Steer Handlebars', device: 'Keyboard', tip: 'Counter-steer if the rear wheels slide out' },
        { key: 'Spacebar', action: 'Handbrake', device: 'Keyboard', tip: 'Essential for tight 90-degree alley pivots' },
        { key: 'Left Shift', action: 'Nitro Boost', device: 'Keyboard', tip: 'Save nitro for long straightaways along Marine Drive' },
        { key: 'H', action: 'Sound Horn', device: 'Keyboard', tip: 'Startles pedestrians and encourages slow taxis to move aside' },
        { key: 'R', action: 'Reset Rickshaw', device: 'Keyboard', tip: 'Flips your rickshaw right-side up if you roll over' },
      ],
      scoring: 'Earnings equal base fare plus speed bonus for early delivery and tip bonus for clean driving without traffic collisions.',
      proTips: [
        'Watch for deep puddles: Hitting standing water at top speed causes hydroplaning—brake slightly before entering large puddles.',
        'Use the horn in traffic: Honking clears stubborn pedestrian crossings and prompts city buses to yield right-of-way.',
        'Invest in tire grip first: In the garage, upgrading wet-weather tire compound provides immediate lap time improvements.',
      ],
      mistakes: [
        { mistake: 'Speeding into tight turns', fix: 'Three-wheelers have a narrow front wheel track; brake in a straight line before entering tight corners to prevent tipping over.' },
      ],
    },
    support: {
      headline: 'Monsoon Rickshaw Rush Support & FAQs',
      faqs: [
        { q: 'How do I flip my rickshaw back over if I crash?', a: 'Press the R key (or tap the Reset icon on mobile) to instantly right your vehicle on the nearest road lane.' },
        { q: 'Are my garage upgrades saved across sessions?', a: 'Yes! All purchased upgrades, career fares, and unlocked horns are saved in your browser’s LocalStorage.' },
      ],
      troubleshooting: [
        { issue: 'Rain particle effects causing low FPS', fix: 'Lower your browser window resolution slightly or disable high-DPI scaling in browser flags.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Monsoon Rickshaw Rush',
      sections: [
        { title: '1. Service Grant', content: 'Monsoon Rickshaw Rush is provided as a free web experience on Playzy for personal non-commercial use.' },
        { title: '2. Prohibited Exploits', content: 'Altering fare economics or bypassing destination timers through memory injection is forbidden.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Monsoon Rickshaw Rush',
      sections: [
        { title: '1. Zero Personal Data', content: 'No personal identification, contact details, or location information is collected.' },
        { title: '2. Local Persistence', content: 'Player fare bankroll, rickshaw tuning parameters, and mission records reside entirely in LocalStorage.' },
      ],
    },
  },

  'ball-drop': {
    whatIs: {
      headline: 'Physics Plinko Arcade with Multiplier Pegs & Risk Dials',
      summary: 'Ball Drop is an engaging physics-driven pachinko and plinko game featuring tactile kinetic bounces, customizable risk profiles, and escalating multiplier cascades. Position the overhead ball dropper, release steel spheres into a dense forest of pegs, and watch erratic kinetic deflections guide your balls toward high-yield outer bins. Switch between Safe, Balanced, and Wild risk dials to trade predictable middle returns for monumental 50x and 100x edge jackpots!',
      coreFeatures: [
        { title: 'Realistic 2D Rigid Body Physics', desc: 'Simulated mass, restitution, friction, and angular spin create authentic pinball-style deflections.' },
        { title: 'Adjustable Risk Dials (Safe / Wild)', desc: 'Configure bin payout spreads from consistent low-variance payouts to high-volatility jackpot edges.' },
        { title: 'Golden Energy Pegs', desc: 'Striking glowing gold pegs supercharges the ball for double score value upon landing.' },
        { title: 'Continuous Chain Multiplier', desc: 'Landing balls in bins with 2x or higher multipliers keeps your combo meter climbing.' },
      ],
      specs: {
        category: 'Arcade / Physics Plinko',
        engine: 'Pixi.js / Custom 2D Physics',
        input: 'Mouse Aim & Click, Touch Drag',
        platform: 'Desktop & Mobile Web',
        audio: 'Steel Peg Pings & Jackpot Chimes',
        saveState: 'Local High Score & Bankroll',
      },
      whyPlay: [
        'Pure hypnotic fun watching kinetic physics simulations unfold in real time.',
        'Satisfying mechanical audio design where every peg collision produces pleasant harmonic chimes.',
        'Strategic depth: Dialing risk modes and aiming dropper angles rewards thoughtful play.',
      ],
    },
    about: {
      headline: 'The Mathematics of Galton Boards and Chaos Theory',
      lore: 'Inspired by the historic Galton Board and Japanese pachinko parlors, Ball Drop turns probability distribution into an exhilarating arcade sport.',
      mechanics: 'The custom physics engine calculates impulse resolution, coefficient of restitution (bounciness), and angular velocity whenever a sphere strikes a peg collider. Bins at the base evaluate the resting coordinate to credit score multipliers.',
      tech: 'Powered by Pixi.js for hardware-accelerated 2D WebGL sprite batching, capable of simulating hundreds of simultaneous ball particles with zero frame drops.',
      developmentNotes: 'Crafted to provide immediate tactile satisfaction with crisp audio feedback and clean, readable geometric design.',
    },
    tutorial: {
      headline: 'Ball Drop Strategy: Dropper Placement, Risk Modes & Multipliers',
      quickStart: [
        { step: '1', title: 'Position the Overhead Dropper', desc: 'Move your mouse or drag across the top gantry to align the drop funnel.' },
        { step: '2', title: 'Select Your Risk Mode', desc: 'Press R to cycle through Safe (gentle middle payouts), Balanced, and Wild (massive edge jackpots).' },
        { step: '3', title: 'Release the Spheres', desc: 'Click or tap to release a ball. Drop multiple balls in rapid succession to create chaotic collision cascades.' },
        { step: '4', title: 'Aim for Golden Pegs', desc: 'Guide drops toward golden pegs in the upper grid to charge your ball with double value.' },
      ],
      controls: [
        { key: 'Mouse Move / Drag', action: 'Aim Dropper along the top rail', device: 'Mouse / Touch', tip: 'Offsetting the dropper slightly off-center helps deflect balls toward high outer edges' },
        { key: 'Click / Spacebar / Tap', action: 'Release Ball', device: 'Mouse / Keyboard / Touch', tip: 'Rapid clicking releases a steady cascade of balls' },
        { key: 'R', action: 'Cycle Risk Dial (Safe / Medium / Wild)', device: 'Keyboard', tip: 'Wild mode offers huge 50x multipliers on the outermost bins' },
      ],
      scoring: 'Score equals base ball value multiplied by the bucket multiplier where the ball comes to rest.',
      proTips: [
        'Outermost bins refund balls: Landing in the far left or right slots frequently refunds a free ball, making edge drops exceptionally profitable.',
        'Chaos cascades: Dropping 5 balls simultaneously causes them to deflect off each other, spreading balls wider toward outer jackpot slots.',
        'Watch peg bounce angles: Releasing directly over a triangular peg apex causes a 50/50 split; aim slightly to the shoulder to bias direction.',
      ],
      mistakes: [
        { mistake: 'Playing Wild mode with center drops', fix: 'In Wild mode, the dead center bin pays low or zero; always aim wide toward the wings.' },
      ],
    },
    support: {
      headline: 'Ball Drop FAQs & Physics Information',
      faqs: [
        { q: 'Are ball bounces predetermined?', a: 'No! Every bounce is calculated live in real time by the physics engine based on exact collision vectors.' },
        { q: 'How do I reset my bankroll if I run out?', a: 'Simply reload the page or click the Reset Bankroll button on the HUD to start with a fresh coin reserve.' },
      ],
      troubleshooting: [
        { issue: 'Balls dropping slower than expected', fix: 'Ensure browser framerate is not throttled to 30Hz in your operating system power saver settings.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Ball Drop',
      sections: [
        { title: '1. Entertainment Simulation', content: 'Ball Drop is an arcade simulation intended strictly for entertainment. Virtual coins have no real-world monetary value.' },
        { title: '2. Fair Play', content: 'Automating drops via macro scripts or modifying physics constants via developer tools is prohibited.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Ball Drop',
      sections: [
        { title: '1. No Data Collected', content: 'Ball Drop collects no personal data or identity markers.' },
        { title: '2. Local Storage', content: 'Only your personal best score and audio preferences are saved in LocalStorage.' },
      ],
    },
  },

  'city-sprint': {
    whatIs: {
      headline: 'Sunset Skyline Rooftop Parkour Runner',
      summary: 'City Sprint is an exhilarating endless rooftop parkour sprint set against a glowing urban sunset. Vault across towering skyscrapers, leap over HVAC air ducts, scramble across water towers, and navigate yawning alley chasms. Master the double jump, preserve forward aerial momentum, and gather sparkling coin chains under an ever-accelerating speed ramp that tests your reflexes and rhythm.',
      coreFeatures: [
        { title: 'Tight Double-Jump Parkour', desc: 'Responsive single and mid-air double jumps allow you to adjust trajectories over wide rooftop chasms.' },
        { title: 'Accelerating Sunset Rhythm', desc: 'The city scroll speed smoothly climbs as your distance increases, keeping adrenaline high.' },
        { title: 'Floating Coin Chains & Multipliers', desc: 'Collect consecutive coins in mid-air to build multiplier streaks and boost your final score.' },
        { title: 'Parallax Rooftop Skyline', desc: 'Multi-layered city silhouette background creates a deep sense of height and speed.' },
      ],
      specs: {
        category: 'Runner / Parkour Platformer',
        engine: 'HTML5 Canvas 2D',
        input: 'Spacebar, Tap, Left Click',
        platform: 'Desktop & Mobile Web',
        audio: 'Footstep Taps & Coin Chimes',
        saveState: 'Local High Distance Record',
      },
      whyPlay: [
        'Crisp, clean vector art that makes obstacles instantly readable even at top speed.',
        'High skill ceiling where mastering the second jump unlocks breathtaking distance runs.',
        'Instant restart loop: Die and respawn back in the sprint in under one second.',
      ],
    },
    about: {
      headline: 'Running the High-Rise Frontier at Golden Hour',
      lore: 'Above the smog and traffic of the metropolis, rooftop couriers race across the skyline. Leaping from roof to roof before nightfall, only the most agile runners maintain momentum without looking down.',
      mechanics: 'The physics engine handles horizontal camera scroll, vertical gravity, jump impulses, and platform collision snapping. The runner can perform one primary jump from the ground and one auxiliary double jump while airborne.',
      tech: 'Crafted with HTML5 Canvas 2D using multi-layered parallax rendering, dynamic shadow casting beneath the runner, and particle dust bursts upon landing.',
      developmentNotes: 'Tuned specifically to ensure the jump arc feels buoyant and forgiving while retaining high-speed challenge.',
    },
    tutorial: {
      headline: 'Parkour Guide: Double-Jump Trajectories & Momentum Preservation',
      quickStart: [
        { step: '1', title: 'Single Jump for Small Obstacles', desc: 'Tap Spacebar to vault over air ducts and small chimney vents.' },
        { step: '2', title: 'Save Double Jump for Wide Gaps', desc: 'Do not burn your second jump early; save it to clear massive drops between skyscraper rooftops.' },
        { step: '3', title: 'Chain Floating Coins', desc: 'Adjust your jump arc in mid-air to capture whole arcs of floating gold coins for multiplier bonuses.' },
        { step: '4', title: 'Anticipate Height Drops', desc: 'When leaping to a lower roof, delay your jump to stay in the air as long as possible.' },
      ],
      controls: [
        { key: 'Spacebar / Tap / Click', action: 'Jump / Double Jump in mid-air', device: 'Keyboard / Mouse / Touch', tip: 'Tap a second time at the apex of your jump for maximum horizontal glide' },
        { key: 'P / Esc', action: 'Pause Game', device: 'Keyboard', tip: 'Pauses the sprint without breaking your momentum' },
      ],
      scoring: 'Score equals meters traveled plus coins collected multiplied by active combo tier.',
      proTips: [
        'Ride the arc: Do not double-tap immediately. Wait until your character reaches the peak of the first jump before pressing space again for maximum distance.',
        'Watch the edge: Jumping from the absolute lip of the roof gives you 20% more chasm clearance.',
        'Coins show the safe path: Coin arcs are placed along the ideal trajectory—following coin curves ensures safe landings.',
      ],
      mistakes: [
        { mistake: 'Double jumping too fast', fix: 'Tapping twice instantly wastes your second jump without gaining extra horizontal reach; space your taps out.' },
      ],
    },
    support: {
      headline: 'City Sprint FAQs & Performance Tips',
      faqs: [
        { q: 'Can I jump a third time?', a: 'No, City Sprint features a strict double-jump mechanic. Once your mid-air jump is expended, you must touch a roof to recharge it.' },
        { q: 'Why did my jump not register near the roof edge?', a: 'Make sure you press Space before walking off the edge. If you fall off a roof into freefall, you cannot perform a ground jump.' },
      ],
      troubleshooting: [
        { issue: 'Game speed feels choppy', fix: 'Close heavy background applications and ensure your browser has hardware acceleration turned on.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — City Sprint',
      sections: [
        { title: '1. Browser License', content: 'City Sprint is provided free for individual entertainment on Playzy.' },
        { title: '2. Score Validity', content: 'Scores submitted to daily missions must come from genuine human input.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — City Sprint',
      sections: [
        { title: '1. No Tracking', content: 'City Sprint collects zero personal data or browsing history.' },
        { title: '2. Local Records', content: 'Your best distance in meters is stored locally on your device.' },
      ],
    },
  },

  'infinite-runner': {
    whatIs: {
      headline: 'Procedural Biome Adventure with Stacking Power-Ups',
      summary: 'Infinite Runner is a retro pixel-art endless runner featuring five procedurally generated biomes that shift dynamically as you sprint. Dash through verdant emerald forests, across windswept desert dunes, into glowing crystal caverns, past volcanic magma spires, and up onto astral celestial cloudways. Gather and stack powerful ability badges like invulnerability shields, coin-attracting magnets, and double-distance score multipliers while overcoming shifting terrain rhythms.',
      coreFeatures: [
        { title: '5 Procedural Biomes', desc: 'Seamlessly transitions between Forests, Deserts, Caverns, Volcanoes, and Astral Skylands with unique terrain hazards.' },
        { title: 'Stacking Ability Badges', desc: 'Collect and combine Shield, Magnet, and 2x Multiplier power-ups simultaneously.' },
        { title: 'Variable Jump Height', desc: 'Hold the jump key to extend your aerial arc over wide spiked pits and obstacle clusters.' },
        { title: 'Retro Pixel Art & Chiptune Score', desc: 'Authentic 16-bit aesthetics, expressive sprite animations, and upbeat chiptune soundtrack.' },
      ],
      specs: {
        category: 'Runner / Procedural Adventure',
        engine: 'Phaser 3 Engine',
        input: 'Spacebar, Tap, Arrow Keys',
        platform: 'Desktop & Mobile Web',
        audio: '16-bit Chiptune & Arcade SFX',
        saveState: 'Local High Distance & Biome Unlocks',
      },
      whyPlay: [
        'Terrain never repeats: Procedural generation ensures every single run presents a brand-new layout.',
        'Stacking power-ups create moments of unstoppable speed and massive score bursts.',
        'Smooth 60 FPS platforming with responsive variable-height jump physics.',
      ],
    },
    about: {
      headline: 'Endless Horizons Across Shifting 16-Bit Biomes',
      lore: 'The dimensional rift has fractured the realm into five colliding zones. As an intrepid pixel explorer, you must sprint continuously forward across shifting realities to prevent the collapse of space and time.',
      mechanics: 'Phaser 3 handles tilemap procedural chunk stitching, variable gravity impulses based on key-hold duration, and power-up state timers. Stacking multiple power-ups refreshes their individual countdown bars.',
      tech: 'Built with Phaser 3 using WebGL sprite rendering, pixel-perfect camera tracking, and retro audio synthesis.',
      developmentNotes: 'Created to combine classic platformer feel with modern procedural infinite runner progression.',
    },
    tutorial: {
      headline: 'Explorer’s Guide: Biome Transitions, Jump Arcs & Power Stacking',
      quickStart: [
        { step: '1', title: 'Hold Jump for High Clearance', desc: 'Tap lightly for short hops; hold Spacebar down to achieve maximum jump height over tall hazards.' },
        { step: '2', title: 'Adapt to Changing Biomes', desc: 'Notice how Caverns feature low ceilings while Deserts feature long, rolling sinkholes.' },
        { step: '3', title: 'Stack Your Power-Ups', desc: 'Grab a Magnet while holding a Shield to pull coins safely through hazard fields.' },
        { step: '4', title: 'Survive Speed Escalations', desc: 'Biomes transition every 1,000 meters; expect faster obstacle pacing with every new territory.' },
      ],
      controls: [
        { key: 'Spacebar / Tap', action: 'Jump (Hold for higher arc)', device: 'Keyboard / Touch', tip: 'Vary your hold duration depending on obstacle height' },
        { key: 'P / Esc', action: 'Pause / Resume', device: 'Keyboard', tip: 'Freezes game state instantly' },
      ],
      scoring: 'Distance traveled multiplied by active power-up badges plus coins gathered.',
      proTips: [
        'Shield preserves momentum: If you have a Shield active, you can intentionally plow through one obstacle without losing your run.',
        'Low ceiling caution in Caverns: Do not hold jump to maximum height inside crystal caves or you will strike stalactites.',
        'Magnet + Double Points: Triggering both power-ups together yields 4x coin revenue.',
      ],
      mistakes: [
        { mistake: 'Always holding jump to maximum', fix: 'Over-jumping causes you to land squarely on obstacles positioned right behind the first barrier.' },
      ],
    },
    support: {
      headline: 'Infinite Runner FAQs & Help',
      faqs: [
        { q: 'How many biomes exist in the game?', a: 'There are five distinct biomes: Forest, Desert, Crystal Cavern, Volcanic Spire, and Astral Skyland.' },
        { q: 'Does my distance record save?', a: 'Yes! Your farthest distance and unlocked biomes are preserved in LocalStorage.' },
      ],
      troubleshooting: [
        { issue: 'Keypress feels sticky', fix: 'Check that sticky keys or accessibility shortcuts are disabled in your OS settings.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Infinite Runner',
      sections: [
        { title: '1. Usage Rights', content: 'Infinite Runner is free for non-commercial personal gameplay on Playzy.' },
        { title: '2. Fair Scoring', content: 'Altering distance timers or collision states via external scripts is forbidden.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Infinite Runner',
      sections: [
        { title: '1. Zero Data Collection', content: 'Infinite Runner collects no personal information or contact details.' },
        { title: '2. Local Browser Storage', content: 'High scores and sound toggles are retained exclusively in your local browser storage.' },
      ],
    },
  },

  'mario-king': {
    whatIs: {
      headline: 'Six Kingdoms 16-Bit Retro Platforming Pilgrimage',
      summary: 'Mario King is a nostalgic, richly crafted 16-bit retro platforming adventure that spans six handcrafted kingdoms: Grass Plains, Desert Dunes, Crystal Caverns, Frost Peaks, Sky Citadel, and the Royal Magma Castle. Leap across floating brick platforms, stomp classic goombas, shatter coin blocks, grab invincibility stars, and storm the castle gates for an epic boss confrontation against the tyrannical King himself!',
      coreFeatures: [
        { title: '6 Handcrafted Kingdoms', desc: 'Journey across varied thematic worlds culminating in a royal boss battle inside the Castle.' },
        { title: 'Mid-Air Stomp Combos', desc: 'Bounce from enemy to enemy without touching the ground to multiply your score streak.' },
        { title: 'Power Mushrooms & Invincible Stars', desc: 'Grow in size and power with mushrooms or plow through enemy ranks with star power.' },
        { title: 'Multi-Phase Boss Showdown', desc: 'Duck under the King’s projectile throws and land three precise head stomps to liberate the realm.' },
      ],
      specs: {
        category: 'Platformer / Retro Adventure',
        engine: 'HTML5 Canvas 2D Fast Engine',
        input: 'Arrow Keys, WASD, Spacebar',
        platform: 'Desktop & Mobile Web',
        audio: 'Retro 8/16-Bit Soundtracks & Stomp Chimes',
        saveState: 'Local Kingdom Progress & High Score',
      },
      whyPlay: [
        'A heartfelt tribute to the golden age of 1990s platformers with modern responsive controls.',
        'Satisfying physics weight and inertia that feels authentic to classic console gaming.',
        'Packed with secrets: Hidden coin blocks, underground pipe warps, and rewarding boss mechanics.',
      ],
    },
    about: {
      headline: 'The Legend of the Stomp and the Six Royal Crowns',
      lore: 'The tyrannical King has seized the ancient crowns of all six kingdoms, plunging the world into chaos. As the kingdom’s bravest champion, you must traverse treacherous deserts, frozen peaks, and fiery dungeons to reclaim the throne.',
      mechanics: 'The custom physics engine calculates acceleration, variable jump velocity, horizontal skidding inertia, and enemy bounce impulses. Hitting enemies on their upper bounding box triggers a stomp kill and bounces the player upward.',
      tech: 'Engineered in HTML5 Canvas 2D with smooth camera scrolling, animated sprite sheets, and retro sound synthesizer effects.',
      developmentNotes: 'Created to bring authentic console-quality platformer physics directly to the web with zero installation.',
    },
    tutorial: {
      headline: 'Hero’s Manual: Kingdom Walkthrough, Stomp Combos & Boss Tactics',
      quickStart: [
        { step: '1', title: 'Run and Leap', desc: 'Use Left/Right arrows or A/D to run; press Space or W to jump over pits and hazards.' },
        { step: '2', title: 'Stomp Enemies from Above', desc: 'Land directly on the heads of patrolling goombas to defeat them and gain extra bounce height.' },
        { step: '3', title: 'Hit Question Blocks', desc: 'Jump into question mark blocks from underneath to uncover gold coins, mushrooms, and stars.' },
        { step: '4', title: 'Defeat the King in World 6', desc: 'Duck under his scepter projectiles and jump on his crowned head three times to win!' },
      ],
      controls: [
        { key: 'Left / Right Arrow (or A / D)', action: 'Run left / right', device: 'Keyboard', tip: 'Build momentum for longer horizontal leaps' },
        { key: 'Space / Up Arrow / W', action: 'Jump (Hold for higher arc)', device: 'Keyboard', tip: 'Holding the key carries you over wide castle lava pits' },
        { key: 'Down Arrow / S', action: 'Duck / Crouch', device: 'Keyboard', tip: 'Ducks under flying projectiles during boss battles' },
      ],
      scoring: 'Score equals coins gathered, enemies defeated, and time remaining upon touching the kingdom flagpole.',
      proTips: [
        'Chain stomps in mid-air: Stomping multiple enemies in succession without touching the ground awards 100, 200, 400, 800, and 1000 bonus points.',
        'Star power speed: While invincible with Star power, sprint at full speed—you are immune to all enemy contact.',
        'King’s vulnerable window: The King pauses for 1.5 seconds after throwing his hammer—that is your golden opening to jump on his crown.',
      ],
      mistakes: [
        { mistake: 'Landing on enemy sides', fix: 'Make sure your vertical velocity is downward when making contact; colliding while walking horizontally takes damage.' },
      ],
    },
    support: {
      headline: 'Mario King FAQs & Kingdom Save Support',
      faqs: [
        { q: 'How many hits does it take to beat the King?', a: 'The King takes three clean stomps to his crown. After each hit, he briefly flashes invincible—retreat and wait for him to resume throwing.' },
        { q: 'Does my kingdom progress save if I close the game?', a: 'Yes! Your completed kingdoms and best scores are saved in your browser’s LocalStorage.' },
      ],
      troubleshooting: [
        { issue: 'Player slides slightly when stopping', fix: 'This is intentional retro inertia! Tap the opposite direction briefly to perform a quick skid stop.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Mario King',
      sections: [
        { title: '1. Entertainment License', content: 'Mario King is a fan tribute game provided free for non-commercial personal enjoyment on Playzy.' },
        { title: '2. Prohibited Actions', content: 'Extracting sprite assets or forging level clears via memory tampering is forbidden.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Mario King',
      sections: [
        { title: '1. No PII Collection', content: 'Mario King collects zero personal information, user accounts, or telemetry.' },
        { title: '2. Local Data', content: 'Only your unlocked kingdoms, sound preferences, and high scores reside in LocalStorage.' },
      ],
    },
  },

  'gravity-shift': {
    whatIs: {
      headline: 'Fast Geometric Inversion Platformer',
      summary: 'Gravity Shift is an adrenaline-fueled arcade platform game where gravity manipulation and precision jumping collide. Bound across floating metallic platforms, evade oscillating laser barriers and kinetic hazards, and stay ahead of the screen scroll as the game pace escalates. Perfect for players who crave intense reflex challenges with instant restart gratification.',
      coreFeatures: [
        { title: 'Precision Gravity Jumps', desc: 'Time platform bounds to slip past lethal laser fields and spinning spikes.' },
        { title: 'Dynamic Camera Speed Ramp', desc: 'The screen scroll steadily quickens, testing forward anticipation and composure.' },
        { title: 'Floating Energy Orbs', desc: 'Gather sparkling energy pickups along hazardous routes to boost your survival score.' },
        { title: 'High-Contrast Cyber Aesthetic', desc: 'Minimalist neon lines and dark backgrounds ensure razor-sharp obstacle readability.' },
      ],
      specs: {
        category: 'Arcade / Reflex Platformer',
        engine: 'HTML5 Canvas 2D',
        input: 'Spacebar, W, Up Arrow, Tap',
        platform: 'Desktop & Mobile Web',
        audio: 'Electronic Kinetic SFX',
        saveState: 'Local High Score',
      },
      whyPlay: [
        'Instant load time with zero overhead: Plays directly in any browser.',
        'High skill ceiling that rewards pattern recognition and fast twitch reflexes.',
        'Addictive "just one more run" loop with instant one-key restarts.',
      ],
    },
    about: {
      headline: 'Defying the Vectors of an Unstable Dimension',
      lore: 'Within an unstable geometric dimension, gravitational constants fluctuate violently. As a kinetic energy probe, you must leap from floating platform to platform before the void collapses behind you.',
      mechanics: 'The game uses custom 2D Canvas physics tracking vertical gravity, horizontal scrolling velocity, and platform landing detection.',
      tech: 'Lightweight HTML5 Canvas engine designed for flawless 60 FPS performance on all hardware.',
      developmentNotes: 'Created to provide clean, distraction-free platforming fun with zero latency.',
    },
    tutorial: {
      headline: 'Gravity Shift Guide: Timing, Jumps & Hazard Avoidance',
      quickStart: [
        { step: '1', title: 'Jump Between Platforms', desc: 'Press Spacebar, W, or Up Arrow to jump across gaps between floating platforms.' },
        { step: '2', title: 'Watch the Next Platform', desc: 'Keep your eyes focused ahead of your character to anticipate moving platforms and laser hazards.' },
        { step: '3', title: 'Collect Energy Orbs', desc: 'Grab glowing orbs situated on risky platforms to multiply your survival score.' },
      ],
      controls: [
        { key: 'Spacebar / W / Up Arrow / Tap', action: 'Jump', device: 'Keyboard / Touch', tip: 'Leave room to react as the pace increases' },
      ],
      scoring: 'Score increases with distance traveled and orbs collected.',
      proTips: [
        'Look ahead: Don’t watch your cube—look at the right side of the screen to prepare for approaching jumps.',
        'Land in the center: Avoid landing on the very edge of platforms to prevent slipping off during high speed.',
      ],
      mistakes: [
        { mistake: 'Jumping too early', fix: 'Wait until you are near the edge of your current platform to maximize your reach.' },
      ],
    },
    support: {
      headline: 'Gravity Shift FAQs & Support',
      faqs: [
        { q: 'Is Gravity Shift saved across sessions?', a: 'Yes, your personal best distance is saved in your browser’s LocalStorage.' },
      ],
      troubleshooting: [
        { issue: 'Cube falls through platforms', fix: 'Ensure your browser is updated and hardware acceleration is enabled.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Gravity Shift',
      sections: [
        { title: '1. Service Scope', content: 'Gravity Shift is provided free for individual entertainment on Playzy.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Gravity Shift',
      sections: [
        { title: '1. Privacy Protection', content: 'No personal identification is collected or shared.' },
      ],
    },
  },

  'among-us-pixel-outpost': {
    whatIs: {
      headline: 'Pixel Space Outpost Mystery with Autonomous AI Crewmates',
      summary: 'Among Us: Pixel Outpost is a suspenseful 2D pixel-art social deduction and survival strategy game set on a lonely research station orbiting Deep Sector 7. Take on the role of a diligent crewmate performing life-support maintenance tasks—or sneak through ventilation shafts as the stealthy shapeshifting Impostor. With intelligent AI crewmates exhibiting realistic routines, suspicion meters, and emergency meeting voting logic, every match is an unpredictable thriller.',
      coreFeatures: [
        { title: 'Autonomous AI Crewmates', desc: 'Computer-controlled astronauts complete real tasks, report bodies, form suspicions, and vote dynamically.' },
        { title: 'Authentic Station Tasks', desc: 'Interact with hands-on mini-games: Asteroid Cannons, Shield calibration, Medbay scans, and Wire repairs.' },
        { title: 'Ventilation & Sabotage Systems', desc: 'As the Impostor, trigger station-wide reactor meltdowns, cut electrical lights, and warp through air ducts.' },
        { title: 'Emergency Meetings & Chat Voting', desc: 'Convene crisis meetings in the Cafeteria to debate whereabouts and vote out suspected impostors.' },
      ],
      specs: {
        category: 'Strategy / Social Deduction',
        engine: 'React 19 / HTML5 Canvas / Vite',
        input: 'WASD, Arrow Keys, Mouse Click, Touch',
        platform: 'Desktop & Mobile Web',
        audio: 'Synthesizer Ambience, Task SFX & Alarms',
        saveState: 'Local Career Matches & Win Record',
      },
      whyPlay: [
        'Single-player social deduction: Experience the psychological thrill of Among Us anytime without waiting for online lobbies.',
        'Deep bot intelligence: AI crewmates observe who was near crime scenes and analyze alibis during meetings.',
        'Smooth standalone execution running in an isolated secure sandbox.',
      ],
    },
    about: {
      headline: 'Deception in the Dark Corridors of Outpost 7',
      lore: 'Deep in the uncharted reaches of Sector 7, Outpost Theta conducts classified atmospheric research. When critical power relays fail and crewmates go missing, paranoia spreads like wildfire through the narrow corridors.',
      mechanics: 'The simulation runs an autonomous bot behavior tree for each crewmate, simulating visual cone raycasts, wandering goals, task interaction timers, and an evolving suspicion matrix updated whenever a dead body or suspicious vent exit is witnessed.',
      tech: 'Crafted with React 19, TypeScript, and HTML5 Canvas with custom A* pathfinding, dynamic field-of-view lighting shadows, and interactive task modals.',
      developmentNotes: 'Created to provide an engaging solo-friendly adaptation of social deduction mechanics powered by modern web tech.',
    },
    tutorial: {
      headline: 'Outpost Survival Guide: Tasks, Sabotage, Vents & Voting Logic',
      quickStart: [
        { step: '1', title: 'Learn Your Role', desc: 'Check your secret role reveal screen: Crewmate (complete tasks and find the impostor) or Impostor (sabotage and eliminate crew).' },
        { step: '2', title: 'Complete Assigned Tasks', desc: 'Follow your yellow task list: Fix Wiring in Electrical, Align Shields in Navigation, and Clear Asteroids in Weapons.' },
        { step: '3', title: 'Report Bodies & Convene Meetings', desc: 'When discovering a fallen astronaut, tap the Report button immediately to bring all crew into the Cafeteria.' },
        { step: '4', title: 'Vote Out the Suspect', desc: 'Examine who has no alibi, cast your vote, and eject the impostor into deep space.' },
      ],
      controls: [
        { key: 'WASD / Arrow Keys', action: 'Move astronaut through corridors', device: 'Keyboard', tip: 'Use corners to break line-of-sight from suspected impostors' },
        { key: 'E / Space / Click Use', action: 'Interact with tasks, vents, and consoles', device: 'Keyboard / Mouse', tip: 'Interact button highlights yellow when in range of a task' },
        { key: 'Q / Click Kill (Impostor)', action: 'Eliminate crewmate when in melee range', device: 'Keyboard / Mouse', tip: 'Ensure no witnesses are in your room before striking' },
        { key: 'Esc', action: 'Pause game or close task modal', device: 'Keyboard', tip: 'Exits out of any active mini-game' },
      ],
      scoring: 'Wins are recorded for both Crewmate task completions and Impostor eliminations.',
      proTips: [
        'Buddy system: Travel in pairs with a trusted crewmate so you can vouch for each other’s alibis during emergency votes.',
        'Watch the task bar: Fake tasks don’t advance the green progress bar at the top left—keep an eye on anyone loitering near consoles.',
        'Admin table intel: Check the Admin map console to see which rooms currently contain astronauts.',
      ],
      mistakes: [
        { mistake: 'Vent jumping in front of crew', fix: 'Venting produces a visible animation; only enter air ducts when the room is completely empty.' },
      ],
    },
    support: {
      headline: 'Among Us: Pixel Outpost FAQs & Support',
      faqs: [
        { q: 'Can I choose to always play as Impostor?', a: 'You can adjust role assignment preferences in the pre-game lobby settings before launching a round.' },
        { q: 'How do the AI bots decide who to vote for?', a: 'Bots track which astronauts were seen near the room where the body was discovered and check who was performing valid tasks.' },
      ],
      troubleshooting: [
        { issue: 'Task mini-game does not register click', fix: 'Ensure you click directly inside the mini-game popup window and release your mouse cleanly.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Among Us: Pixel Outpost',
      sections: [
        { title: '1. Fan-Crafted Simulation', content: 'Among Us: Pixel Outpost is a fan-created tactical tribute game hosted free for personal entertainment on Playzy.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Among Us: Pixel Outpost',
      sections: [
        { title: '1. No Account or Data Harvest', content: 'No personal identification, email addresses, or chat logs are collected or stored.' },
        { title: '2. Local Records', content: 'Match statistics and lobby preferences are preserved exclusively in LocalStorage.' },
      ],
    },
  },

  'bloom-loop': {
    whatIs: {
      headline: 'Enchanted Botanical Loop Puzzle & Color Harmony',
      summary: 'Bloom Loop: Garden Colour Flow is a relaxing yet deeply strategic botanical color puzzle. Guide charming robotic bee drones around winding vine loops, loading vibrant pollen ammunition to pollinate matching flower beds. Clear garden tiles with satisfying chain reaction pollen bursts, unlock antique seed chests, and restore life to neglected conservatory greenhouses across dozens of brain-teasing levels.',
      coreFeatures: [
        { title: 'Winding Vine Loop Traversal', desc: 'Direct bee drones along continuous curvilinear vine tracks to position pollen shots.' },
        { title: 'Chain-Reaction Pollen Bursts', desc: 'Matching colors triggers radial pollen bursts that clear adjacent matching flower buds.' },
        { title: 'Unlockable Seed Chests', desc: 'Complete garden objectives within turn limits to unlock rare botanical blossoms and cosmetic bee wings.' },
        { title: 'Soothing Ambient Greenhouse Atmosphere', desc: 'Gentle nature foley, soft acoustic melodies, and lush watercolor clay graphics.' },
      ],
      specs: {
        category: 'Puzzle / Botanical Casual',
        engine: 'React 19 / HTML5 Canvas / Vite',
        input: 'Mouse Click, Touch Tap & Drag',
        platform: 'Desktop & Mobile Web',
        audio: 'Acoustic Guitar, Garden Chimes & Bee Buzz',
        saveState: 'Local Level Stars & Greenhouse Unlocks',
      },
      whyPlay: [
        'A tranquil, meditative puzzle experience that relieves stress while exercising logic.',
        'Charming hand-crafted claymation bee characters and lush floral animations.',
        'Zero timers: Take all the time you need to plan the perfect garden cascade.',
      ],
    },
    about: {
      headline: 'The Botanical Engineering of the Whispering Greenhouse',
      lore: 'Within the forgotten Royal Conservatory, automated guardian bees tend to rare, magical floral species. By routing pollen streams through harmonic vine loops, you help nature reassert its colorful beauty.',
      mechanics: 'The game tracks node-graph vine pathways. Bees travel clockwise along tracks and release pollen projectiles along tangent vectors toward the central flower bed. When projectile color matches target flower color, a recursive area-of-effect bloom is triggered.',
      tech: 'Engineered with React 19, TypeScript, SVG curves, and HTML5 Canvas particle systems for blooming petal bursts.',
      developmentNotes: 'Created to provide an accessible, family-friendly color logic game with delightful visual and acoustic charm.',
    },
    tutorial: {
      headline: 'Gardener’s Guide: Vine Traversal, Pollen Matching & Chest Unlocks',
      quickStart: [
        { step: '1', title: 'Inspect the Flower Bed', desc: 'Identify the color arrangement of closed flower buds in the center planter.' },
        { step: '2', title: 'Queue Your Worker Bee', desc: 'Select a bee with matching pollen ammunition from the bottom dock.' },
        { step: '3', title: 'Aim and Release Along the Vine', desc: 'Launch the bee along the vine loop so its discharge trajectory hits the target flower cluster.' },
        { step: '4', title: 'Trigger Cascade Pollination', desc: 'Clear the entire board before exhausting your allotted bee moves to earn 3 stars.' },
      ],
      controls: [
        { key: 'Mouse Click / Tap', action: 'Select Bee & Fire along vine loop', device: 'Mouse / Touch', tip: 'Check the trajectory guide line before committing your shot' },
      ],
      scoring: 'Score is based on flowers cleared, turns remaining, and bonus stars earned from seed chest discoveries.',
      proTips: [
        'Clear blockers first: Focus on clearing neutral gray stones or weeds that obstruct access to high-value interior flowers.',
        'Set up domino bursts: Aim for flowers adjacent to two or more identical buds to trigger wide radial clears.',
      ],
      mistakes: [
        { mistake: 'Wasting bees on single isolated flowers', fix: 'Always plan your shots to hit clusters of 2 or more flowers simultaneously.' },
      ],
    },
    support: {
      headline: 'Bloom Loop FAQs & Help',
      faqs: [
        { q: 'Is there a move limit on levels?', a: 'Yes, each level provides a specific queue of worker bees. Clearing all flowers within the limit earns bonus star ratings.' },
        { q: 'Does my level progress save?', a: 'Yes! All completed levels and star counts are automatically preserved in your browser’s LocalStorage.' },
      ],
      troubleshooting: [
        { issue: 'Trajectory line not visible', fix: 'Ensure you click and hold your mouse or finger on the bee dock to preview the aim arc.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Bloom Loop',
      sections: [
        { title: '1. Service Scope', content: 'Bloom Loop is provided free for personal browser enjoyment on Playzy.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Bloom Loop',
      sections: [
        { title: '1. Privacy Protection', content: 'No personal data, email addresses, or cookies are collected or shared.' },
      ],
    },
  },

  'cash-tycoon': {
    whatIs: {
      headline: 'Sky-High Corporate Tower Idle Business Simulation',
      summary: 'Cash Tycoon: Fame & Fortune is a vibrant, deeply engaging idle business management simulation where you start with a ground-floor boutique and construct a colossal skyscraper corporate empire. Unlock diverse business floors ranging from artisan coffee bars and game development studios to high-end luxury fashion and rooftop helicopter lounges. Hire charismatic executive managers, automate revenue streams, balance reinvestment multipliers, and prestige your fortune to reach billionaire status!',
      coreFeatures: [
        { title: 'Multi-Floor Tower Expansion', desc: 'Construct dozens of unique commercial floors, each with distinctive themes, animations, and profit margins.' },
        { title: 'Automated Manager Hires', desc: 'Recruit skilled floor directors to collect revenue automatically while you strategize.' },
        { title: 'Prestige & Fortune Multipliers', desc: 'Sell your corporate empire for Golden Angel investors that permanently amplify all future profits.' },
        { title: 'Offline / Background Earnings', desc: 'Your business tower continues generating passive profits even while you browse other games.' },
      ],
      specs: {
        category: 'Simulation / Business Idle',
        engine: 'React 19 / TypeScript / Vite',
        input: 'Mouse Click, Touch Tap',
        platform: 'Desktop & Mobile Web',
        audio: 'Cash Register Dings & Upbeat Jazz',
        saveState: 'Local Capital & Skyscraper Floors',
      },
      whyPlay: [
        'Satisfying sense of financial growth watching modest dollar bills swell into billions and trillions.',
        'Charming isometric tower art filled with lively animated customers and office staff.',
        'Play at your own pace: Active tapping speeds up profits, or let managers run the show passively.',
      ],
    },
    about: {
      headline: 'From Lemonade Stand to Global Corporate Conglomerate',
      lore: 'In the financial heart of Metropolis, real estate is king. Armed with entrepreneurial ambition, you take the elevator to the top floor of capitalism, building an empire that dominates every sector of industry.',
      mechanics: 'Revenue generation is calculated on exponential cost curves with diminishing milestone returns offset by manager automation speedups and prestige angel investor multipliers.',
      tech: 'Engineered with React 19, Zustand state persistence, and responsive CSS grid architectures.',
      developmentNotes: 'Crafted to provide a polished, ad-free idle tycoon experience directly inside web browsers.',
    },
    tutorial: {
      headline: 'Tycoon’s Handbook: Floor Investments, Manager Automation & Prestige',
      quickStart: [
        { step: '1', title: 'Tap to Collect Initial Revenue', desc: 'Click your first ground-floor business to produce cash until you can afford your first manager.' },
        { step: '2', title: 'Hire Floor Managers', desc: 'Open the Managers tab and hire a supervisor so the business runs continuously without manual clicking.' },
        { step: '3', title: 'Unlock New Tower Floors', desc: 'Invest savings into constructing the next floor above to access exponentially higher profit tiers.' },
        { step: '4', title: 'Prestige for Angel Investors', desc: 'When progress slows, reset your tower for Golden Angels that double or triple all future earnings.' },
      ],
      controls: [
        { key: 'Mouse Click / Tap', action: 'Collect revenue, purchase upgrades, hire managers', device: 'Mouse / Touch', tip: 'Use the 1x / 10x / Max upgrade toggle to level up floors rapidly' },
      ],
      scoring: 'Empire status is rated by total lifetime earnings, tower height, and accumulated angel investors.',
      proTips: [
        'Target milestone levels: Leveling a business to 25, 50, 100, and 200 cuts production cycle time in half.',
        'Don’t delay prestige: Resetting for 50+ Angel Investors accelerates your next climb tenfold.',
        'Balance top and bottom floors: Upper floors pay higher amounts, but lower floors cycle every few milliseconds.',
      ],
      mistakes: [
        { mistake: 'Neglecting manager automation', fix: 'Always buy managers before spending large sums on minor floor level-ups.' },
      ],
    },
    support: {
      headline: 'Cash Tycoon FAQs & Save Recovery',
      faqs: [
        { q: 'Do I earn money while offline?', a: 'Yes! When you reopen Cash Tycoon, your managers report your accumulated offline earnings.' },
        { q: 'What does Prestige do?', a: 'Prestige resets your cash and floors in exchange for Angel Investors, which permanently multiply all earnings.' },
      ],
      troubleshooting: [
        { issue: 'Floor buttons grayed out', fix: 'Ensure you have accumulated sufficient bankroll cash displayed on the top balance bar.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Cash Tycoon',
      sections: [
        { title: '1. Entertainment Only', content: 'Virtual cash, coins, and angels possess no real-world monetary value and cannot be redeemed for fiat currency.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Cash Tycoon',
      sections: [
        { title: '1. No PII Collection', content: 'Cash Tycoon operates without user accounts or tracking cookies.' },
        { title: '2. Local Storage', content: 'All financial progress and tower floor data reside securely in your browser’s LocalStorage.' },
      ],
    },
  },

  'flappy-bird-3d': {
    whatIs: {
      headline: 'Colorful 3D Flying Arcade with Realistic Depth & Physics',
      summary: 'Flappy Bird 3D elevates the beloved one-button arcade phenomenon into dynamic, stereoscopic three-dimensional space. Guide a plucky voxel bird through an endlessly generated sky corridor framed by colossal jade pillars, rotating coin rings, and shifting cloud formations. Tap to flap, master vertical buoyancy, and thread the needle between obstacles with genuine depth perception and smooth 60 FPS Three.js graphics.',
      coreFeatures: [
        { title: 'True 3D Stereoscopic Perspective', desc: 'Navigate pillars with dynamic depth cues, volumetric clouds, and realistic shadow projection.' },
        { title: 'One-Button Flap Physics', desc: 'Precise vertical impulse mechanics tuned to capture the authentic, addictive arcade challenge.' },
        { title: 'Airborne Ring Collectibles', desc: 'Glide through floating golden rings between pillars to earn bonus score multipliers.' },
        { title: 'Dynamic Horizon Time of Day', desc: 'Watch dawn break into bright midday sun and fade into a starry twilight as your score climbs.' },
      ],
      specs: {
        category: 'Arcade / 3D Flying',
        engine: 'Three.js / WebGL / React 19',
        input: 'Spacebar, Click, Touch Tap',
        platform: 'Desktop & Mobile Web',
        audio: 'Wing Flap SFX, Point Chimes & Crash Foley',
        saveState: 'Local High Score & Distance Record',
      },
      whyPlay: [
        'A thrilling 3D evolution of a legendary genre that tests depth perception and rhythm.',
        'Runs seamlessly in any browser without app store installations or performance hitches.',
        'Immediate restart loop: Crash, tap once, and you’re flying again in half a second.',
      ],
    },
    about: {
      headline: 'Taking Flight into the Third Dimension',
      lore: 'High above the voxel clouds, migratory birds navigate the perilous Pillar Corridor. Only the most disciplined flyers can maintain steady altitude through the shifting emerald monolithic spires.',
      mechanics: 'The Three.js engine simulates gravitational acceleration and upward impulse vectors applied to the bird’s rigid body, evaluating 3D cylindrical bounding box collisions against moving pillars.',
      tech: 'Engineered with Three.js, React 19, custom GLSL fog shaders, and responsive touch listeners.',
      developmentNotes: 'Created to demonstrate how classic 2D arcade mechanics can be transformed into compelling 3D browser experiences.',
    },
    tutorial: {
      headline: 'Flight Manual: Buoyancy, Pillar Trajectories & Flap Cadence',
      quickStart: [
        { step: '1', title: 'Tap to Flap', desc: 'Press Spacebar, click, or tap the screen to give your bird an upward wing flap.' },
        { step: '2', title: 'Establish a Hover Cadence', desc: 'Use rhythmic, short taps to keep your bird steady at the center altitude of the screen.' },
        { step: '3', title: 'Target the Pillar Gaps', desc: 'Align your altitude with the opening between the upper and lower emerald pillars.' },
        { step: '4', title: 'Thread Through Golden Rings', desc: 'Aim for floating rings between pillars to score double bonus points.' },
      ],
      controls: [
        { key: 'Spacebar / Left Click / Tap', action: 'Flap wings to gain altitude', device: 'Keyboard / Mouse / Touch', tip: 'Short, evenly spaced taps prevent erratic altitude swings' },
      ],
      scoring: 'Score increases by 1 point for every pillar pair cleared plus 2 points for every golden ring threaded.',
      proTips: [
        'Stay low before climbing: It is easier to recover from low altitude with two quick flaps than it is to dive rapidly to avoid a top pillar.',
        'Use the shadow: Watch your bird’s shadow projected on the lower pillar base to gauge exact forward depth.',
        'Rhythm over reaction: Anticipate the next gap before clearing the current one.',
      ],
      mistakes: [
        { mistake: 'Flapping repeatedly near the ceiling', fix: 'Gravity takes time to overcome your upward momentum; avoid over-flapping at the top of gaps.' },
      ],
    },
    support: {
      headline: 'Flappy Bird 3D FAQs & Device Support',
      faqs: [
        { q: 'Is my high score saved across sessions?', a: 'Yes! Your personal best score is preserved in your browser’s LocalStorage.' },
        { q: 'Can I play on my phone?', a: 'Yes, Flappy Bird 3D is fully optimized for one-touch mobile screen taps in portrait and landscape modes.' },
      ],
      troubleshooting: [
        { issue: 'Game feels too fast on 144Hz monitors', fix: 'The physics loop uses fixed-delta timing; ensure your browser window is not overclocking requestAnimationFrame.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Flappy Bird 3D',
      sections: [
        { title: '1. Service Scope', content: 'Flappy Bird 3D is provided free for individual entertainment on Playzy.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Flappy Bird 3D',
      sections: [
        { title: '1. Zero Data Collection', content: 'No personal identification, cookies, or location data are harvested.' },
      ],
    },
  },

  'pixels-farm-craft': {
    whatIs: {
      headline: 'Charming 16-Bit Countryside Farming, Crafting & Adventure',
      summary: 'Pixels: Farm, Craft & Adventure is an enchanting retro 16-bit farming simulation and RPG adventure. Inherit an overgrown rural plot in a welcoming pixelated community. Till fertile soil, sow seasonal crops, irrigate seedlings, tend cuddly livestock, forage for wild herbs in the surrounding woodlands, delve into caverns for copper and iron ore, and craft artisanal goods while fulfilling questlines for friendly village residents.',
      coreFeatures: [
        { title: 'Seasonal Crop Farming', desc: 'Till soil, plant carrots, wheat, and strawberries, water them daily, and harvest bumper crops.' },
        { title: 'Crafting & Homestead Building', desc: 'Gather wood and ore to craft fences, artisan kegs, tool upgrades, and rustic furniture.' },
        { title: 'Cavern Mining & Foraging', desc: 'Explore mineral-rich underground mines, crack open geodes, and gather wild berries.' },
        { title: 'Community Questlines', desc: 'Deliver crops and crafted goods to townspeople to earn gold coins and unlock rare seeds.' },
      ],
      specs: {
        category: 'Simulation / RPG Adventure',
        engine: 'React 19 / HTML5 Canvas 2D / Vite',
        input: 'WASD, Arrow Keys, Mouse Click, Touch',
        platform: 'Desktop & Mobile Web',
        audio: 'Acoustic Folk Strings & Countryside Foley',
        saveState: 'Local Farm Inventory & Quest Progress',
      },
      whyPlay: [
        'A cozy, warm escape combining the relaxing loop of Stardew Valley with zero installation friction.',
        'Wholesome retro pixel art filled with dynamic seasons, butterflies, and gentle weather.',
        'Complete freedom: Farm, fish, mine, craft, or chat with villagers at your own peaceful pace.',
      ],
    },
    about: {
      headline: 'Restoring Heritage and Harmony to Clover Valley',
      lore: 'Escaping the bustling grind of the capital city, you arrive in sleepy Clover Valley to revive your grandfather’s neglected homestead. By honoring the soil and helping your neighbors, you breathe new life into the historic valley.',
      mechanics: 'The game coordinates a multi-layered 2D tile grid tracking soil tilled status, hydration levels, crop growth stages, player energy stamina, and inventory backpack slots.',
      tech: 'Engineered with React 19, TypeScript, and 2D Canvas sprite sheet rendering with custom daytime lighting transitions.',
      developmentNotes: 'Created to provide a rich, relaxing farming RPG directly in the browser that saves your progress seamlessly.',
    },
    tutorial: {
      headline: 'Farmer’s Almanac: Tilling, Planting, Watering & Tool Crafting',
      quickStart: [
        { step: '1', title: 'Clear Debris from the Field', desc: 'Equip your axe and pickaxe to clear weeds, fallen logs, and stones from your field.' },
        { step: '2', title: 'Till Soil and Sow Seeds', desc: 'Select the Hoe to till dark soil plots, then plant your starter carrot and wheat seeds.' },
        { step: '3', title: 'Water Crops Daily', desc: 'Fill your Watering Can at the pond and water every planted seed each morning to foster growth.' },
        { step: '4', title: 'Harvest and Complete Quests', desc: 'When crops are ripe, harvest them and check the town Quest Board to earn gold and reputation.' },
      ],
      controls: [
        { key: 'WASD / Arrow Keys', action: 'Move farmer through the farm and village', device: 'Keyboard', tip: 'Hold Shift to toggle between walking and jogging' },
        { key: 'Left Click / Space', action: 'Use active tool / Interact with objects', device: 'Keyboard / Mouse', tip: 'Face the targeted soil tile or villager' },
        { key: '1 to 8', action: 'Select Hotbar item or tool', device: 'Keyboard', tip: 'Keep your Hoe, Watering Can, and Seeds handy' },
        { key: 'E / Tab', action: 'Open Backpack & Crafting Menu', device: 'Keyboard', tip: 'Manage inventory and craft new items' },
      ],
      scoring: 'Progress is measured by farm net worth, completed quests, and unlocked crop varieties.',
      proTips: [
        'Keep an eye on Energy: Chopping wood and tilling soil consumes stamina; eat harvested berries or rest in your cabin bed to restore energy.',
        'Upgrade your Watering Can: Upgraded tools water 3 tiles at once, saving valuable morning energy.',
        'Store materials: Never sell all your raw wood and stone; you will need them to craft barns and artisan mayonnaise makers.',
      ],
      mistakes: [
        { mistake: 'Forgetting to water crops daily', fix: 'Unwatered crops will not wither, but their growth timer is paused until they receive water.' },
      ],
    },
    support: {
      headline: 'Pixels: Farm, Craft & Adventure FAQs',
      faqs: [
        { q: 'Does my farm save automatically?', a: 'Yes! Your farm inventory, crop growth states, and quest completions are continuously saved to LocalStorage.' },
        { q: 'What happens if my energy reaches zero?', a: 'Your farmer becomes exhausted and moves slower. Eat food from your backpack to immediately replenish stamina.' },
      ],
      troubleshooting: [
        { issue: 'Cannot place seeds on ground', fix: 'Seeds can only be planted on soil that has been tilled with the Hoe.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Pixels: Farm, Craft & Adventure',
      sections: [
        { title: '1. Service Scope', content: 'Pixels: Farm, Craft & Adventure is free for personal browser gameplay on Playzy.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Pixels: Farm, Craft & Adventure',
      sections: [
        { title: '1. Privacy Commitment', content: 'No personal identification, contact details, or cookies are collected or sold.' },
        { title: '2. Local Persistence', content: 'All farm layouts, quest milestones, and inventory items reside strictly in LocalStorage.' },
      ],
    },
  },

  'shop-tycoon': {
    whatIs: {
      headline: 'Isometric Supermarket & Retail Management Empire',
      summary: 'Shop Tycoon: Market Empire is an intricate isometric retail management simulation where you step into the shoes of an ambitious store owner. Design your market layout from scratch by placing grocery shelves, refrigerated dairy coolers, bakery displays, and checkout lanes. Order wholesale stock, balance profit margins against customer satisfaction, hire helpful cashiers and restockers, and expand your humble corner store into a bustling mega-hypermarket!',
      coreFeatures: [
        { title: 'Modular Isometric Store Design', desc: 'Freely arrange shelving aisles, product displays, registers, and customer entrance pathways.' },
        { title: 'Wholesale Catalog & Inventory Stocking', desc: 'Order fresh produce, bakery goods, canned goods, and electronics to keep shelves packed.' },
        { title: 'Staff Recruitment & Payroll', desc: 'Hire friendly cashiers to eliminate checkout lines and energetic restockers to maintain full shelves.' },
        { title: 'Dynamic Customer AI & Moods', desc: 'Shoppers browse aisles, compare prices, and leave frustrated reviews if prices are set too high.' },
      ],
      specs: {
        category: 'Simulation / Retail Management',
        engine: 'React 19 / HTML5 Canvas / Vite',
        input: 'Mouse Click, Drag & Drop, Touch',
        platform: 'Desktop & Mobile Web',
        audio: 'Barcode Scanners, Store Ambience & Chimes',
        saveState: 'Local Market Layout & Financial Ledger',
      },
      whyPlay: [
        'Engages strategic business acumen: Balancing pricing, stock levels, and labor expenses.',
        'Delightful visual feedback watching bustling customer crowds fill their shopping baskets.',
        'Runs completely in your browser with zero installations and seamless auto-saving.',
      ],
    },
    about: {
      headline: 'Mastering the Logistics of Modern Retail Commerce',
      lore: 'In the heart of the retail district, competition is fierce. Starting with a modest storefront and an empty balance sheet, you build a community staple where customers always find fresh products and fair prices.',
      mechanics: 'The simulation runs an isometric pathfinding grid for shopper agents. Customers evaluate product availability, price satisfaction index, and checkout queue times before purchasing.',
      tech: 'Engineered with React 19, TypeScript, and isometric Canvas rendering with smooth camera panning and ledger analytics.',
      developmentNotes: 'Created to provide an authentic, deep retail business simulator with modern web performance.',
    },
    tutorial: {
      headline: 'Store Manager’s Handbook: Shelving, Pricing, Staff & Expansion',
      quickStart: [
        { step: '1', title: 'Place Your First Shelves', desc: 'Open the Build menu and place dry grocery shelving near the front entrance.' },
        { step: '2', title: 'Order Inventory Products', desc: 'Open the Wholesale Catalog to order cereal, bread, and milk to fill your empty shelves.' },
        { step: '3', title: 'Set Competitive Prices', desc: 'Adjust your markup in the Pricing panel; pricing too high drives customers away without buying.' },
        { step: '4', title: 'Hire Cashiers as Foot Traffic Grows', desc: 'Recruit a cashier so you aren’t trapped behind the register when the evening rush arrives.' },
      ],
      controls: [
        { key: 'Mouse Click / Drag', action: 'Place fixtures, stock shelves, ring up customers', device: 'Mouse / Touch', tip: 'Leave 2-tile wide walkways so customer shopping carts don’t bottleneck' },
      ],
      scoring: 'Market success is rated by daily gross revenue, store customer satisfaction rating, and market expansion level.',
      proTips: [
        'Avoid stockouts: If a shelf sits empty, shoppers leave negative store reviews that lower overall foot traffic.',
        'Place impulse buys near checkout: Position small candy and snack fixtures right beside registers for easy extra profits.',
        'Upgrade staff speed: Training your staff reduces cashier scan times by 40%, clearing long customer queues.',
      ],
      mistakes: [
        { mistake: 'Over-pricing products early on', fix: 'Keep initial markups around 20-30% until your store builds a loyal, 5-star customer base.' },
      ],
    },
    support: {
      headline: 'Shop Tycoon FAQs & Store Management Help',
      faqs: [
        { q: 'Why are customers leaving angry?', a: 'Customers leave dissatisfied if prices are set above the fair market ceiling or if the item they came for is out of stock.' },
        { q: 'Does my store progress save?', a: 'Yes! Your market layout, inventory ledger, and treasury funds are automatically saved in LocalStorage.' },
      ],
      troubleshooting: [
        { issue: 'Shoppers get stuck in corners', fix: 'Ensure shelves do not wall off the entrance or exit doors; leave open aisles for cart navigation.' },
      ],
    },
    terms: {
      headline: 'Terms & Conditions — Shop Tycoon',
      sections: [
        { title: '1. Entertainment License', content: 'Shop Tycoon is provided free for individual entertainment on Playzy.' },
      ],
    },
    privacy: {
      headline: 'Privacy Policy — Shop Tycoon',
      sections: [
        { title: '1. Zero Personal Data', content: 'Shop Tycoon collects no personal identification, email addresses, or payment details.' },
        { title: '2. Local Storage', content: 'All store configurations, ledger balances, and employee rosters are preserved in LocalStorage.' },
      ],
    },
  },
};

// Fallback generator for any game id that might be queried
export function getSubpageData(game, pageType) {
  const custom = GAME_DETAILS[game.id];
  if (custom && custom[pageType]) {
    return custom[pageType];
  }

  const title = game.title || game.id;
  const category = (game.category || 'arcade').charAt(0).toUpperCase() + (game.category || 'arcade').slice(1);

  if (pageType === 'what-is') {
    return {
      headline: `What is ${title}? Everything You Need to Know`,
      summary: `${title} is an engaging, free-to-play ${category.toLowerCase()} game available instantly in your browser on Playzy. Engineered with high-performance web graphics and responsive controls, it offers pure gameplay without long downloads, account walls, or app installations. Whether you are playing on a desktop PC, laptop, tablet, or smartphone, ${title} loads straight into the action with 60 FPS performance.`,
      coreFeatures: [
        { title: 'Instant Browser Play', desc: 'No downloads, installers, or plugins required. Click and play in seconds.' },
        { title: 'Responsive Controls', desc: 'Optimized for keyboard, mouse, and touchscreens across all modern browsers.' },
        { title: 'Session & High Score Tracking', desc: 'Your personal best runs, scores, and milestones are saved locally on your device.' },
        { title: 'Zero Clutter & Pure Fun', desc: 'Enjoy full-screen immersion without invasive popups or intrusive interruptions.' },
      ],
      specs: {
        category,
        engine: game.engine ? `${game.engine.toUpperCase()} Engine` : 'HTML5 Canvas',
        input: 'Keyboard, Mouse, Touch',
        platform: 'Web Browser (Desktop & Mobile)',
        audio: 'Synthesized Sound Effects',
        saveState: 'Local Browser Storage',
      },
      whyPlay: [
        'Completely free to play without microtransactions or forced paywalls.',
        'Runs smoothly on standard laptops and mobile devices.',
        'Part of the Playzy curated game collection.',
      ],
    };
  }

  if (pageType === 'about') {
    return {
      headline: `About ${title}: Design, Mechanics & Technology`,
      lore: `Designed around the core principles of immediate fun and deep mastery, ${title} challenges players to push their reflexes and strategy. Every mechanic is fine-tuned to deliver satisfying visual feedback, fair challenge curves, and high replayability.`,
      mechanics: `The game loop updates at 60 FPS, calculating player inputs, physics movement, obstacle generation, and score multiplier tracking with zero perceptible lag.`,
      tech: `Engineered using modern web technologies (${game.engine || 'HTML5'}), ${title} utilizes hardware acceleration to deliver buttery smooth frame rates and rapid load times.`,
      developmentNotes: `Curated and optimized as part of Playzy’s independent gaming catalogue by Dharmik Gohil.`,
    };
  }

  if (pageType === 'tutorial') {
    return {
      headline: `How to Play ${title}: Beginner Tutorial, Controls & Strategy Guide`,
      quickStart: [
        { step: '1', title: 'Launch and Read Controls', desc: 'Familiarize yourself with the primary action keys before starting your run.' },
        { step: '2', title: 'Master the Primary Action', desc: 'Focus on timing your inputs accurately rather than rushing.' },
        { step: '3', title: 'Build Your Multiplier', desc: 'Consistent performance without mistakes builds your combo score.' },
        { step: '4', title: 'Set a New Personal Record', desc: 'Learn obstacle rhythms to survive longer and beat your best distance or score.' },
      ],
      controls: [
        { key: 'Spacebar / Tap / Click', action: 'Primary Action', device: 'Keyboard / Mouse / Touch', tip: 'Use short, deliberate inputs' },
        { key: 'P / Esc', action: 'Pause / Resume', device: 'Keyboard', tip: 'Take a break during long sessions' },
      ],
      scoring: 'Score increases with distance, obstacles cleared, and active combo multipliers.',
      proTips: [
        'Stay calm: Panic tapping almost always leads to mistakes. Maintain a steady cadence.',
        'Read ahead: Don’t look directly at your player avatar—look toward the upcoming obstacles.',
      ],
      mistakes: [
        { mistake: 'Rushing inputs under pressure', fix: 'Focus on rhythm and give yourself room to react.' },
      ],
    };
  }

  if (pageType === 'support') {
    return {
      headline: `${title} Support, Help Center & FAQs`,
      faqs: [
        { q: `How do I play ${title}?`, a: `Click Play to start the game directly in your browser. Use the controls detailed in our Tutorial guide.` },
        { q: 'Is my high score saved?', a: 'Yes! Your best scores and stats are saved locally in your browser’s storage.' },
        { q: 'Why is the game lagging?', a: 'Make sure Hardware Acceleration is enabled in your browser settings and close heavy background tabs.' },
        { q: 'Can I report a bug or suggest a feature?', a: `Yes! Email us directly at ${SUPPORT_EMAIL} with the game title and details.` },
      ],
      troubleshooting: [
        { issue: 'Audio not playing', fix: 'Click anywhere on the game canvas to unlock your browser’s audio autoplay context.' },
        { issue: 'Controls not responding', fix: 'Click once inside the game area to focus the active window.' },
      ],
    };
  }

  if (pageType === 'terms') {
    return {
      headline: `Terms & Conditions — ${title}`,
      sections: [
        { title: '1. Agreement to Terms', content: `By playing ${title} on Playzy, you agree to these game-specific terms and the general Playzy Terms of Service.` },
        { title: '2. License to Play', content: `${title} is provided free of charge for your personal, non-commercial entertainment.` },
        { title: '3. Fair Play Policy', content: 'Players agree not to use automated scripts, bot engines, or memory hacks to forge leaderboards or mission achievements.' },
        { title: '4. Virtual Progress & Coins', content: 'In-game scores, levels, and virtual coins are purely cosmetic and have no real-world monetary value.' },
        { title: '5. Disclaimer of Warranty', content: `${title} is provided on an “as-is” basis without warranties of continuous availability or session persistence.` },
      ],
    };
  }

  if (pageType === 'privacy') {
    return {
      headline: `Privacy Policy — ${title}`,
      sections: [
        { title: '1. Information We Collect', content: `${title} collects no personal information, email addresses, phone numbers, or physical locations.` },
        { title: '2. Local Storage Usage', content: 'Game settings, sound toggles, and high score records are stored solely in your local browser’s LocalStorage.' },
        { title: '3. Zero Third-Party Trackers', content: 'The game canvas runs without third-party behavioral advertising trackers or cross-site surveillance.' },
        { title: '4. Children’s Privacy', content: `${title} is family-friendly and complies with COPPA and GDPR-K standards for players of all ages.` },
        { title: '5. Contact Information', content: `For privacy questions or data deletion requests, email ${SUPPORT_EMAIL}.` },
      ],
    };
  }

  return {};
}
