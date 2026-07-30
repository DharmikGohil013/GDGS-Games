const colors = ['coral', 'blue', 'green', 'purple', 'gold'];
const engines = ['phaser', 'pixi', 'three', 'html5', 'canvas'];
const icons = ['stack', 'car', 'snake', 'ball', 'sword', 'gun', 'card', 'puzzle', 'runner', 'fighter', 'ship', 'star'];

const categoriesList = [
  'trending', 'puzzle', 'racing', 'runner', 'arcade', 'io', 'sports', 'physics', 
  'strategy', 'shooter', 'card', 'board', 'word', 'trivia', 'platformer', 
  'fighting', 'simulation', 'cooking', 'music', 'horror', 'casual', 'multiplayer', 
  '3d', 'retro', 'educational'
];

const adjectives = ['Super', 'Mega', 'Hyper', 'Crazy', 'Epic', 'Neon', 'Turbo', 'Cosmic', 'Galactic', 'Magic', 'Pixel', 'Blocky', 'Speed', 'Ghost', 'Dark', 'Light', 'Funky', 'Retro', 'Action', 'Battle', 'Dream', 'Happy', 'Angry', 'Tiny', 'Giant', 'Cyber'];
const nouns = ['Clash', 'Rush', 'Dash', 'Racer', 'Fighter', 'Builder', 'Crusher', 'Quest', 'Adventure', 'Ninja', 'Zombie', 'Knight', 'Wizard', 'Dragon', 'Hero', 'Legend', 'Master', 'King', 'Queen', 'Slayer', 'Hunter', 'Runner', 'Jumper', 'Sniper', 'Pilot', 'Driver'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPlays() {
  const value = Math.random();
  if (value > 0.9) return (Math.random() * 40 + 10).toFixed(1) + 'M';
  if (value > 0.6) return (Math.random() * 9 + 1).toFixed(1) + 'M';
  return Math.floor(Math.random() * 900 + 10) + 'K';
}

function getRandomRating() {
  return Number((Math.random() * 1.0 + 4.0).toFixed(1));
}

function generateGames() {
  const generatedGames = [];
  let idCounter = 1;

  // Playable games
  const playableGames = [
    { id: 'tower-stacker', title: 'Tower Stacker', category: 'arcade', isPlayable: true, plays: '12.5M', rating: 4.8, color: 'coral', iconType: 'stack', engine: 'phaser' },
    { id: 'neon-snake', title: 'Neon Snake', category: 'arcade', isPlayable: true, plays: '8.2M', rating: 4.7, color: 'green', iconType: 'snake', engine: 'canvas' },
    { id: 'block-merge', title: 'Block Merge', category: 'puzzle', isPlayable: true, plays: '15.1M', rating: 4.9, color: 'purple', iconType: 'puzzle', engine: 'html5' },
    { id: 'turbo-drift', title: 'Turbo Drift', category: 'racing', isPlayable: true, plays: '22.3M', rating: 4.6, color: 'blue', iconType: 'car', engine: 'three' },
    { id: 'ball-drop', title: 'Ball Drop', category: 'arcade', isPlayable: true, plays: '5.6M', rating: 4.5, color: 'coral', iconType: 'ball', engine: 'pixi' },
    { id: 'city-sprint', title: 'City Sprint', category: 'runner', isPlayable: true, plays: '18.9M', rating: 4.8, color: 'gold', iconType: 'runner', engine: 'three' }
  ];

  generatedGames.push(...playableGames);

  categoriesList.forEach(cat => {
    // 40+ games per category
    for (let i = 0; i < 41; i++) {
      const adj = getRandomItem(adjectives);
      const noun = getRandomItem(nouns);
      const title = `${adj} ${noun}`;
      const idStr = title.toLowerCase().replace(/\s+/g, '-') + '-' + idCounter++;
      
      generatedGames.push({
        id: idStr,
        title: title,
        category: cat,
        plays: getRandomPlays(),
        rating: getRandomRating(),
        color: getRandomItem(colors),
        iconType: getRandomItem(icons),
        isPlayable: false,
        engine: getRandomItem(engines)
      });
    }
  });

  return generatedGames;
}

export const games = generateGames();
export default games;
