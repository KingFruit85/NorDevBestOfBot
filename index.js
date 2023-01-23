const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const Comment = require("./events/database/models");
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

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

const alreadyVoted = new EmbedBuilder().setDescription(
  "You have already voted"
);
const yesVote = new EmbedBuilder().setDescription(
  "Your 👍 vote has been recorded, cheers!"
);

const noVote = new EmbedBuilder().setDescription(
  "You 👎 has been recorded, cheers!"
);

const alreadyOnBestOf = new EmbedBuilder().setDescription(
  "This comment is already in the best of list!"
);

const passedIntoBestOf = new EmbedBuilder().setDescription(
  "Your vote was the final needed to add this comment to the best of list, nice work!"
);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  let vote = interaction.customId.split("-")[0].trim();
  let key = interaction.customId.split("-")[1].trim();
  let messageIdValue = key.split("/")[key.split("/").length - 1];
  let channelIdValue = key.split("/")[key.split("/").length - 2];
  let serverIdValue = key.split("/")[key.split("/").length - 3];
  let channel = interaction.client.channels.cache.get(channelIdValue);
  let message = await channel.messages.fetch(messageIdValue);

  // If the comment has never been nominated before add an initial record
  const record = await db
    .collection("Comments")
    .findOne({ messageId: messageIdValue });

  const filter = { messageId: messageIdValue };
  if (record) {
    console.log("Found record!");

    if (vote === "YesVote") {
      await db.collection("Comments").findOneAndUpdate(filter, {
        $set: { voteCount: record.voteCount + 1 },
      });
    }

    if (vote === "NoVote") {
      await db.collection("Comments").findOneAndUpdate(filter, {
        $set: { voteCount: record.voteCount - 1 },
      });
    }
  } else {
    console.log("didn't find record, adding new one!");

    const newRecord = new Comment({
      messageId: messageIdValue,
      serverId: serverIdValue,
      userName: message.author.username,
      comment: message.content,
      voteCount: 1,
      iconUrl: message.author.avatarURL({ format: "png", size: 128 }),
      dateOfSubmission: new Date(),
    });

    db.collection("Comments").insertOne(newRecord);
  }
  await interaction.reply({
    content: "Thanks for the vote dickhead",
    ephemeral: true,
  });
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
