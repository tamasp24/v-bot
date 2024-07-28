import { ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../types/command';
import prisma from '../../utils/prisma';
import updateUser from '../../utils/updateUser';

const command: Command = {
	name: 'developer',
	description: 'Manage developers.',
	aliases: [],
	enabled: true,
	ownerOnly: true,
	devOnly: false,
	dmPermission: false,
	allowTargetingBots: false,
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'add',
			description: 'Give user developer perms',
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: 'user',
					description: 'User to give owner perms to',
					required: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'remove',
			description: 'Remove developer perms from user',
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: 'user',
					description: 'User to give developer perms to',
					required: true,
				},
			],
		},
	],
	execute: async (client, interaction) => {
		const action = interaction.options.getSubcommand();
		const target = interaction.options.getUser('user');

		if (!target) {
			return await interaction.reply({
				content: 'No user provided.',
				ephemeral: true,
			});
		}

		if (target.bot) {
			return await interaction.reply({
				content: 'I only serve humans.',
				ephemeral: true,
			});
		}

		if (action === 'add') {
			updateUser({
				discord_id: target.id,
				field: 'developer',
				value: true,
			})
				.then(async () => {
					await interaction.reply({
						content: `🛠 <@${target.id}> has been given developer permissions. Remember, with great power comes great responsibility.`,
					});
				})
				.catch(async (err) => {
					console.log(err);
					await interaction.reply({
						content: `Database operation failed. Unable to give <@${target.id}> permissions.`,
					});
				});
		} else if (action === 'remove') {
			updateUser({
				discord_id: target.id,
				field: 'developer',
				value: false,
			})
				.then(async () => {
					await interaction.reply({
						content: `<@${target.id}>'s developer permissions have been revoked.`,
					});
				})
				.catch(async (err) => {
					console.log(err);
					await interaction.reply({
						content: `Database operation failed. Unable to give <@${
							target.id
						}> permissions. Message:\n> ${err.toString()}`,
					});
				});
		}
	},
};

module.exports = command;
