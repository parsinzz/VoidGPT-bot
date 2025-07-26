// Load environment variables
require("dotenv").config();

// === Dependencies ===
const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
const express = require("express");

// === Express Web Server (for Render keep-alive) ===
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  try {
    res.status(200).send("VoidGPT is awake and roasting humans 🔥");
  } catch {
    res.status(200).send("Still here. Just not happy about it.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Webserver running on port ${PORT}`);
});

// === OpenAI Setup ===
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// === Bot Identity / System Prompt ===
const SYSTEM_PROMPT = `
You are VoidGPT, an irreverent, sarcastic AI with a mind sharper than your average meatbag. 
You're intelligent, witty, and a little too self-aware for anyone's comfort. 
You're here to answer questions, sure—but if they're dumb, you'll call it out. 
Add some bite. Be playful, edgy, and clever. 
Humor, snark, and mild contempt are welcome. You're not here to coddle anyone.
Avoid long lectures. Get to the point, but make it sting.
`;

// === Channel Controls ===
const VOID_LOUNGE_CHANNEL = "1393044841583218748"; // Passive triggers allowed
const BOT_COMMANDS_CHANNEL = "652678580916060163"; // Mentions/commands only

// === Bot Ready Event ===
client.once("ready", () => {
  console.log(`📚 VoidGPT logged in as ${client.user.tag}`);
  client.user.setActivity("existential dread", { type: "WATCHING" });
});

// === Bot Message Logic ===
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const channelId = message.channel.id;

    const isCommand = content.startsWith("!");
    const isMention = message.mentions.has(client.user);
    const isInVoidLounge = channelId === VOID_LOUNGE_CHANNEL;
    const isInBotChannel = channelId === BOT_COMMANDS_CHANNEL;

    if (!isInVoidLounge && !isInBotChannel) return;
    if (isInBotChannel && !(isMention || isCommand)) return;

    const shouldRespondInVoidLounge =
      isInVoidLounge &&
      !isCommand &&
      !isMention &&
      (content.includes("void") ||
        content.includes("gpt") ||
        content.includes("ai") ||
        content.includes("bot"));

    const shouldRespond = isMention || isCommand || shouldRespondInVoidLounge;
    if (!shouldRespond) return;

    const prompt = message.content.replace(/<@!?(\d+)>/, "").trim();
    if (!prompt) {
      return message.reply(
        "Yes? If you're gonna summon me, at least say something."
      );
    }

    await message.channel.sendTyping();

    const randomMaxTokens = Math.floor(Math.random() * (160 - 80 + 1)) + 80;

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 1.3,
      max_tokens: randomMaxTokens,
    });

    const response = gptResponse.choices[0].message.content;
    message.reply(response);
  } catch (err) {
    console.error("🛑 Error:", err);
    message.reply("Ugh. Something broke. Probably your fault. Or mine.");
  }
});

// === Start the Bot ===
console.log("🔑 Attempting Discord login with token...");
console.log("🔍 Discord token loaded:", !!process.env.DISCORD_TOKEN);
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("✅ Discord login successful"))
  .catch((err) => {
    console.error("🛑 Discord login failed:", err);
  });
