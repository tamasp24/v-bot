import { ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../types/command';

const command: Command = {
	name: 'screen',
	description: `View a user's profile. They will get a request, which they have to accept. Open DMs required.`,
	aliases: [],
	ownerOnly: false,
	devOnly: false,
	dmPermission: true,
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: 'user',
			description: `The target user.`,
		},
	],
	execute: async (client, interaction) => {
		const user = interaction.options.getUser('user');

		if (!user)
			return await interaction.reply({
				content: `No user specified.`,
				ephemeral: true,
			});

		user.send({
			content: 'Hi.',
		})
			.then(() => {
				interaction.reply({
					content: `I have sent a screening request to ${user.username}. They have 60 seconds to respond.`,
					ephemeral: true,
				});
			})
			.catch((err) => {
				console.log(err);

				interaction.reply({
					content: `Unable to DM user. To run this command, the recipient must have their DMs turned on.`,
					ephemeral: true,
				});
			});
	},
};

module.exports = command;
