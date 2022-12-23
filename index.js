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
dotenv.config();
const KeyvMongo = require("@keyvhq/mongo");
const Keyv = require("keyv");

const holdingTable = new Keyv({
  store: new KeyvMongo(process.env.DATABASE_CONNECTION_STRING, {
    collection: "holdingtable",
  }),
});

const bestOfTable = new Keyv({
  store: new KeyvMongo(process.env.DATABASE_CONNECTION_STRING, {
    collection: "bestoftable",
  }),
});

holdingTable.on("error", (err) => console.error("Keyv connection error:", err));
bestOfTable.on("error", (err) => console.error("Keyv connection error:", err));

client.login(process.env.DISCORD_TOKEN);

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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  let vote = interaction.customId.split("-")[0].trim();
  let key = interaction.customId.split("-")[1].trim();

  if (await bestOfTable.get(key)) {
    return; // Should probably return message to the user
  }

  let keyInHolding = await holdingTable.get(key);

  // If the comment has never been nominated before add an initial record
  if (!keyInHolding) {
    await holdingTable.set(key, 0);
  }

  if (vote === "YesVote") {
    let currentValue = await holdingTable.get(key);
    await holdingTable.set(key, currentValue + 1);

    if (currentValue + 1 >= 5) {
      let channel = interaction.client.channels.cache.get(
        key.split("/")[key.split("/").length - 2]
      );

      let message = await channel.messages.fetch(
        key.split("/")[key.split("/").length - 1]
      );

      await bestOfTable.set(key, JSON.stringify(message)); // Placeholder should me full message as JSON maybe?
    }
  }

  if (vote === "NoVote") {
    let currentValue = await holdingTable.get(key);
    await holdingTable.set(key, currentValue - 1);
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
