import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	ModalBuilder,
	ModalSubmitInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { Command } from '../../types/command';
import updateUser from '../../utils/updateUser';
import prisma from '../../utils/prisma';

const command: Command = {
	name: 'profile',
	description: 'Manage your profile.',
	aliases: [],
	enabled: true,
	ownerOnly: false,
	devOnly: false,
	dmPermission: false,
	allowTargetingBots: false,
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'gender',
			description: 'Set your gender',
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'introduction',
			description: 'Set your introduction',
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'age',
			description: 'Set your age',
			options: [
				{
					type: ApplicationCommandOptionType.Integer,
					name: 'age-value',
					required: true,
					description: 'Must be a whole number',
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'delete',
			description: `Delete your profile from the bot's database.`,
		},
	],
	execute: async (client, interaction, requester) => {
		const INTRODUCTION_MODAL_TIMEOUT = 60_000;
		const GENDER_SELECT_TIMEOUT = 30_000;
		const subcommand = interaction.options.getSubcommand();

		const modal = new ModalBuilder()
			.setCustomId(`introduction-modal-${interaction.user.id}`)
			.setTitle('Your Introduction');
		const genderSelect = new StringSelectMenuBuilder()
			.setCustomId('gender')
			.setPlaceholder('Select your gender')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Male')
					.setEmoji('♂️')
					.setValue('male'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Female')
					.setEmoji('♀️')
					.setValue('female'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Prefer not to say')
					.setEmoji('👤')
					.setValue('other')
			);

		const modalIntroductionTextField = new TextInputBuilder()
			.setCustomId('introduction-content')
			.setLabel('Tell us about yourself')
			.setStyle(TextInputStyle.Paragraph);

		if (requester)
			modalIntroductionTextField.setValue(requester.introduction ?? '');

		const modalActionRow = new ActionRowBuilder().addComponents(
			modalIntroductionTextField
		);

		const selectRow = new ActionRowBuilder().addComponents(genderSelect);

		if (subcommand === 'gender') {
			const reply = await interaction.reply({
				content: '**Choose your gender**',
				ephemeral: true,
				// @ts-ignore
				components: [selectRow],
			});

			const collector = reply.createMessageComponentCollector({
				filter: (i) => i.user.id === interaction.user.id,
				time: GENDER_SELECT_TIMEOUT,
			});

			let respondedBeforeTimeout: boolean = false;

			collector.on('collect', async (collected: Interaction) => {
				// @ts-ignore
				let values = collected.values;

				if (values[0] === 'other') {
					await reply.edit({
						content: `https://tenor.com/view/rick-roll-rick-ashley-never-gonna-give-you-up-gif-22113173`,
						components: [],
					});
				} else {
					updateUser({
						discord_id: interaction.user.id,
						field: 'gender',
						value: values[0],
					})
						.then(async () => {
							return await reply.edit({
								// @ts-ignore
								content: `Updated your gender to **${values[0]}**.`,
								components: [],
							});
						})
						.catch(async (err) => {
							console.log(err);
							return await reply.edit({
								// @ts-ignore
								content: `An error occurred. Message:\n${err.toString()}`,
								components: [],
							});
						});
				}

				respondedBeforeTimeout = true;

				return collector.stop();
			});

			collector.on('end', async (collected: Interaction) => {
				if (!respondedBeforeTimeout)
					return await reply.edit({
						content: 'You did not respond in time.',
						components: [],
					});
			});
		} else if (subcommand === 'introduction') {
			// @ts-ignore
			modal.addComponents(modalActionRow);

			await interaction.showModal(modal);

			interaction
				.awaitModalSubmit({
					filter: (i) =>
						i.customId ===
						`introduction-modal-${interaction.user.id}`,
					time: INTRODUCTION_MODAL_TIMEOUT,
				})
				.then(async (response: ModalSubmitInteraction) => {
					let intro = response.fields.getTextInputValue(
						'introduction-content'
					);

					updateUser({
						discord_id: interaction.user.id,
						field: 'introduction',
						value: intro,
					})
						.then(async () => {
							return await response.reply({
								// @ts-ignore
								content: `Updated your introduction to:\n> ${intro}`,
								components: [],
								ephemeral: true,
							});
						})
						.catch(async (err) => {
							console.log(err);
							return await response.reply({
								// @ts-ignore
								content: `An error occurred. Message:\n> ${err.toString()}`,
								components: [],
								ephemeral: true,
							});
						});
				});
		} else if (subcommand === 'age') {
			const age = interaction.options.getInteger('age-value');

			if (!age) {
				return await interaction.reply({
					content: `No age was provided.`,
					ephemeral: true,
				});
			}

			updateUser({
				discord_id: interaction.user.id,
				field: 'age',
				value: age,
			})
				.then(async () => {
					return await interaction.reply({
						content: `Your age has been set to **${age}**.`,
						ephemeral: true,
					});
				})
				.catch(async (err) => {
					console.log(err);
					return await interaction.reply({
						content: `An error occurred. Message:\n${err.toString()}`,
						ephemeral: true,
					});
				});
		} else if (subcommand === 'delete') {
			const YES_BUTTON = new ButtonBuilder()
				.setCustomId('yes')
				.setLabel('Yes')
				.setStyle(ButtonStyle.Success);
			const NO_BUTTON = new ButtonBuilder()
				.setCustomId('no')
				.setLabel('No')
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder().addComponents(
				YES_BUTTON,
				NO_BUTTON
			);

			const prompt = await interaction.reply({
				content: `Are you sure you want to delete the information I have on file?`,
				// @ts-ignore
				components: [row],
				ephemeral: true,
			});

			const promptListener = prompt.createMessageComponentCollector({
				time: 20_000,
				filter: (i) => i.user.id === interaction.user.id,
			});

			promptListener.on('collect', async (result: Interaction) => {
				// @ts-ignore
				if (result.customId === 'yes') {
					prisma.user
						.delete({
							where: {
								discord_id: interaction.user.id,
							},
						})
						.then(async () => {
							return await interaction.editReply({
								content: `**Your profile has been deleted.**`,
								components: [],
							});
						})
						.catch(async (err) => {
							console.log(err);
							return await interaction.editReply({
								content: `An error occurred. Message:\n${err.toString()}`,
								components: [],
							});
						});
				} else await interaction.deleteReply();

				promptListener.stop();
			});
		}
	},
};

module.exports = command;
