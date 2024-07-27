import * as fs from 'fs';
import * as path from 'path';

const getAllFiles = (directory: string, foldersOnly: boolean = false) => {
	let fileNames: string[] = [];

	const files = fs.readdirSync(directory, { withFileTypes: true });

	for (const file of files) {
		let filePath = path.join(directory, file.name);

		if (foldersOnly) {
			if (file.isDirectory()) fileNames.push(filePath);
		} else {
			if (file.isFile()) fileNames.push(filePath);
		}
	}

	return fileNames;
};

export default getAllFiles;
