import { ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../types/command';
import prisma from '../../utils/prisma';

const command: Command = {
	name: 'owner',
	description: 'Manage owners.',
	aliases: [],
	ownerOnly: true,
	devOnly: false,
	dmPermission: false,
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'add',
			description: 'Give user owner perms',
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
			description: 'Remove owner perms from user',
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: 'user',
					description: 'User to give owner perms to',
					required: true,
				},
			],
		},
	],
	execute: async (client, interaction) => {
		const DEV_WHITELIST = process.env.DEV_COMMANDS_WHITELIST?.split(',');
		const action = interaction.options.getSubcommand();
		const target = interaction.options.getUser('user');

		if (!target)
			return await interaction.reply({
				content: 'No user provided.',
				ephemeral: true,
			});

		if (target.bot)
			return await interaction.reply({
				content: 'I only serve humans.',
				ephemeral: true,
			});

		if (action === 'add') {
			prisma.user
				.upsert({
					where: {
						discord_id: target.id,
					},
					update: {
						owner: true,
					},
					create: {
						discord_id: target.id,
						owner: true,
					},
				})
				.then(async () => {
					await interaction.reply({
						content: `👑 <@${target.id}> has been given owner permissions. Remember, with great power comes great responsibility.`,
					});
				})
				.catch(async (err) => {
					console.log(err);
					await interaction.reply({
						content: `Database operation failed. Unable to give <@${target.id}> permissions.`,
					});
				});
		} else if (action === 'remove') {
			if (DEV_WHITELIST?.includes(target.id) === true)
				return await interaction.reply({
					content: `This user is a permanent owner whose permissions cannot be revoked.`,
					ephemeral: true,
				});

			prisma.user
				.update({
					where: {
						discord_id: target.id,
					},
					data: {
						owner: false,
					},
				})
				.then(async () => {
					await interaction.reply({
						content: `<@${target.id}>'s owner permissions have been revoked.`,
					});
				})
				.catch(async (err) => {
					console.log(err);
					await interaction.reply({
						content: `Database operation failed. Unable to give <@${target.id}> permissions.`,
					});
				});
		}
	},
};

module.exports = command;
