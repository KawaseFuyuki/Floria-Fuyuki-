require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(3000);

client.once('ready', () => {
  console.log(`${client.user.tag} online hai ✅`);
});

client.login(process.env.TOKEN);
