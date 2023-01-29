const { Events } = require("discord.js");
const PostMonthlyTopComments = require("../cronjobs/monthlyBestOf.js");
const { schedule } = require("node-cron");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    var monthlyBestOfCommentsTask = schedule("0 9 1 * *", async () => {
      const channel = client.channels.cache.get(process.env.GENERAL_CHANNEL_ID);
      let embed = await PostMonthlyTopComments(process.env.GENERAL_CHANNEL_ID);
      channel.send({ embeds: [embed] });
    });

    monthlyBestOfCommentsTask.start();
  },
};

// son is awake
