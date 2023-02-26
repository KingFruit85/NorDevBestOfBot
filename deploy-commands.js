const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("node:fs");

dotenv.config();

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  console.log(`loading ${file}`);
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

console.log("reading context file");

const contextFiles = fs
  .readdirSync("./context")
  .filter((file) => file.endsWith(".js"));

for (const file of contextFiles) {
  console.log(`loading ${file}`);

  const context = require(`./context/${file}`);
  commands.push(context.data.toJSON());
}

// Construct and prepare an instance of the REST module
console.log("Create REST module");
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    // When finished in dev change to :

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
