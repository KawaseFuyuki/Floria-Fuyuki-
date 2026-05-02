const { Client, GatewayIntentBits, Partials, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
});

const app = express();
const PORT = process.env.PORT || 3000;
const PREFIX = process.env.PREFIX;
const EMBED_COLOR = '#FFFF00'; // Yellow

app.get('/', (req, res) => res.send('Floria Fuyuki Bot is Alive!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ========== MONGODB SCHEMAS ==========
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected'));

const reactionRoleSchema = new mongoose.Schema({
    guildId: String,
    messageId: String,
    emoji: String,
    roleId: String
});
const ReactionRole = mongoose.model('ReactionRole', reactionRoleSchema);

const autoRoleSchema = new mongoose.Schema({
    guildId: String,
    roleId: String
});
const AutoRole = mongoose.model('AutoRole', autoRoleSchema);

// ========== SLASH COMMANDS ==========
const commands = [
    new SlashCommandBuilder()
     .setName('reactionrole')
     .setDescription('Setup reaction roles')
     .addStringOption(o => o.setName('messageid').setDescription('Message ID to add reaction').setRequired(true))
     .addStringOption(o => o.setName('emoji').setDescription('Emoji to react with').setRequired(true))
     .addRoleOption(o => o.setName('role').setDescription('Role to give').setRequired(true)),
    
    new SlashCommandBuilder()
     .setName('autorole')
     .setDescription('Manage auto roles')
     .addSubcommand(s => s.setName('add').setDescription('Add auto role').addRoleOption(o => o.setName('role').setDescription('Role to add').setRequired(true)))
     .addSubcommand(s => s.setName('remove').setDescription('Remove auto role').addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true)))
     .addSubcommand(s => s.setName('list').setDescription('List auto roles')),

    new SlashCommandBuilder()
     .setName('addrole')
     .setDescription('Add role to user')
     .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
     .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),

    new SlashCommandBuilder()
     .setName('temprole')
     .setDescription('Give temporary role')
     .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
     .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
     .addStringOption(o => o.setName('duration').setDescription('Duration like 1h, 1d').setRequired(true)),

    new SlashCommandBuilder()
     .setName('help')
     .setDescription('Shows all commands')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.on('ready', async () => {
    console.log(`Floria Fuyuki#1109 is online ✅`);
    client.user.setActivity('Watching Anime', { type: 3 });
    
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Slash commands registered ✅');
    } catch (error) {
        console.error(error);
    }
});

// ========== MODULE A: REACTION ROLE + AUTO ROLE ==========

// Auto Role on Join
client.on('guildMemberAdd', async member => {
    const autoRoles = await AutoRole.find({ guildId: member.guild.id });
    for (const data of autoRoles) {
        const role = member.guild.roles.cache.get(data.roleId);
        if (role) member.roles.add(role).catch(() => {});
    }
});

// Reaction Role Add
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    
    const data = await ReactionRole.findOne({ 
        messageId: reaction.message.id, 
        emoji: reaction.emoji.toString() 
    });
    if (!data) return;
    
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(data.roleId);
    if (role) member.roles.add(role).catch(() => {});
});

// Reaction Role Remove
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    
    const data = await ReactionRole.findOne({ 
        messageId: reaction.message.id, 
        emoji: reaction.emoji.toString() 
    });
    if (!data) return;
    
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(data.roleId);
    if (role) member.roles.remove(role).catch(() => {});
});

// Slash Command Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName } = interaction;
    
    // /reactionrole
    if (commandName === 'reactionrole') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: '❌ You need `Manage Roles` permission', ephemeral: true });
        }
        
        const messageId = interaction.options.getString('messageid');
        const emoji = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');
        
        try {
            const msg = await interaction.channel.messages.fetch(messageId);
            await msg.react(emoji);
            
            await new ReactionRole({
                guildId: interaction.guild.id,
                messageId: messageId,
                emoji: emoji,
                roleId: role.id
            }).save();
            
            const embed = new EmbedBuilder()
             .setColor(EMBED_COLOR)
             .setTitle('✅ Reaction Role Setup')
             .setDescription(`React with ${emoji} to get ${role}`)
             .setTimestamp();
            
            interaction.reply({ embeds: [embed] });
        } catch (e) {
            interaction.reply({ content: '❌ Invalid Message ID or I cannot react to that message', ephemeral: true });
        }
    }
    
    // /autorole
    if (commandName === 'autorole') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: '❌ You need `Manage Roles` permission', ephemeral: true });
        }
        
        const sub = interaction.options.getSubcommand();
        
        if (sub === 'add') {
            const role = interaction.options.getRole('role');
            await new AutoRole({ guildId: interaction.guild.id, roleId: role.id }).save();
            
            const embed = new EmbedBuilder()
             .setColor(EMBED_COLOR)
             .setDescription(`✅ Added ${role} to auto roles`);
            interaction.reply({ embeds: [embed] });
        }
        
        if (sub === 'remove') {
            const role = interaction.options.getRole('role');
            await AutoRole.deleteOne({ guildId: interaction.guild.id, roleId: role.id });
            
            const embed = new EmbedBuilder()
             .setColor(EMBED_COLOR)
             .setDescription(`✅ Removed ${role} from auto roles`);
            interaction.reply({ embeds: [embed] });
        }
        
        if (sub === 'list') {
            const roles = await AutoRole.find({ guildId: interaction.guild.id });
            const list = roles.map(r => `<@&${r.roleId}>`).join('\n') || 'No auto roles set';
            
            const embed = new EmbedBuilder()
             .setColor(EMBED_COLOR)
             .setTitle('📋 Auto Roles')
             .setDescription(list);
            interaction.reply({ embeds: [embed] });
        }
    }
    
    // /addrole
    if (commandName === 'addrole') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: '❌ You need `Manage Roles` permission', ephemeral: true });
        }
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const member = await interaction.guild.members.fetch(user.id);
        
        await member.roles.add(role);
        const embed = new EmbedBuilder()
         .setColor(EMBED_COLOR)
         .setDescription(`✅ Added ${role} to ${user}`);
        interaction.reply({ embeds: [embed] });
    }
    
    // /temprole
    if (commandName === 'temprole') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: '❌ You need `Manage Roles` permission', ephemeral: true });
        }
        const ms = require('ms');
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const duration = interaction.options.getString('duration');
        const time = ms(duration);
        
        if (!time) return interaction.reply({ content: '❌ Invalid duration. Use 1m, 1h, 1d', ephemeral: true });
        
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.add(role);
        
        const embed = new EmbedBuilder()
         .setColor(EMBED_COLOR)
         .setDescription(`✅ Added ${role} to ${user} for ${duration}`);
        interaction.reply({ embeds: [embed] });
        
        setTimeout(async () => {
            await member.roles.remove(role).catch(() => {});
        }, time);
    }
    
    // /help
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
         .setColor(EMBED_COLOR)
         .setTitle('📋 Floria Fuyuki Commands - Module A')
         .setDescription('**Reaction Role & Auto Role**')
         .addFields(
            { name: '/reactionrole', value: 'Setup reaction role on message' },
            { name: '/autorole add', value: 'Add auto role for new members' },
            { name: '/autorole remove', value: 'Remove auto role' },
            { name: '/autorole list', value: 'List all auto roles' },
            { name: '/addrole', value: 'Add role to a user' },
            { name: '/temprole', value: 'Give temporary role' }
          )
         .setFooter({ text: 'Use &help commandname for detailed usage' });
        interaction.reply({ embeds: [embed] });
    }
});

// Prefix Help: &help temprole
client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'help') {
        const cmd = args[0];
        const embed = new EmbedBuilder().setColor(EMBED_COLOR);
        
        if (cmd === 'temprole') {
            embed.setTitle('Command: /temprole')
             .setDescription('**Usage:** `/temprole @user @role 1h`\n**Description:** Gives temporary role to user\n**Example:** `/temprole @User @VIP 7d`\n**Permissions:** Manage Roles');
        } else if (cmd === 'reactionrole') {
            embed.setTitle('Command: /reactionrole')
             .setDescription('**Usage:** `/reactionrole messageid emoji @role`\n**Description:** Setup reaction role\n**Example:** `/reactionrole 123456789 😀 @Member`\n**Permissions:** Manage Roles\n**Note:** Right click message → Copy Message ID');
        } else {
            embed.setTitle('📋 All Commands')
             .setDescription('Use `/help` to see all slash commands\nUse `&help commandname` for specific command help');
        }
        message.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);
