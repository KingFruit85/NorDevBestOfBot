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
      .collection(interaction.guildId)
      .find()
      .sort({ voteCount: -1 })
      .limit(5)
      .toArray();

    let topFiveCommentEmbeds = [];

    const date = new Date();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const headerMessage = new EmbedBuilder()
      .setColor([255, 0, 255])
      .setTitle(`The top 5 comments from ${month} ${year}`);

    topFiveCommentEmbeds.push(headerMessage);

    topComments.forEach((comment) => {
      let _comment = new EmbedBuilder()
        .setDescription(comment.comment)
        .setAuthor({
          name: `${comment.userName} (${comment.userTag})`,
          iconURL: comment.iconUrl,
        })
        .setColor("#FFD700");

      if (comment.imageUrl && comment.imageUrl.includes("http")) {
        _comment.setImage(comment.imageUrl);
      }

      topFiveCommentEmbeds.push(_comment);
    });

    await interaction.reply({
      embeds: topFiveCommentEmbeds,
    });
  },
};
