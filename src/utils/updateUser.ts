import { User } from '@prisma/client';
import prisma from './prisma';

type Field = keyof User;

type UpdateUserRequest = {
	discord_id: string;
	field: Field;
	value: User[Field];
};

const updateUser = (data: UpdateUserRequest): Promise<User> => {
	return new Promise(async (resolve, reject) => {
		prisma.user
			.upsert({
				where: {
					discord_id: data.discord_id,
				},
				update: {
					[data.field]: data.value,
				},
				create: {
					discord_id: data.discord_id,
					[data.field]: data.value,
				},
			})
			.then((response) => resolve(response))
			.catch((err) => reject(err));
	});
};

export default updateUser;
