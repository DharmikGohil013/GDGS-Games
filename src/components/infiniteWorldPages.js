// ─── Infinite World: Privacy Policy, Terms and Support ───
// Infinite World is the one Playzy game with accounts and a server, so it has
// its own policy pages. Keep them in step with the game server (accounts,
// worlds, co-op) whenever what it stores changes.

const SUPPORT_EMAIL = 'dharmikgohil.work@gmail.com';
const UPDATED = 'October 20, 2026';
const GAME_LINK = '<a href="/games/infinite-world/">Infinite World</a>';

const mail = (subject) =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Infinite World — ${subject}`)}`;

function shell(badge, title, subtitle, body) {
  const page = document.createElement('div');
  page.className = 'page-content';
  page.innerHTML = `
    <div class="page-hero">
      <span class="page-badge">${badge}</span>
      <h1 class="page-title">${title}</h1>
      <p class="page-subtitle">${subtitle}</p>
    </div>
    <div class="page-section legal-content">${body}</div>
    <div class="page-section iw-legal-nav">
      <a href="/games/infinite-world/privacy/">Privacy</a>
      <a href="/games/infinite-world/terms/">Terms</a>
      <a href="/games/infinite-world/support/">Support</a>
      <a href="/games/infinite-world/">Play Infinite World →</a>
    </div>
  `;
  return page;
}

export function createIWPrivacyPage() {
  return shell(
    'Infinite World',
    'Privacy Policy',
    `Last updated: ${UPDATED}`,
    `
      <div class="legal-block">
        <h2>1. Who we are</h2>
        <p>${GAME_LINK} is a multiplayer 3D city builder on Playzy, run by Dharmik Gohil (“we”, “us”). It is played at <strong>world.playzyy.me</strong> and inside <strong>playzyy.me</strong>. This policy covers only Infinite World. The rest of Playzy is covered by the <a href="/privacy/">Playzy Privacy Policy</a>.</p>
        <p>Questions: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      </div>

      <div class="legal-block">
        <h2>2. What we collect</h2>
        <h3>2.1 When you create an account</h3>
        <ul>
          <li><strong>Username</strong> — the name you pick or roll. Other players can see it.</li>
          <li><strong>Birthday</strong> — used only as your login key. We never store the date itself: we store a one-way, salted hash of it, so we cannot read it back.</li>
          <li><strong>Player ID</strong> — a random code (like <code>K7QM-4X2P</code>) we create so friends can add you.</li>
        </ul>
        <p>We do <strong>not</strong> ask for your email, phone number, real name, location or payment details.</p>

        <h3>2.2 When you play</h3>
        <ul>
          <li><strong>Your worlds</strong> — world names, whether they are public or private, and everything built in them.</li>
          <li><strong>Partners</strong> — which players are members of each world.</li>
          <li><strong>Progress</strong> — your coins, missions and settings in each world.</li>
          <li><strong>Live cursor</strong> — where your pointer is, sent to partners in the same world while you play. It is passed along live and is not saved.</li>
        </ul>

        <h3>2.3 Technical data</h3>
        <ul>
          <li><strong>Login token</strong> — a random code saved in your browser’s local storage so you stay logged in. Logging out deletes it.</li>
          <li><strong>IP address</strong> — used briefly to limit repeated login attempts, and recorded in standard server logs that we use only for security and fixing problems.</li>
          <li><strong>Backups</strong> — if you use the Backups menu, those copies stay in your own browser and are not sent to us.</li>
        </ul>
        <p>The game itself has no ads, no analytics and no tracking cookies. When you play inside playzyy.me, that page has its own analytics as described in the <a href="/privacy/">Playzy Privacy Policy</a>.</p>
      </div>

      <div class="legal-block">
        <h2>3. Who can see what</h2>
        <ul>
          <li><strong>Private worlds</strong> never appear in search. Only the owner and invited partners can open them.</li>
          <li><strong>Public worlds</strong> can be found in Explore. Anyone can watch them live (but not edit), and see the world name, the owner’s username and the population.</li>
          <li><strong>Partners</strong> see your username, your live cursor and your edits in worlds you share.</li>
          <li>Your birthday is never shown to anyone.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>4. How we use it</h2>
        <p>Only to run the game: log you in, save and sync your worlds, let partners build with you, show public worlds, prevent abuse, and answer support requests. We do not sell or rent your data, and we do not use it for advertising.</p>
      </div>

      <div class="legal-block">
        <h2>5. Where it is stored and for how long</h2>
        <p>Game data is stored in a database on our own server. We keep it while your account exists. When an owner deletes a world, its buildings and progress are deleted straight away. To delete your whole account and everything in it, email us from the Support page — we do this within 30 days.</p>
      </div>

      <div class="legal-block">
        <h2>6. Security</h2>
        <p>Birthdays are stored only as salted hashes, login attempts are rate-limited, and private worlds are checked on every request. Because your birthday works as your login key, keep your username private if you are worried about someone guessing it. No online service is perfectly secure.</p>
      </div>

      <div class="legal-block">
        <h2>7. Children</h2>
        <p>Infinite World is suitable for all ages but is not directed at children under 13. If you are under 13 — or under the age of digital consent where you live — please play with a parent’s or guardian’s permission. Parents can ask us to delete a child’s account at <a href="${mail('Delete a child account')}">${SUPPORT_EMAIL}</a>.</p>
      </div>

      <div class="legal-block">
        <h2>8. Your choices</h2>
        <ul>
          <li>Make any world you own private at any time from the Share panel.</li>
          <li>Remove partners, or leave a world you joined.</li>
          <li>Ask us for a copy of your data, a correction, or deletion.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>9. Changes</h2>
        <p>If we change this policy we will update the date above. Big changes will also be announced in the game.</p>
      </div>
    `
  );
}

export function createIWTermsPage() {
  return shell(
    'Infinite World',
    'Terms & Conditions',
    `Last updated: ${UPDATED}`,
    `
      <div class="legal-block">
        <h2>1. Agreement</h2>
        <p>By creating an account or playing ${GAME_LINK}, you agree to these terms and the <a href="/games/infinite-world/privacy/">Infinite World Privacy Policy</a>. If you do not agree, please do not use the game. These terms add to the general <a href="/terms/">Playzy Terms</a>.</p>
      </div>

      <div class="legal-block">
        <h2>2. Your account</h2>
        <ul>
          <li>Your username and birthday are your login. Remember both — we cannot show you your birthday or reset it.</li>
          <li>You are responsible for what happens under your account.</li>
          <li>Usernames must not impersonate others or be offensive. We may rename or remove accounts that break this.</li>
          <li>If you are under 13, or under the age of digital consent where you live, you need a parent’s or guardian’s permission.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>3. Worlds and partners</h2>
        <ul>
          <li>World names are unique and first come, first served. Offensive or misleading names may be changed or removed.</li>
          <li>The owner decides who joins. Partners can build, demolish and clear the whole world, so only invite people you trust. We cannot restore a world a partner removed.</li>
          <li>Public worlds can be watched by anyone. Do not build or name anything hateful, sexual, violent, or that shares someone’s personal information.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>4. Fair play</h2>
        <p>Do not cheat, use bots or scripts, attack or overload the servers, try to get into worlds or accounts that are not yours, or harass other players. We may remove content, worlds or accounts that break these rules.</p>
      </div>

      <div class="legal-block">
        <h2>5. Coins and progress</h2>
        <p>Coins, levels and rewards are part of the game only. They cannot be bought, sold or exchanged, and have no real-world value.</p>
      </div>

      <div class="legal-block">
        <h2>6. The game is provided “as is”</h2>
        <p>We work to keep Infinite World online and your worlds safe, but the game is free and provided without warranties. It may change, be interrupted, or have bugs, and in rare cases progress may be lost. To the extent the law allows, we are not liable for indirect losses or for lost game data.</p>
      </div>

      <div class="legal-block">
        <h2>7. Ending your account</h2>
        <p>You can stop playing at any time and ask us to delete your account. We may suspend or remove accounts that break these terms.</p>
      </div>

      <div class="legal-block">
        <h2>8. Changes and law</h2>
        <p>We may update these terms and will change the date above when we do. These terms are governed by the laws of India.</p>
        <p>Questions: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      </div>
    `
  );
}

const FAQ = [
  ['I forgot my username or birthday', 'Your login is your username plus your birthday, and we cannot see birthdays. Email us your username (or the name of a world you own) and we will help you get back in.'],
  ['How do I play with a friend?', 'Open your world, tap the Share button, and send the invite code or link. Or add your friend by their player ID (shown under their name in the worlds list).'],
  ['Private or public — what’s the difference?', 'Private worlds are hidden: only you and your partners can open them. Public worlds appear in Explore and anyone can watch them live, but only partners can build.'],
  ['A partner broke my city', 'Open Share and remove them. Partners can build and demolish freely, so only invite people you trust.'],
  ['The game says “Offline — reconnecting”', 'Your edits are kept and sent as soon as the connection is back. If it lasts more than a minute, reload the page.'],
  ['Report a player or a world', 'Email us the world name and the player’s username, with a screenshot if you can.'],
  ['Delete my account', 'Email us from the address below with your username. We delete the account, its worlds and progress within 30 days.'],
];

export function createIWSupportPage() {
  const page = shell(
    'Infinite World',
    'Support',
    'Help with your account, your worlds and playing together.',
    `
      <div class="iw-support-actions">
        <a class="btn-primary" href="${mail('Help')}">Email support</a>
        <a class="iw-support-chip" href="${mail('Bug report')}">Report a bug</a>
        <a class="iw-support-chip" href="${mail('Report a player or world')}">Report a player</a>
        <a class="iw-support-chip" href="${mail('Delete my account')}">Delete my account</a>
      </div>
      <p class="iw-support-email">Email: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> · we usually reply within 24–48 hours.</p>

      <div class="legal-block">
        <h2>Common questions</h2>
        ${FAQ.map(([q, a]) => `<details class="iw-faq"><summary>${q}</summary><p>${a}</p></details>`).join('')}
      </div>

      <div class="legal-block">
        <h2>When you email us</h2>
        <ul>
          <li>Your username (never your birthday).</li>
          <li>The world name, if it is about a world.</li>
          <li>What happened, and your device and browser.</li>
        </ul>
      </div>
    `
  );
  return page;
}

export const IW_PAGE_SEO = {
  privacy: {
    title: 'Infinite World Privacy Policy | Playzy',
    description: 'What Infinite World stores — username, a hashed birthday, your worlds and progress — who can see it, and how to delete it.',
    url: '/games/infinite-world/privacy/',
  },
  terms: {
    title: 'Infinite World Terms & Conditions | Playzy',
    description: 'Rules for Infinite World accounts, worlds, partners, public worlds and fair play.',
    url: '/games/infinite-world/terms/',
  },
  support: {
    title: 'Infinite World Support | Playzy',
    description: 'Help with Infinite World: logging in, inviting partners, private and public worlds, reporting players and deleting your account.',
    url: '/games/infinite-world/support/',
  },
};
