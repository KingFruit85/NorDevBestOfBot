// const { SlashCommandBuilder, EmbedBuilder, Client } = require("discord.js");
// const dotenv = require("dotenv");

// dotenv.config();

// const mongoose = require("mongoose");
// mongoose.connect(process.env.DATABASE_CONNECTION_STRING);
// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error: "));
// db.once("open", function () {
//   console.log("Connected successfully");
// });

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("getThisMonthsTopComments")
//     .setDescription("Returns the top five comments of the month so far"),

//   async execute(interaction) {
//     const date = new Date();
//     const startDateOfCurrentMonth = new Date(
//       date.getFullYear(),
//       date.getMonth(),
//       1
//     );
//     const lastDayOfCurrentMonth = new Date(
//       date.getFullYear(),
//       date.getMonth() + 1,
//       0
//     );

//     const topComments = await db
//       .collection(mongoose.model.Comments)
//       .find({
//         dateOfSubmission: {
//           $gte: startDateOfCurrentMonth,
//           $lt: lastDayOfCurrentMonth,
//         },
//       })
//       .sort({ voteCount: -1 })
//       .limit(5)
//       .toArray();

//     const exampleEmbed = new EmbedBuilder()
//       .setColor([255, 0, 255])
//       .setTitle(`The top 5 comments from ${month} ${year}`)

//       .addFields(
//         { name: "User", value: " ", inline: true },
//         { name: "Votes", value: " ", inline: true },
//         { name: "Comment", value: " ", inline: true }
//       )
//       .setThumbnail(
//         "https://cdn.discordapp.com/attachments/680873189106384988/1065930668825116682/PXL_20230120_094737132.jpg"
//       )

//       .setTimestamp();

//     topComments.forEach((post) => {
//       exampleEmbed.addFields(
//         {
//           name: " ",
//           value: post.userName,
//           inline: true,
//         },
//         {
//           name: " ",
//           value: post.voteCount.toString(),
//           inline: true,
//         },
//         {
//           name: " ",
//           value: post.comment,
//           inline: true,
//         }
//       );
//     });

//     return await interaction.reply({
//       embeds: [exampleEmbed],
//     });
//   },
// };
