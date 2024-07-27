import { Client } from 'discord.js';
import { Command } from '../../types/command';

const getCommands = require('../../utils/getCommands');

module.exports = async (client: Client) => {
	console.log(`${client.user?.tag} is up and running.`);

	const commands: Command[] = getCommands();

	for (const command of commands) {
		let { name, description, options, dmPermission } = command;

		await client.application?.commands.create({
			name,
			description,
			options,
			dmPermission,
		});

		console.log(`Command ${name} has been registered.`);
	}
};
