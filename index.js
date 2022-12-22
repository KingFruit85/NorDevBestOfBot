const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
} = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const dotenv = require("dotenv");
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Just mocking the voting behavior
const holdingTable = {};
const bestOfTable = {};

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isButton()) return;

  let vote = interaction.customId.split("-")[0].trim();
  let key = interaction.customId.split("-")[1].trim();
  console.log(interaction.message.components[0].components[1]);

  if (!(key in holdingTable)) {
    holdingTable[key] = 0;
  }

  if (vote === "YesVote") {
    holdingTable[key]++;
    interaction.message.components[0].components[0].disabled = true; // This doesn't work
  }

  if (vote === "NoVote") {
    holdingTable[key]--;
    interaction.message.components[0].components[1].disabled = true; // This doesn't work
  }

  if (holdingTable[key] >= 5 && !(key in bestOfTable)) {
    bestOfTable[key] = 1;
  }
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

dotenv.config();
client.login(process.env.DISCORD_TOKEN);
