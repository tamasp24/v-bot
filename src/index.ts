import 'dotenv/config';
import { Client } from 'discord.js';
import eventHandler from './handlers/eventHandler';

let client = new Client({
	intents: [
		'Guilds',
		'GuildMessages',
		'GuildMessageReactions',
		'DirectMessages',
		'DirectMessagePolls',
		'DirectMessageReactions',
		'DirectMessageTyping',
		'GuildMessageReactions',
	],
});

eventHandler(client);

client.login(process.env.TOKEN);
