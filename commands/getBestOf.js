const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getbestof")
    .setDescription("Returns the top ten best of comments"),

  async execute(interaction) {
    let topComments = await db
      .collection("Comments")
      .find()
      .sort({ voteCount: -1 })
      .limit(5)
      .toArray();

    const date = new Date();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const exampleEmbed = new EmbedBuilder()
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
      exampleEmbed.addFields(
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

    return await interaction.reply({
      embeds: [exampleEmbed],
    });
  },
};
