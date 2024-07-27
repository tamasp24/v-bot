import { User } from '@prisma/client';
import {
	APIApplicationCommandOption,
	ChatInputCommandInteraction,
	Client,
	CommandInteraction,
} from 'discord.js';

export type Command = {
	name: string;
	description: string;
	aliases: string[];
	ownerOnly: boolean;
	devOnly: boolean;
	options: APIApplicationCommandOption[];
	dmPermission: boolean;
	execute: (
		client: Client,
		interaction: ChatInputCommandInteraction,
		requester?: User | null
	) => void;
};
