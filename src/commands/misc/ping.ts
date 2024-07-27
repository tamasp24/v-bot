import {
	ApplicationCommandOptionType,
	Client,
	CommandInteraction,
} from 'discord.js';
import { Command } from '../../types/command';

const command: Command = {
	name: 'ping',
	description: 'Responds with a test reply.',
	aliases: [],
	ownerOnly: false,
	devOnly: false,
	dmPermission: false,
	options: [
		{
			type: ApplicationCommandOptionType.String,
			required: false,
			name: 'input',
			description: 'Input a string.',
		},
		{
			type: ApplicationCommandOptionType.Boolean,
			required: false,
			name: 'ephemeral',
			description: 'The reply will be ephemeral.',
		},
	],
	execute: async (client: Client, interaction: CommandInteraction) => {
		let ephemeral =
			(interaction.options.get('ephemeral')?.value as boolean) ?? false;

		if (interaction.options.get('input'))
			return interaction.reply({
				content: 'You said: ' + interaction.options.get('input')?.value,
				ephemeral,
			});

		return await interaction.reply({ content: `Pong`, ephemeral });
	},
};

module.exports = command;
