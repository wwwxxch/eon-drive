async function splitFileIntoChunks(file, chunk_size) {
	const CHUNK_SIZE = chunk_size * 1024 * 1024; // MB
	const chunks = [];

	let start = 0;
	let end = CHUNK_SIZE;
	while (start < file.size) {
		const chunk = file.slice(start, end);
		chunks.push(chunk);
		start = end;
		end = start + CHUNK_SIZE;
	}

	return chunks;
}

export { splitFileIntoChunks };