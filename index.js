const { EmbedBuilder,  REST, Routes, Client, GatewayIntentBits } = require('discord.js');
const { clientId, guildId, token, Welcome_Id, Leave_Id } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages,  GatewayIntentBits.MessageContent] });

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


client.on('guildMemberAdd', member => {
    const Wlc = new EmbedBuilder()
        .setTitle('Benvenuto nel server!')
        .setDescription(`Ciao ${member.id}, siamo felici di averti con noi!`)
        .setColor(0x00FF00)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Utente #${member.guild.memberCount}` });

    const channel = member.guild.channels.cache.get(Welcome_Id);
    if (channel) channel.send({ embeds: [Wlc] });
});


client.on('guildMemberRemove', member => {
    const Leave = new EmbedBuilder()
        .setTitle('Utente uscito dal server')
        .setDescription(`👋 ${member.id} ha lasciato il server.`)
        .setColor(0xFF0000)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Ora siamo ${member.guild.memberCount} membri.` });

    const channel = member.guild.channels.cache.get(Leave_Id);
    if (channel) channel.send({ embeds: [Leave] });
});

client.login(token);
