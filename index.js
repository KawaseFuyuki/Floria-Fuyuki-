require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const prefix = process.env.PREFIX || "fl";

// Bot Online
client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);
});

// Slash Commands
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  // /start
  if (interaction.commandName === "start") {

    const embed = new EmbedBuilder()
      .setTitle("🔥 Welcome to ShadowGacha")
      .setDescription("Your anime adventure begins now!")
      .setColor("Purple");

    await interaction.reply({ embeds: [embed] });
  }

  // /profile
  if (interaction.commandName === "profile") {

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username}'s Profile`)
      .addFields(
        { name: "Souls", value: "5000", inline: true },
        { name: "Level", value: "1", inline: true },
        { name: "Rank", value: "Beginner", inline: true }
      )
      .setColor("Blue");

    await interaction.reply({ embeds: [embed] });
  }

  // /summon
  if (interaction.commandName === "summon") {

    const characters = [
      "Naruto",
      "Gojo",
      "Luffy",
      "Goku",
      "Yoriichi",
      "Muzan",
      "Kokushibo",
      "Saitama",
      "Aizen",
      "Rimuru"
    ];

    const random =
      characters[Math.floor(Math.random() * characters.length)];

    const embed = new EmbedBuilder()
      .setTitle("🎴 Summon Complete")
      .setDescription(`✨ You obtained **${random}**`)
      .setColor("Gold");

    await interaction.reply({ embeds: [embed] });
  }
});

// Prefix Commands
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const command = args.shift().toLowerCase();

  // flstart
  if (command === "start") {

    const embed = new EmbedBuilder()
      .setTitle("🔥 Welcome to ShadowGacha")
      .setDescription("Your anime adventure begins now!")
      .setColor("Purple");

    message.reply({ embeds: [embed] });
  }

  // flprofile
  if (command === "profile") {

    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Profile`)
      .addFields(
        { name: "Souls", value: "5000", inline: true },
        { name: "Level", value: "1", inline: true },
        { name: "Rank", value: "Beginner", inline: true }
      )
      .setColor("Blue");

    message.reply({ embeds: [embed] });
  }

  // flsummon
  if (command === "summon") {

    const characters = [
      "Naruto",
      "Gojo",
      "Luffy",
      "Goku",
      "Yoriichi",
      "Muzan",
      "Kokushibo",
      "Saitama",
      "Aizen",
      "Rimuru"
    ];

    const random =
      characters[Math.floor(Math.random() * characters.length)];

    const embed = new EmbedBuilder()
      .setTitle("🎴 Summon Complete")
      .setDescription(`✨ You obtained **${random}**`)
      .setColor("Gold");

    message.reply({ embeds: [embed] });
  }

});

client.login(process.env.TOKEN);
