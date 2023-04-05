async function splitFileIntoChunks(file, chunk_size) {
	const chunks = [];

	let start = 0;
	let end = chunk_size;
	while (start < file.size) {
		const chunk = file.slice(start, end);
		chunks.push(chunk);
		start = end;
		end = start + chunk_size;
	}

	return chunks;
}

export { splitFileIntoChunks };