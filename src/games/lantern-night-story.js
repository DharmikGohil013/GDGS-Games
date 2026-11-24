// ─── Lantern Night: story data ───
// An original folktale told across four chapters. On Daeboreum, the first full
// moon of the lunar year, the moon rises dark: the dokkaebi have borrowed its
// light. Dal carries Grandmother's lantern up the mountain to bring it home.
//
// Scripts are plain arrays the engine plays in order:
//   { who, text }                         a line of dialogue
//   { who, text, choices: [{ label, effect(s), then: [...] }] }
//   { when: (s) => bool, ...line }        only plays when the condition holds
//   { action: 'ssireum', win: [...], lose: [...] }   the wrestling minigame
// `s` is the shared story state: { flames, mercy, nuts, lost, choices, ... }.

export const SPEAKERS = {
  narrator: { name: '', tone: 'narrator' },
  dal: { name: 'Dal', tone: 'dal' },
  grandma: { name: 'Grandmother Ok', tone: 'grandma' },
  ttukttak: { name: 'Ttukttak', tone: 'goblin' },
  bawi: { name: 'Bawi', tone: 'goblin' },
  goldhorn: { name: 'Gold-Horn', tone: 'chief' },
};

export const CHAPTERS = [
  {
    id: 'village',
    numeral: 'Prologue',
    title: 'Dalgol Village',
    theme: 'village',
    length: 74,
    flames: 3,
    need: 3,
    wisps: 1,
    posts: 1,
    drain: 0.55,
    wispSpeed: 1.7,
    npc: 'grandma',
    intro: [
      { who: 'narrator', text: 'The first full moon of the year rose over Dalgol… and gave no light at all.' },
      { who: 'grandma', text: 'Dal! Look up. The moon came up hollow. Not a sliver of silver on the rooftops.' },
      { who: 'grandma', text: 'Dokkaebi mischief, mark my words. They have borrowed the moonlight and scattered it about like spilled rice.' },
      { who: 'grandma', text: 'Take my lantern. Gather the moon-flames, and keep the oil burning. The dark out there is hungry.' },
      { who: 'grandma', text: 'And take these walnuts. If the blue dokkaebi-fires crowd you, crack one. Nothing frightens a spirit like a good loud CRACK.' },
      { who: 'dal', text: 'Three flames glimmer between the houses. I will start there.' },
    ],
    outro: [
      { who: 'narrator', text: 'Three flames now burned in the lantern. Overhead, the moon blinked open: a thin silver eyelash.' },
      { who: 'grandma', text: 'There! It remembers itself. The rest of its light will be up the mountain, past the red gate.' },
      { who: 'grandma', text: 'Be polite to the dokkaebi, child. They are tricksters, not monsters, and they never forget a kindness… or an insult.' },
      { who: 'dal', text: 'I will bring the whole moon home, Grandmother.' },
    ],
  },
  {
    id: 'bamboo',
    numeral: 'Chapter I',
    title: 'The Whispering Bamboo',
    theme: 'bamboo',
    length: 112,
    flames: 6,
    need: 4,
    wisps: 5,
    posts: 2,
    drain: 0.9,
    wispSpeed: 2.2,
    npc: 'ttukttak',
    intro: [
      { who: 'narrator', text: 'Beyond the red gate the bamboo grew so thick that the wind had to whisper to get through.' },
      { who: 'dal', text: 'Blue fires between the stalks… dokkaebi-bul. If they touch the lantern, they drink its oil.' },
      { who: 'dal', text: 'Lantern posts along the path can refill the oil. I should light every one I find.' },
    ],
    outro: [
      { who: 'narrator', text: 'By the gate, a small dokkaebi with one crooked horn was juggling a moon-flame from hand to hand.' },
      { who: 'ttukttak', text: 'Ack! A lantern-child! Finders keepers, that is the dokkaebi law!' },
      { who: 'ttukttak', text: 'Just one flame. One! It is so warm, and my hollow is so very cold…' },
      {
        who: 'dal',
        text: 'What should I do?',
        choices: [
          {
            label: 'Let him keep one flame',
            effect: (s) => { s.mercy += 1; s.flames = Math.max(0, s.flames - 1); s.choices.sparedTtukttak = true; },
            then: [
              { who: 'ttukttak', text: 'Truly? Truly-truly? Then Ttukttak owes you a favour, lantern-child.' },
              { who: 'ttukttak', text: 'Dokkaebi ALWAYS pay their debts. Ask anyone. Ask the moon!' },
            ],
          },
          {
            label: 'Take it back, it belongs to the moon',
            effect: (s) => { s.choices.sparedTtukttak = false; },
            then: [
              { who: 'dal', text: 'Sorry, little one. The whole village is waiting for this light.' },
              { who: 'ttukttak', text: 'Hmph! FINE. But the Chief will not be so easy, you will see!' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cairn',
    numeral: 'Chapter II',
    title: 'Cairn Pass',
    theme: 'cairn',
    length: 122,
    flames: 6,
    need: 4,
    wisps: 8,
    posts: 2,
    drain: 1.05,
    wispSpeed: 2.6,
    npc: 'bawi',
    intro: [
      { who: 'narrator', text: 'Travellers pile their wishes here, one stone at a time. Tonight the stones are cold, and the fires are many.' },
      { who: 'dal', text: 'A seonangdang tree, hung with ribbons. Grandmother says to add a stone for a safe road.' },
      { who: 'dal', text: 'There is a bridge over the gorge ahead. Whatever waits on it, I need four more flames first.' },
    ],
    outro: [
      { who: 'narrator', text: 'Past the bridge, a dokkaebi as wide as a millstone sat cross-legged in front of the gate.' },
      { who: 'bawi', text: 'HALT! Nobody passes Bawi’s gate without a contest!' },
      { when: (s) => s.choices.sparedTtukttak, who: 'ttukttak', text: '(from the bushes) Psst! Bawi! This one is alright! Gave me a flame and everything!' },
      { when: (s) => s.choices.sparedTtukttak, who: 'bawi', text: 'Hm. Ttukttak vouches for you? Then I will give you a choice, at least.' },
      { who: 'bawi', text: 'Wrestle me! Ssireum! Or… sing me something. It has been a long, boring century.' },
      {
        who: 'dal',
        text: 'How do I answer Bawi?',
        choices: [
          {
            label: 'Wrestle him (ssireum)',
            effect: (s) => { s.choices.wrestledBawi = true; },
            then: [
              { who: 'bawi', text: 'HA! Grab the satba belt, little lantern. Throw me twice and I will be impressed.' },
              {
                action: 'ssireum',
                win: [
                  { who: 'bawi', text: 'OOF! A fine throw! My grandmother could not have done better, and she threw a bear once.' },
                  { who: 'bawi', text: 'Here. Take this moon-flame. I was sitting on it to keep it warm.' },
                  { do: (s) => { s.flames += 1; s.choices.wonSsireum = true; } },
                ],
                lose: [
                  { who: 'bawi', text: 'HAH! Too light, too light! Eat more rice cakes.' },
                  { who: 'bawi', text: 'Go on anyway. You grabbed the belt like you meant it. That is worth something.' },
                  { do: (s) => { s.choices.wonSsireum = false; } },
                ],
              },
            ],
          },
          {
            label: 'Sing him a song',
            effect: (s) => { s.mercy += 1; s.choices.sangForBawi = true; },
            then: [
              { who: 'dal', text: '(You sing the moon-greeting song the village children sing on Daeboreum.)' },
              { who: 'bawi', text: '…' },
              { who: 'bawi', text: 'That was the song my mother hummed. Go on. Go on, before I cry all over my own gate.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hollow',
    numeral: 'Chapter III',
    title: 'The Hollow of Gold-Horn',
    theme: 'hollow',
    length: 112,
    flames: 5,
    need: 3,
    wisps: 10,
    posts: 2,
    drain: 1.15,
    wispSpeed: 2.9,
    npc: 'goldhorn',
    intro: [
      { who: 'narrator', text: 'At the mountain’s heart stood a hollow tree, and every dokkaebi-fire in the land circled it like moths.' },
      { who: 'dal', text: 'The moon is half awake now. The last of its light must be here.' },
    ],
    outro: [
      { who: 'narrator', text: 'Beneath the hollow tree waited the Chief of all dokkaebi, his golden horns bright as candle flames.' },
      { who: 'goldhorn', text: 'So. The lantern-child who walks through my fires.' },
      { when: (s) => s.choices.sparedTtukttak && s.choices.sangForBawi, who: 'goldhorn', text: 'Ttukttak and Bawi have talked of nothing else. A flame given away. A song for an old grump.' },
      { who: 'goldhorn', text: 'Do you know why we took the moon? Every Daeboreum you light your lanterns, beat your drums and crack your nuts. To chase US away.' },
      { who: 'goldhorn', text: 'For once, we wanted to see the festival without being driven off. So we kept its light for ourselves.' },
      {
        who: 'dal',
        text: 'What do you say to the Chief?',
        choices: [
          {
            label: 'Demand the moon back',
            effect: (s) => { s.choices.invitedChief = false; },
            then: [
              { who: 'dal', text: 'The moon belongs to everyone. Give back what you took.' },
              { who: 'goldhorn', text: 'Bold. Very well, lantern-child. We shall see how much of it your lantern can carry.' },
            ],
          },
          {
            label: 'Invite the dokkaebi to the festival',
            effect: (s) => { s.mercy += 1; s.choices.invitedChief = true; },
            then: [
              { who: 'dal', text: 'Then come down the mountain with me. Dance with us. Nobody will crack a nut at you. I promise.' },
              { who: 'goldhorn', text: '…An invitation. In three hundred years, no one has ever asked.' },
            ],
          },
        ],
      },
    ],
  },
];

export const TOTAL_FLAMES = CHAPTERS.reduce((sum, ch) => sum + ch.flames, 0);
export const MAX_MERCY = 3;

export const ENDINGS = {
  'moon-feast': {
    title: 'The Moon Feast',
    bonus: 1200,
    text: [
      'The moon rose full and blazing over Dalgol, and behind Dal came a parade of blue fires down the mountain path.',
      'The dokkaebi danced at the festival until dawn. Bawi won every wrestling match; Ttukttak ate eleven rice cakes.',
      'Before leaving, Gold-Horn pressed his studded club into Dal’s hands. “Knock it twice if you ever need us.”',
      'Every Daeboreum since, Dalgol sets one extra table, and nobody cracks a nut until the dokkaebi have eaten.',
    ],
  },
  'lantern-keeper': {
    title: 'The Lantern Keeper',
    bonus: 700,
    text: [
      'Dal carried the moon’s light down the mountain, and the moon swallowed it like a long drink of water.',
      'Silver poured over the rooftops. The drums beat, the nuts cracked, and the blue fires stayed far up the slope.',
      'The village made Dal its youngest lantern keeper. On quiet nights, Dal still wonders what the dokkaebi wanted.',
    ],
  },
  'goblin-friend': {
    title: 'A Friend of Goblins',
    bonus: 700,
    text: [
      'Only half the moon came home that night. It hung over Dalgol like a lantern with its shutter half closed.',
      'But down the path came the dokkaebi, each carrying a blue fire, and they hung them from every eave in the village.',
      '“A half-moon year,” Grandmother Ok called it afterwards. “The best one I ever saw.”',
    ],
  },
  'long-night': {
    title: 'The Long Night',
    bonus: 200,
    text: [
      'The moon stayed dim. Dal walked home with a lantern that was not quite enough, and the festival ended early.',
      'Grandmother Ok wrapped Dal in a blanket. “The moon is patient. So are dokkaebi. Try again next year.”',
      'Somewhere on the mountain, a blue fire flickered, as if it were waiting for exactly that.',
    ],
  },
};

/**
 * Decide which ending the player earned.
 * @param {object} s story state at the end of Chapter III
 *   s.flames        moon-flames carried home (0 to TOTAL_FLAMES + 1)
 *   s.mercy         kind choices made (0 to MAX_MERCY)
 *   s.lost          times the dark swallowed the lantern
 *   s.choices       { sparedTtukttak, sangForBawi, wonSsireum, invitedChief }
 * @returns {'moon-feast'|'lantern-keeper'|'goblin-friend'|'long-night'}
 */
export function computeEnding(s) {
  // TODO(human): choose the ending from flames, mercy and the choices made.
  return 'lantern-keeper';
}
