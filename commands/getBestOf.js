const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const AsciiTable = require("ascii-table");
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
      .limit(10)
      .toArray();

    let msgs = [];

    var table = new AsciiTable();
    topComments.forEach((post) => {
      table.addRow(post.voteCount, post.userName, post.comment);
    });

    await interaction.reply({
      content: "```" + table.removeBorder().toString() + "```",
    });
  },
};
