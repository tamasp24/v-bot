import { Command } from '../types/command';
import getAllFiles from './getAllFiles';
import path = require('path');

module.exports = (exceptions: string[] = []): Command[] => {
	let localCommands: Command[] = [];

	const commandCategories = getAllFiles(
		path.join(__dirname, '..', 'commands'),
		true
	);

	for (const commandCategory of commandCategories) {
		const commandFiles = getAllFiles(commandCategory);

		for (const commandFile of commandFiles) {
			const commandObject: Command = require(commandFile);

			if (exceptions.includes(commandObject.name)) continue;

			localCommands.push(commandObject);
		}
	}

	return localCommands;
};
