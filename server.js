const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const OpenAI = require("openai");
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === SETUP YOUR SERVER ===
const bot = mineflayer.createBot({
  host: "donutsmp.net", // e.g. play.myserver.net
  port: 25565, // default Java Edition port
  username: "Marks" // Bot name
});

bot.loadPlugin(pathfinder);

// === On join ===
bot.once("spawn", () => {
  console.log("✅ Bot connected!");
  bot.chat("Hello! I'm your AI bot 🤖");
});

// === On player chat ===
bot.on("chat", async (username, message) => {
  if (username === bot.username) return;

  console.log(`${username}: ${message}`);

  // Simple movement command
  if (message.startsWith("come")) {
    const player = bot.players[username]?.entity;
    if (!player) return bot.chat("I can’t see you!");
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new GoalNear(player.position.x, player.position.y, player.position.z, 1));
    return bot.chat("I'm coming to you!");
  }

  // Ask AI a question
  if (message.startsWith("ai")) {
    const prompt = message.replace("ai", "").trim();
    bot.chat("Thinking...");
    const reply = await getAIResponse(prompt);
    bot.chat(reply);
  }
});

async function getAIResponse(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error(err);
    return "Sorry, I had an error thinking 😅";
  }
}
