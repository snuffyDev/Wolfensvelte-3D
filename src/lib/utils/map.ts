export const getRawMapIndex = (pathname: string) => {
	let level = +pathname.slice(3); // E3M2 -> 2
	const episode = +pathname.slice(1, 2); // E3M2 -> 3
	switch (episode) {
		case 1:
			level += 0;
			break;
		case 2:
			level += 10;
			break;

		case 3:
			level += 20;
			break;

		case 4:
			level += 30;
			break;

		case 5:
			level += 40;
			break;

		case 6:
			level += 50;
			break;

		default:
			level += 0;
			break;
	}
	return level;
};

export const getMapNameFromIndex = (index: number) => {
	const episode = Math.floor(index / 10);
	const level = index % 10;
	return `E${episode}M${level}`;
};
