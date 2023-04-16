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

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export { splitFileIntoChunks, formatTime };
