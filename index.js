require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  Client,
  Collection,
  GatewayIntentBits,
  Events
} = require("discord.js");

const { Connectors } = require("shoukaku");
const { Kazagumo } = require("kazagumo");

// ================= WEB SERVER =================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🎵 Music Bot is Running!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server started on port ${PORT}`);
});

// ================= DISCORD CLIENT =================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= KAZAGUMO / LAVALINK =================

const Nodes = [
  {
    name: "Render-Lavalink",

    // Render ka HTTPS hostname
    url: process.env.LAVALINK_HOST,

    // Lavalink password
    auth: process.env.LAVALINK_PASSWORD,

    // Render HTTPS/WSS use karta hai
    secure: true
  }
];

const kazagumo = new Kazagumo(
  {
    defaultSearchEngine: "youtube",

    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);

      if (guild) {
        guild.shard.send(payload);
      }
    }
  },

  new Connectors.DiscordJS(client),

  Nodes
);

// Lavalink events

kazagumo.shoukaku.on("ready", (name) => {
  console.log(`✅ Lavalink connected: ${name}`);
});

kazagumo.shoukaku.on("error", (name, error) => {
  console.error(`❌ Lavalink error [${name}]:`, error);
});

kazagumo.shoukaku.on("close", (name, code, reason) => {
  console.log(
    `⚠️ Lavalink closed [${name}] Code: ${code} Reason: ${reason || "Unknown"}`
  );
});

kazagumo.shoukaku.on("disconnect", (name) => {
  console.log(`🔌 Lavalink disconnected: ${name}`);
});

// Music events

kazagumo.on("playerStart", (player, track) => {
  const channel = client.channels.cache.get(player.textId);

  if (channel) {
    channel.send(
      `🎵 **Now Playing:** ${track.title}`
    );
  }
});

kazagumo.on("playerEnd", (player) => {
  console.log(`⏹️ Track ended in guild ${player.guildId}`);
});

kazagumo.on("playerEmpty", (player) => {
  console.log(`📭 Queue empty in guild ${player.guildId}`);
});

// ================= COMMANDS =================

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));

  if (!command.data || !command.execute) {
    console.log(`⚠️ Invalid command file: ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
}

// ================= DISCORD READY =================

client.once(Events.ClientReady, () => {
  console.log(`✅ ${client.user.tag} is online!`);
  console.log(`📦 Loaded ${client.commands.size} commands`);
});

// ================= INTERACTIONS =================

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`❌ Command not found: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("❌ Command Error:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Error while executing command.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ Error while executing command.",
        ephemeral: true
      });
    }
  }
});

// ================= SLASH COMMAND REGISTER =================

require("./deploy-commands");

// ================= LOGIN =================

client.login(process.env.TOKEN);

// Export Kazagumo so commands can use it
module.exports = {
  client,
  kazagumo
};