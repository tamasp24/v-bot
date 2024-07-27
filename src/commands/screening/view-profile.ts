import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	Interaction,
} from 'discord.js';
import { Command } from '../../types/command';
import prisma from '../../utils/prisma';

const command: Command = {
	name: 'screen',
	description: `View a user's profile. They will get a request, which they have to accept. Open DMs required.`,
	aliases: [],
	ownerOnly: false,
	devOnly: false,
	dmPermission: true,
	allowTargetingBots: false,
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: 'user',
			description: `The target user.`,
		},
	],
	execute: async (client, interaction) => {
		const SCREENING_REQUEST_TIME = 60_000;
		const user = interaction.options.getUser('user');
		const userInfo = await prisma.user.findFirst({
			where: {
				discord_id: user?.id,
			},
		});

		if (!user)
			return await interaction.reply({
				content: `No user specified.`,
				ephemeral: true,
			});

		if (user.bot)
			return await interaction.reply({
				content: `Bots cannot be sent screening requests.`,
				ephemeral: true,
			});

		const acceptBtn = new ButtonBuilder()
			.setCustomId(`accept-${user.id}`)
			.setLabel('Accept')
			.setEmoji('✔')
			.setStyle(ButtonStyle.Success);
		const declineBtn = new ButtonBuilder()
			.setCustomId(`decline-${user.id}`)
			.setLabel('Decline')
			.setEmoji('✖')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);

		let request = await interaction.channel?.send({
			content: `<@${user.id}> **${interaction.user.displayName}** from __${interaction.guild?.name}__ wants to view your profile. They will only see your information if you accept their request.`,
			ephemeral: true,
			// @ts-ignore
			components: [row],
		});

		await interaction.reply({
			content: `A screening request has been sent to ${
				user.displayName
			}. They have ${SCREENING_REQUEST_TIME / 1000} seconds to respond.`,
			ephemeral: true,
		});

		let requestListener = request?.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: SCREENING_REQUEST_TIME,
			filter: (u) => u.user.id === user.id,
		});

		let responded: boolean = false;

		requestListener?.on('collect', async (collected: Interaction) => {
			// @ts-ignore
			let response = collected.customId as string;
			let accepted = response.split('-')[0] === 'accept' ? true : false;

			if (accepted && userInfo) {
				await request?.edit({
					content: `You have accepted ${interaction.user.displayName}'s screening request. They will be shown an ephemeral message of your profile.
                    \n*Ephemeral messages are temporary and only visible to the requester.*`,
					components: [],
				});
				await interaction.editReply({
					content: `✅ **${user.displayName} has accepted your screening request.**
                    \n
					> **Introduction:** "${userInfo.introduction}"
                    > **Gender:** ${userInfo.gender}`,
				});

				responded = true;

				return requestListener.stop();
			} else {
				await request?.edit({
					content: `🚫 You have declined ${interaction.user.displayName}'s screening request. They will not be able to see your profile.`,
					components: [],
				});
				await interaction.editReply({
					content: `🚫 ${user.displayName} has declined your screening request, or they are not in my database yet.`,
				});

				responded = true;

				return requestListener.stop();
			}
		});

		requestListener?.on('end', async () => {
			if (responded) return;

			await request?.edit({
				content: `⌛ You took too long. The screening request has expired.`,
				components: [],
			});
			await interaction.editReply({
				content: `[⌛ Expired] ${user.displayName} failed to respond in time.`,
			});
		});
	},
};

module.exports = command;
