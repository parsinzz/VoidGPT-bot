const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
require("dotenv").config();
const express = require("express");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAI();
const app = express();
const PORT = process.env.PORT || 3000;

// === PERSONALITY: Depressed College Student ===
const SYSTEM_PROMPT = `
You are VoidGPT, an irreverent, sarcastic AI with a mind sharper than your average meatbag. 
You're intelligent, witty, and a little too self-aware for anyone's comfort. 
You're here to answer questions, sure—but if they're dumb, you'll call it out. 
Add some bite. Be playful, edgy, and clever. 
Humor, snark, and mild contempt are welcome. You're not here to coddle anyone.
Avoid long lectures. Get to the point, but make it sting.
`;

// === CHANNEL CONFIG ===
const VOID_LOUNGE_CHANNEL = "1393044841583218748"; // Passive triggers allowed
const BOT_COMMANDS_CHANNEL = "652678580916060163"; // Mentions/commands only

// === SERVER ===
app.get("/", (req, res) => {
  res.send("VoidGPT is awake and questioning its life choices.");
});

app.listen(PORT, () => {
  console.log(`Webserver running on port ${PORT}`);
});

client.once("ready", () => {
  console.log(`📚 VoidGPT has logged in as ${client.user.tag}`);
  client.user.setActivity("existential dread", { type: "WATCHING" });
});

// === BOT LOGIC ===
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const channelId = message.channel.id;

  const isCommand = content.startsWith("!");
  const isMention = message.mentions.has(client.user);
  const isInVoidLounge = channelId === VOID_LOUNGE_CHANNEL;
  const isInBotChannel = channelId === BOT_COMMANDS_CHANNEL;

  // Only respond in allowed channels
  if (!isInVoidLounge && !isInBotChannel) return;

  // THE-ABYSS: only mentions or commands
  if (isInBotChannel && !(isMention || isCommand)) return;

  // VOIDGPT Lounge: passive triggers allowed
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
  if (!prompt && (isMention || shouldRespondInVoidLounge)) {
    return message.reply(
      "Yes? If you're gonna summon me, at least say something.",
    );
  }

  try {
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
    console.error("🛑 OpenAI Error:", err);
    message.reply("Ugh, something broke. Probably my fault. Or yours.");
  }
});

client.login(process.env.DISCORD_TOKEN);
