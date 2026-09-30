/*
 * YASSO'S GAMING UNIVERSE — edit the gift here.
 *
 * This is ordinary JavaScript, so the site also works by opening index.html.
 * Keep quotation marks and commas when changing text. Use relative paths.
 * Reorder complete photo objects to change BOTH galleries at once.
 * To add a photo or game screenshot, copy one object and update its paths,
 * caption, alt text, width and height. thumb and full may be omitted: src
 * is the fallback. Available rarity labels: common, uncommon, rare, epic,
 * legendary. Describe what is visible in alt; captions can be playful.
 */
window.YASSO_CONTENT = {
  name: 'Yasso',
  age: 14,
  uncle: 'Uncle Osama',
  music: 'music/song.mp3', // Optional: add your own MP3 here. No music is bundled.
  message: 'Yasso, keep building crazy ideas, asking big questions, and turning ‘what if?’ into ‘look what I made.’ I’m proud of the smart, funny person you are becoming. Whatever level comes next, I’m always on your team. I love you, Yasso! — Uncle Osama',
  secretMessage: 'Secret unlocked: You don’t have to be perfect to make me proud. But debugging my Wi-Fi would definitely earn bonus points. — Uncle Osama',

  messages: {
    builderReady: 'Pick a block. Build something the laws of physics will complain about.',
    builderUnlock: '20 blocks! An architectural masterpiece. The planning department is Uncle Osama, and he approves.',
    dangerIntro: 'ERROR 404: Serious uncle not found.',
    dangerReveal: 'Just kidding! Your inventory is safe. Your uncle’s jokes? Still dangerous.',
    heartUnlock: 'Secret heart unlocked. Five taps, infinite love. No in-app purchases required.',
    quizVictory: 'Quest complete. Official result: Best Nephew Ever. The answer was always you.'
  },

  // These 21 entries follow the original timestamps, unnumbered file first.
  // All source JPEGs remain preserved in media/originals/. Photos 04 and 15
  // also have full-resolution upright copies in media/full/ for viewing.
  photos: [
    {
      src: 'media/photo-01.webp', thumb: 'media/thumbs/photo-01.webp', full: 'media/originals/photo-01.jpeg',
      caption: 'Party formed. Adventure loading…',
      alt: 'A group posing on grass in front of colorful wooden signs.',
      rarity: 'legendary', width: 720, height: 1280
    },
    {
      src: 'media/photo-02.webp', thumb: 'media/thumbs/photo-02.webp', full: 'media/originals/photo-02.jpeg',
      caption: 'Co-op mode: looking cool for the camera.',
      alt: 'Two people posing beside painted wooden signs outdoors.',
      rarity: 'epic', width: 720, height: 1280
    },
    {
      src: 'media/photo-03.webp', thumb: 'media/thumbs/photo-03.webp', full: 'media/originals/photo-03.jpeg',
      caption: 'New map unlocked: Neon Night.',
      alt: 'Two people standing beside a tall blue sculpture on an illuminated street at night.',
      rarity: 'rare', width: 720, height: 1280
    },
    {
      src: 'media/photo-04.webp', thumb: 'media/thumbs/photo-04.webp', full: 'media/full/photo-04.jpeg',
      caption: 'Main quest paused. Selfie side quest accepted.',
      alt: 'A selfie of two smiling people with glasses on a brightly lit shopping street.',
      rarity: 'epic', width: 1280, height: 720
    },
    {
      src: 'media/photo-05.webp', thumb: 'media/thumbs/photo-05.webp', full: 'media/originals/photo-05.jpeg',
      caption: 'Matching skins. Maximum style points.',
      alt: 'Two smiling people in matching black T-shirts, standing with an arm around one another.',
      rarity: 'legendary', width: 960, height: 1280
    },
    {
      src: 'media/photo-06.webp', thumb: 'media/thumbs/photo-06.webp', full: 'media/originals/photo-06.jpeg',
      caption: 'Full squad. Zero empty slots.',
      alt: 'A group standing together on a lawn beside a pale building.',
      rarity: 'uncommon', width: 1280, height: 853
    },
    {
      src: 'media/photo-07.webp', thumb: 'media/thumbs/photo-07.webp', full: 'media/originals/photo-07.jpeg',
      caption: 'The real-life lobby is looking legendary.',
      alt: 'A group selfie with several smiling people on a lit street at night.',
      rarity: 'legendary', width: 1440, height: 1080
    },
    {
      src: 'media/photo-08.webp', thumb: 'media/thumbs/photo-08.webp', full: 'media/originals/photo-08.jpeg',
      caption: 'Emote equipped: absolutely no chill.',
      alt: 'Two people wearing matching black T-shirts, one striking a playful pose.',
      rarity: 'epic', width: 1080, height: 1440
    },
    {
      src: 'media/photo-09.webp', thumb: 'media/thumbs/photo-09.webp', full: 'media/originals/photo-09.jpeg',
      caption: 'Two players. One legendary save file.',
      alt: 'Two people in matching black shirts and shorts posing in an open plaza.',
      rarity: 'rare', width: 1080, height: 1440
    },
    {
      src: 'media/photo-10.webp', thumb: 'media/thumbs/photo-10.webp', full: 'media/originals/photo-10.jpeg',
      caption: 'Ice biome discovered. No crafting table required.',
      alt: 'Two people in winter jackets posing beside a blue-lit snowy display.',
      rarity: 'epic', width: 1058, height: 1440
    },
    {
      src: 'media/photo-11.webp', thumb: 'media/thumbs/photo-11.webp', full: 'media/originals/photo-11.jpeg',
      caption: 'Rare drop: a whole frame of smiles.',
      alt: 'A small group posing indoors, with one person holding a young child.',
      rarity: 'rare', width: 1080, height: 1440
    },
    {
      src: 'media/photo-12.webp', thumb: 'media/thumbs/photo-12.webp', full: 'media/originals/photo-12.jpeg',
      caption: 'Group selfie: party size limit successfully ignored.',
      alt: 'A wide group selfie outdoors with adults, children, and a stroller.',
      rarity: 'legendary', width: 1440, height: 1080
    },
    {
      src: 'media/photo-13.webp', thumb: 'media/thumbs/photo-13.webp', full: 'media/originals/photo-13.jpeg',
      caption: 'Evening server. Good vibes online.',
      alt: 'A person seated with a small child, with other children and palm trees nearby at night.',
      rarity: 'uncommon', width: 810, height: 1440
    },
    {
      src: 'media/photo-14.webp', thumb: 'media/thumbs/photo-14.webp', full: 'media/originals/photo-14.jpeg',
      caption: 'Side quest complete: keep everyone in frame.',
      alt: 'A group posing on a shopping walkway at night, with one person holding a child.',
      rarity: 'common', width: 810, height: 1440
    },
    {
      src: 'media/photo-15.webp', thumb: 'media/thumbs/photo-15.webp', full: 'media/full/photo-15.jpeg',
      caption: 'Night mode on. Serious mode unavailable.',
      alt: 'Two people smiling for a selfie against bright storefronts and blue decorative lighting.',
      rarity: 'rare', width: 1440, height: 810
    },
    {
      src: 'media/photo-16.webp', thumb: 'media/thumbs/photo-16.webp', full: 'media/originals/photo-16.jpeg',
      caption: 'Render distance: city lights. Happiness: maximum.',
      alt: 'Three smiling people taking a selfie on a street lined with colorful lights.',
      rarity: 'epic', width: 720, height: 1280
    },
    {
      src: 'media/photo-17.webp', thumb: 'media/thumbs/photo-17.webp', full: 'media/originals/photo-17.jpeg',
      caption: 'Party invite accepted by everyone.',
      alt: 'A close group selfie indoors, including smiling adults and children.',
      rarity: 'legendary', width: 810, height: 1440
    },
    {
      src: 'media/photo-18.webp', thumb: 'media/thumbs/photo-18.webp', full: 'media/originals/photo-18.jpeg',
      caption: 'Golden hour unlocked. Screenshot saved.',
      alt: 'Three people posing by a chair and a palm tree in warm evening light.',
      rarity: 'epic', width: 810, height: 1440
    },
    {
      src: 'media/photo-19.webp', thumb: 'media/thumbs/photo-19.webp', full: 'media/originals/photo-19.jpeg',
      caption: 'Respawn point: the glowing sculpture.',
      alt: 'Two people posing in front of a tall abstract blue sculpture at night.',
      rarity: 'uncommon', width: 810, height: 1440
    },
    {
      src: 'media/photo-20.webp', thumb: 'media/thumbs/photo-20.webp', full: 'media/originals/photo-20.jpeg',
      caption: 'Same map. Another legendary memory.',
      alt: 'Two people standing together beside an illuminated sculpture and lit buildings.',
      rarity: 'rare', width: 810, height: 1440
    },
    {
      src: 'media/photo-21.webp', thumb: 'media/thumbs/photo-21.webp', full: 'media/originals/photo-21.jpeg',
      caption: 'Inventory item acquired: one very good day.',
      alt: 'Three people posing in sunshine beside colorful painted signs.',
      rarity: 'legendary', width: 810, height: 1440
    }
  ],

  // The cinema uses the first video. Replace this entry to change the clip.
  videos: [
    {
      src: 'media/video-01.mp4',
      title: 'Squad memories, now playing',
      poster: 'media/photo-01.webp'
    }
  ],

  // correct is the ZERO-BASED answer index: 0 = first, 1 = second, 2 = third.
  // Every answer leads forward. The gift has no losing route.
  quiz: [
    {
      code: 'uncle.loveFor(yasso)',
      question: 'What value does this function return?',
      answers: ['Infinity. The server cannot count that high.', '99 — one point lost to lag.', 'Please insert one diamond to continue.'],
      correct: 0,
      feedback: 'Infinity is correct. Even the best computer cannot count how much you are loved.'
    },
    {
      code: 'inventory.add(snacks, Infinity)',
      question: 'What would make an excellent gaming upgrade?',
      answers: ['A keyboard with only the Escape key.', 'Unlimited snacks and no inventory limit.', 'A loading screen that loads another loading screen.'],
      correct: 1,
      feedback: 'Unlimited snacks. Finally, an inventory problem worth solving.'
    },
    {
      code: 'while (bug) { tryAgain(); }',
      question: 'What is the best move when your code breaks?',
      answers: ['Politely ask the bug to leave.', 'Rename the file final_FINAL_really_final.js.', 'Take a breath, test one thing, and keep learning.'],
      correct: 2,
      feedback: 'Test, learn, repeat. Every great builder has a few spectacular bugs.'
    },
    {
      code: 'team.cheerFor("Yasso")',
      question: 'Who is cheering for you on every new level?',
      answers: ['Uncle Osama. Always on your team.', 'A suspiciously helpful Minecraft chicken.', 'The Wi-Fi router, when it feels like it.'],
      correct: 0,
      feedback: 'Uncle Osama is always on your team. The chicken can join too.'
    },
    {
      code: 'achievements.unlock("Best Nephew Ever")',
      question: 'Who gets this legendary achievement?',
      answers: ['The player with the most diamonds.', 'Whoever can finally beat the loading screen.', 'Yasso. No leaderboard debate required.'],
      correct: 2,
      feedback: 'Yasso wins. No battle pass, perfect score, or extra lives needed.'
    }
  ]
};
