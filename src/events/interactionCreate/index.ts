import { Client, Interaction } from 'discord.js';
import { Command } from '../../types/command';
import prisma from '../../utils/prisma';

const DEV_COMMANDS_WHITELIST: string[] =
	process.env.DEV_COMMANDS_WHITELIST?.split(',') ?? [];

module.exports = async (client: Client, interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const commands: Command[] = require('../../utils/getCommands')();
	const commandRun = commands.find(
		(cmd) => cmd.name === interaction.commandName
	);

	const requester = await prisma.user.findFirst({
		where: {
			discord_id: interaction.user.id,
		},
	});

	if (
		commandRun?.ownerOnly &&
		!requester?.owner &&
		DEV_COMMANDS_WHITELIST?.includes(interaction.user.id) === false
	)
		return await interaction.reply({
			content: '🚫 You must be an owner to use this command.',
			ephemeral: true,
		});

	if (
		commandRun?.devOnly &&
		!requester?.owner &&
		!requester?.developer &&
		!DEV_COMMANDS_WHITELIST.includes(interaction.user.id)
	)
		return interaction.reply({
			content: 'Only devs can use this command.',
			ephemeral: true,
		});

	commandRun?.execute(client, interaction, requester);
};
