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
	enabled: true,
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
		const FINAL_RESPONSE_TIME = 20_000;

		const user = interaction.options.getUser('user');
		const userInfo = await prisma.user.findFirst({
			where: {
				discord_id: user?.id,
			},
		});

		if (!user) {
			return await interaction.reply({
				content: `No user specified.`,
				ephemeral: true,
			});
		}

		if (user.bot) {
			return await interaction.reply({
				content: `Bots cannot be sent screening requests.`,
				ephemeral: true,
			});
		}

		// MESSAGES
		const MSG_TO_SENDER_REQUEST_PENDING = `A screening request has been sent to ${
			user.displayName
		}. They have ${SCREENING_REQUEST_TIME / 1000} seconds to respond.`;
		const MSG_TO_SENDER_REQUEST_DECLINED = `🚫 ${user.displayName} has declined your screening request.`;

		const MSG_TO_RECIPIENT_REQUEST_PENDING = `<@${user.id}> **${interaction.user.displayName}** from __${interaction.guild?.name}__ wants to view your profile. They will only see your information if you accept their request.`;
		const MSG_TO_RECIPIENT_REQUEST_DECLINED = `🚫 You have declined ${interaction.user.displayName}'s screening request. They will not be able to see your profile.`;

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

		if (!userInfo) {
			return await interaction.reply({
				content: MSG_TO_SENDER_REQUEST_DECLINED,
				ephemeral: true,
			});
		}

		const PROFILE_TEMPLATE = `> **Introduction:** ${userInfo.introduction}
                    > **Gender:** ${userInfo.gender}
					> **Age:** ${userInfo.age}`;

		if (user.id == interaction.user.id) {
			return await interaction.reply({
				content: `Here's the information I have on file:\n${PROFILE_TEMPLATE}\n-# This is the information other users will see if you accept their requests.`,
				ephemeral: true,
			});
		}

		const request = await interaction.channel?.send({
			content: MSG_TO_RECIPIENT_REQUEST_PENDING,
			ephemeral: true,
			// @ts-ignore
			components: [row],
		});

		await interaction.reply({
			content: MSG_TO_SENDER_REQUEST_PENDING,
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
                    \n-# Ephemeral messages are temporary and only visible to the requester. For more information, [visit the Discord page](https://support.discord.com/hc/en-us/articles/1500000580222-Ephemeral-Messages-FAQ).`,
					components: [],
				});
				await interaction.editReply({
					content: `✅ **${user.displayName} has accepted your screening request.**
					${PROFILE_TEMPLATE}`,
				});

				responded = true;
				return requestListener.stop();
			} else {
				await request?.edit({
					content: MSG_TO_RECIPIENT_REQUEST_DECLINED,
					components: [],
				});
				await interaction.editReply({
					content: MSG_TO_SENDER_REQUEST_DECLINED,
				});

				responded = true;

				return requestListener.stop();
			}
		});

		requestListener?.on('end', async () => {
			if (responded === false) {
				await request?.edit({
					content: `⌛ You took too long. The screening request has expired.`,
					components: [],
				});
				await interaction.editReply({
					content: `⌛ ${user.displayName} failed to respond in time.`,
				});
			}

			setTimeout(async () => {
				try {
					return await request?.delete();
				} catch (error) {
					console.log(`Message has already been deleted.`);
					return;
				}
			}, FINAL_RESPONSE_TIME);
		});
	},
};

module.exports = command;
