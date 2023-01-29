const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const Comment = require("../events/database/models.js");
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

const eventsPath = path.join(__dirname, "/../events");
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
  if (!interaction.isMessageContextMenuCommand()) return;

  const channel = interaction.client.channels.cache.get(interaction.channelId);
  const message = await channel.messages.fetch(interaction.targetId);

  if (message.content.length <= 0) {
    return await interaction.reply({
      content: "You can't nominate a message that doesn't include text",
      ephemeral: true,
    });
  }

  const nominatedMessage = new EmbedBuilder()
    .setDescription(message.content || " ")
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.avatarURL(),
    })
    .setColor("#13f857");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("I Agree!")
      .setCustomId(`YesVote -${message.id}`)
      .setStyle(ButtonStyle.Success)
      .setEmoji("👍"),
    new ButtonBuilder()
      .setLabel("I Disagree")
      .setCustomId(`NoVote -${message.id}`)
      .setStyle(ButtonStyle.Danger)
      .setEmoji("👎")
  );

  return await interaction.reply({
    content: `${interaction.user.username} has nominated the following message to be added to the best of list`,
    embeds: [nominatedMessage],
    components: [row],
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  let vote = interaction.customId.split("-")[0].trim();
  let messageIdValue = interaction.customId.split("-")[1].trim();
  let serverIdValue = interaction.guildId;
  let channel = interaction.client.channels.cache.get(interaction.channelId);
  let message = await channel.messages.fetch(messageIdValue);

  // If the comment has never been nominated before add an initial record
  const record = await db
    .collection("Comments")
    .findOne({ messageId: messageIdValue });

  let votersValue = record ? record.voters : [];

  if (votersValue.includes(interaction.user.username)) {
    console.log("User already voted!");
    return await interaction.reply({
      content: "You have already voted for this message, you cannot vote again",
      ephemeral: true,
    });
  }

  votersValue.push(interaction.user.username);

  const filter = { messageId: messageIdValue };
  if (record) {
    console.log("Found record!");

    if (vote === "YesVote") {
      await db.collection("Comments").findOneAndUpdate(filter, {
        $set: { voteCount: record.voteCount + 1, voters: votersValue },
      });
    }

    if (vote === "NoVote") {
      await db.collection("Comments").findOneAndUpdate(filter, {
        $set: { voteCount: record.voteCount - 1, voters: votersValue },
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
      voters: votersValue,
    });

    db.collection("Comments").insertOne(newRecord);
  }
  return await interaction.reply({
    content: `Thanks for voting for ${message.author.username}'s comment!`,
    ephemeral: true,
  });
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "/../commands");
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
