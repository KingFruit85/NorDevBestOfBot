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

const voteHistoryTable = new Keyv({
  store: new KeyvMongo(process.env.DATABASE_CONNECTION_STRING, {
    collection: "votehistorytable",
  }),
});

holdingTable.on("error", (err) => console.error("Keyv connection error:", err));
bestOfTable.on("error", (err) => console.error("Keyv connection error:", err));
voteHistoryTable.on("error", (err) =>
  console.error("Keyv connection error:", err)
);

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

  console.log(interaction.user.id);

  let vote = interaction.customId.split("-")[0].trim();
  let key = interaction.customId.split("-")[1].trim();

  if (await bestOfTable.get(key)) {
    interaction
      .reply({ embeds: [alreadyOnBestOf], ephemeral: true })
      .catch(console.error);
  }

  let keyInHolding = await holdingTable.get(key);

  let messageAlreadyHasVotes = await voteHistoryTable.get(key);
  let voters = [];

  if (!messageAlreadyHasVotes) {
    voters.push(interaction.user.id);
  }

  if (messageAlreadyHasVotes) {
    voters = JSON.parse(messageAlreadyHasVotes);
  }

  if (messageAlreadyHasVotes && voters.includes(interaction.user.id)) {
    interaction
      .reply({ embeds: [alreadyVoted], ephemeral: true })
      .catch(console.error);
  }

  if (messageAlreadyHasVotes && !voters.includes(interaction.user.id)) {
    voters.push(interaction.user.id);
  }

  // If the comment has never been nominated before add an initial record
  if (!keyInHolding) {
    await holdingTable.set(key, 0);
  }

  if (vote === "YesVote") {
    let currentValue = await holdingTable.get(key);

    // Enough votes to move into bestof
    if (currentValue + 1 >= 5) {
      let channel = interaction.client.channels.cache.get(
        key.split("/")[key.split("/").length - 2]
      );

      let message = await channel.messages.fetch(
        key.split("/")[key.split("/").length - 1]
      );

      // Add comment to best of table
      await bestOfTable.set(key, JSON.stringify(message));

      // Delete holding record
      await holdingTable.delete(key);

      const successMessage = new EmbedBuilder()
        .setDescription(message.content || " ")
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor("#FCB900");

      channel.send({
        content: `Enough votes have been collected to move ${message.author.username}'s message into the best of list, woo-hoo!`,
        embeds: [successMessage],
      });

      interaction
        .reply({ embeds: [passedIntoBestOf], ephemeral: true })
        .catch(console.error);
    }

    // Just increment the vote
    await holdingTable.set(key, currentValue + 1);
    interaction
      .reply({ embeds: [yesVote], ephemeral: true })
      .catch(console.error);
  }

  if (vote === "NoVote") {
    let currentValue = await holdingTable.get(key);
    await holdingTable.set(key, currentValue - 1);
    interaction
      .reply({ embeds: [noVote], ephemeral: true })
      .catch(console.error);
  }

  await voteHistoryTable.set(key, JSON.stringify(voters));
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
