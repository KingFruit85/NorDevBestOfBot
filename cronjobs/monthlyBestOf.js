const {
  EmbedBuilder,
  Client,
  GatewayIntentBits,
  Partials,
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

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

async function PostMonthlyTopComments() {
  const date = new Date();
  const startDateOfCurrentMonth = new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
  const lastDayOfCurrentMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );

  const topComments = await db
    .collection(mongoose.model.Comments)
    .find({
      dateOfSubmission: {
        $gte: startDateOfCurrentMonth,
        $lt: lastDayOfCurrentMonth,
      },
    })
    .sort({ voteCount: -1 })
    .limit(5)
    .toArray();

  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  const topCommentsEmbed = new EmbedBuilder()
    .setColor([255, 0, 255])
    .setTitle(`The top 5 comments from ${month} ${year}`)
    .addFields(
      { name: "User", value: " ", inline: true },
      { name: "Votes", value: " ", inline: true },
      { name: "Comment", value: " ", inline: true }
    )
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/680873189106384988/1065930668825116682/PXL_20230120_094737132.jpg"
    )

    .setTimestamp();

  topComments.forEach((post) => {
    topCommentsEmbed.addFields(
      {
        name: " ",
        value: post.userName,
        inline: true,
      },
      {
        name: " ",
        value: post.voteCount.toString(),
        inline: true,
      },
      {
        name: " ",
        value: post.comment,
        inline: true,
      }
    );
  });
  return topCommentsEmbed;
}

module.exports = PostMonthlyTopComments;
