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

// ==========================================================================
function formatTime(timestamp) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const seconds = date.getSeconds().toString().padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ==========================================================================
class ModifiedFile {
	constructor(file, relativePath) {
		this.file = file;
		this.modified = 1;
		this.webkitRelativePath = relativePath;
	}
}

async function traverseDirectory(directoryEntry) {
	const fileList = [];
	const entries = await new Promise((resolve) =>
		directoryEntry.createReader().readEntries(resolve)
	);

	for (let entry of entries) {
		if (entry.isDirectory) {
			const subList = await traverseDirectory(entry);
			fileList.push(...subList);
		} else {
			const file = await new Promise((resolve) => entry.file(resolve));
			// console.log("entry.fullPath: ", entry.fullPath);

			const modified = new ModifiedFile(
				file,
				entry.fullPath.replace(/^\//, "")
			);
			console.log("newFile: ", modified);
			fileList.push(modified);
		}
	}

	return fileList;
}

// ==========================================================================
function notiCard(text, width = 270) {
	return new Noty({
		text: text,
		layout: "topCenter",
		closeWith: ["click"],
		timeout: 3000,
		theme: "custom-theme",
		progressBar: false,
		callbacks: {
			onTemplate: function () {
				this.barDom.style.width = `${width}px`;
			},
		},
	});
}

// ==========================================================================
function copyToClipboard(text) {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			console.log("Text copied to clipboard");
		})
		.catch((err) => {
			console.error("Error copying text to clipboard:", err);
		});

	// // workaround when clipboard cannot be used
	// const input = document.createElement("textarea");
	// input.value = text;
	// document.body.appendChild(input);
	// input.select();
	// document.execCommand("copy");
	// document.body.removeChild(input);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export {
	splitFileIntoChunks,
	formatTime,
	traverseDirectory,
	notiCard,
	copyToClipboard,
  capitalizeFirstLetter
};
