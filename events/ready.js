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

const _guild = "";

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    let defaultChannel = "";

    client.on(Events.GuildCreate, async (guild) => {
      _guild = guild;

      defaultChannel = guild.channels
        .filter((c) => c.type === "text")
        .find((x) => x.position == 0);
    });

    // var monthlyBestOfCommentsTask = schedule("0 9 1 * *", async () => {
    //   console.log("Posting monthly stats");
    //   const channel = client.channels.cache.get(defaultChannel.id);
    //   let embed = await PostMonthlyTopComments(defaultChannel.id);
    //   channel.send({ embeds: [embed] });
    // });

    // monthlyBestOfCommentsTask.start();
  },
};
