import { Client } from 'discord.js';
import * as path from 'path';
import getAllFiles from '../utils/getAllFiles';

const eventHandler = (client: Client) => {
	const eventFolders = getAllFiles(
		path.join(__dirname, '..', 'events'),
		true
	);

	for (const eventFolder of eventFolders) {
		const eventFiles = getAllFiles(eventFolder);
		const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();

		if (eventName)
			client.on(eventName, async (arg) => {
				for (const eventFile of eventFiles) {
					const eventFunction = require(eventFile);
					await eventFunction(client, arg);
				}
			});
	}
};

export default eventHandler;
