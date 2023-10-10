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

const helpers = require("../helpers/helpers.js");
const generalChannelId = "680873189106384988";

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
  console.log("Index Connected successfully");
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
  if (interaction.isMessageContextMenuCommand()) {
    console.log(interaction.commandName);
    const channel = interaction.client.channels.cache.get(
      interaction.channelId
    );
    const message = await channel.messages.fetch(interaction.targetId);
    let imageAttachmentUrls = [];

    if (message.attachments.size > 0) {
      message.attachments.forEach((attachment) => {
        if (attachment.contentType.includes("image")) {
          imageAttachmentUrls.push(attachment.url);
        }
      });
    }

    if (message.author.bot) {
      return await interaction.reply({
        content: "You can't nominate a bot message",
        ephemeral: true,
      });
    }

    const persistedComment = await db
      .collection(interaction.guildId)
      .find({ messageId: message.id })
      .toArray();

    if (persistedComment[0]) {
      const messageLinkButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Take me to the message")
          .setStyle(ButtonStyle.Link)
          .setURL(persistedComment[0].messageLink)
      );

      return await interaction.reply({
        content: "That message is already on the best of list!",
        ephemeral: true,
        components: [messageLinkButton],
      });
    }

    let nominatedMessage;

    // With image
    if (message.attachments.size > 0) {
      nominatedMessage = new EmbedBuilder()
        .setDescription(message.content || " ")
        .setAuthor({
          name: `${message.author.username} (${message.author.tag})`,
          iconURL: message.author.avatarURL(),
        })
        .setColor("#13f857")
        .setImage(message.attachments.first().url);
    }

    if (message.attachments.size === 0) {
      nominatedMessage = new EmbedBuilder()
        .setDescription(message.content || " ")
        .setAuthor({
          name: `${message.author.username} (${message.author.tag})`,
          iconURL: message.author.avatarURL(),
        })
        .setColor("#13f857");
    }

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

    // Post to the general chat
    const linkToMessage = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
    const messageLink = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Take me to the message to vote")
        .setEmoji("➡")
        .setStyle(ButtonStyle.Link)
        .setURL(linkToMessage)
    );

    const ogChannel = interaction.channel.name;
    await client.channels.fetch(generalChannelId).then((channel) =>
      channel.send({
        content: `🔥 It's all popping off in ${ogChannel}! ${helpers.TryGetUserNickname(
          interaction.member
        )} has nominated the following message to be added to the best of list 🔥`,
        embeds: [nominatedMessage],
        components: [messageLink],
      })
    );

    // post in og channel
    return await interaction.reply({
      content: `${helpers.TryGetUserNickname(
        interaction.member
      )} has nominated the following message to be added to the best of list`,
      embeds: [nominatedMessage],
      components: [row],
    });
  }

  if (interaction.isButton()) {
    let vote = interaction.customId.split("-")[0].trim();
    let messageIdValue = interaction.customId.split("-")[1].trim();
    let serverIdValue = interaction.guildId;
    let channel = interaction.client.channels.cache.get(interaction.channelId);
    let message = await channel.messages.fetch(messageIdValue);

    if (interaction.customId == "messageLinkButton") {
    }

    // If the comment has never been nominated before add an initial record
    const record = await db
      .collection(interaction.guildId)
      .findOne({ messageId: messageIdValue });

    let votersValue = record ? record.voters : [];

    if (votersValue.includes(interaction.user.username)) {
      return await interaction.reply({
        content:
          "You have already voted for this message, you cannot vote again",
        ephemeral: true,
      });
    }

    votersValue.push(interaction.user.username);

    const filter = { messageId: messageIdValue };
    if (record) {
      if (vote === "YesVote") {
        await db.collection(interaction.guildId).findOneAndUpdate(filter, {
          $set: { voteCount: record.voteCount + 1, voters: votersValue },
        });
      }

      if (vote === "NoVote") {
        await db.collection(interaction.guildId).findOneAndUpdate(filter, {
          $set: { voteCount: record.voteCount - 1, voters: votersValue },
        });
      }
    } else {
      let imageUrlLink =
        message.attachments.size > 0 ? message.attachments.first().url : null;

      let quotedMessageValue = null;
      let quotedMessageAuthorValue = null;
      let quotedMessageAvatarValue = null;
      let quotedMessageImageValue = null;
      let quotedMessageAuthorNickName = null;

      if (message.reference) {
        quotedMessageValue = await message.channel.messages.fetch(
          message.reference.messageId
        );
        console.log(quotedMessageValue.author.username);
        quotedMessageAuthorValue = quotedMessageValue.author.username;
        quotedMessageAvatarValue = quotedMessageValue.author.avatarURL();
        quotedMessageImageValue =
          quotedMessageValue.attachments.size > 0
            ? quotedMessageValue.attachments.first().url
            : null;
      }

      var nickName = message.author.username;

      console.log("message to persist");
      console.log(message);

      if (message.member.nickname) {
        nickName = message.member.nickname;
      }

      const newRecord = new Comment({
        messageLink: `https://discord.com/channels/${interaction.message.guildId}/${interaction.message.channelId}/${interaction.message.id}`,
        messageId: messageIdValue,
        serverId: serverIdValue,
        userName: message.author.username,
        userTag: message.author.tag,
        comment: message.content,
        voteCount: 1,
        iconUrl: message.author.avatarURL({ format: "png", size: 128 }),
        dateOfSubmission: new Date(),
        imageUrl: imageUrlLink,
        voters: votersValue,
        quotedMessage: quotedMessageValue,
        quotedMessageAuthor: quotedMessageAuthorValue,
        quotedMessageAvatarLink: quotedMessageAvatarValue,
        quotedMessageImage: quotedMessageImageValue,
        nickname: nickName,
        quotedMessageAuthorNickname: quotedMessageAuthorNickName,
      });

      db.collection(interaction.guildId).insertOne(newRecord);
    }
    return await interaction.reply({
      content: `Thanks for voting for ${message.author.username}'s comment!`,
      ephemeral: true,
    });
  }
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
