// server.js
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const OpenAI = require("openai");
require('dotenv').config();

// Owner username
const LISTEN_USER = process.env.LISTEN_USER || 'MinoMark'; 
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

const openai = new OpenAI({ apiKey: OPENAI_KEY });

// Create bot
const bot = mineflayer.createBot({
  host: "donutsmp.net", // Your Java Edition server IP
  username: "Mark"       // Bot name
  // port not needed for Java Edition (default 25565)
});

bot.loadPlugin(pathfinder);

// Bot connected
bot.once('spawn', () => {
  console.log('✅ Bot connected!');
  bot.chat(`Hello! I only listen to ${LISTEN_USER}.`);
});

// Helper function: only listen to owner
function isFromOwner(username) {
  if (!username) return false;
  return username.toLowerCase() === LISTEN_USER.toLowerCase();
}

// Handle chat
bot.on('chat', async (username, message) => {
  if (!isFromOwner(username)) {
    console.log(`Ignored message from ${username}: ${message}`);
    return;
  }

  console.log(`Owner (${username}): ${message}`);

  // Command: "come"
  if (message.trim().toLowerCase() === 'come') {
    const player = bot.players[username]?.entity;
    if (!player) {
      bot.chat("I can't see you, owner.");
      return;
    }
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new GoalNear(player.position.x, player.position.y, player.position.z, 1));
    bot.chat("On my way, owner!");
    return;
  }

  // Command: "jump"
  if (message.trim().toLowerCase() === 'jump') {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 400);
    bot.chat("Boing!");
    return;
  }

  // Command: "ai <message>"
  if (message.trim().toLowerCase().startsWith('ai ')) {
    const prompt = message.trim().slice(3).trim();
    bot.chat('Thinking...');
    try {
      const reply = await getAIResponse(prompt);
      if (reply && reply.trim().length > 0) bot.chat(reply);
      else bot.chat("Sorry, I couldn't think of a reply.");
    } catch (err) {
      console.error('AI error:', err);
      bot.chat("I had an error contacting the AI.");
    }
    return;
  }

  // Default acknowledgement
  bot.chat(`I heard you, ${username}.`);
});

// OpenAI function
async function getAIResponse(prompt) {
  if (!OPENAI_KEY) throw new Error('OpenAI key not set.');
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message.content;
}
