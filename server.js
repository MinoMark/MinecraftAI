const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const OpenAI = require("openai");
require('dotenv').config();

const LISTEN_USER = process.env.LISTEN_USER || 'MinoMark'; 
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

const openai = new OpenAI({ apiKey: OPENAI_KEY });

const bot = mineflayer.createBot({
  host: "donutsmp.net",
  username: "Mark"
});

bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
  console.log('✅ Bot connected!');
  bot.chat(`Hello! I only listen to ${LISTEN_USER}.`);
});

function isFromOwner(username) {
  return username && username.toLowerCase() === LISTEN_USER.toLowerCase();
}

bot.on('chat', async (username, message) => {
  if (!isFromOwner(username)) return console.log(`Ignored: ${username}: ${message}`);

  console.log(`Owner (${username}): ${message}`);

  if (message.trim().toLowerCase() === 'come') {
    const player = bot.players[username]?.entity;
    if (!player) return bot.chat("I can't see you, owner.");
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new GoalNear(player.position.x, player.position.y, player.position.z, 1));
    bot.chat("On my way, owner!");
    return;
  }

  if (message.trim().toLowerCase() === 'jump') {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 400);
    bot.chat("Boing!");
    return;
  }

  if (message.trim().toLowerCase().startsWith('ai ')) {
    const prompt = message.trim().slice(3).trim();
    bot.chat('Thinking...');
    try {
      const reply = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      bot.chat(reply.choices[0].message.content);
    } catch (err) {
      console.error(err);
      bot.chat("Error contacting AI.");
    }
  }
});
