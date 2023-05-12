async function splitFileIntoChunks(file, fileSize, chunk_size) {
	const chunks = [];

	let start = 0;
	let end = chunk_size;
	while (start < fileSize) {
		const chunk = file.slice(start, end);
		chunks.push(chunk);
		start = end;
		end = start + chunk_size;
	}

	return chunks;
}

// ==========================================================================
function formatTime(timestamp, format = "yyyy-MM-dd HH:mm:ss") {
	// console.log("timestamp: ", timestamp);
	const userTimezoneOffset = new Date().getTimezoneOffset();
	const timeZone = luxon.DateTime.local().minus({
		minutes: userTimezoneOffset,
	}).zoneName;
	return luxon.DateTime.fromISO(timestamp).setZone(timeZone).toFormat(format);
}

// ==========================================================================
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve(), ms));
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

			const modified = new ModifiedFile(file, entry.fullPath.replace(/^\//, ""));
			console.log("newFile: ", modified);
			fileList.push(modified);
		}
	}

	return fileList;
}

// ==========================================================================
function notiCard(text, width = 270, layout = "topCenter") {
	return new Noty({
		text: text,
		layout: layout,
		closeWith: ["click"],
		timeout: 2000,
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

// ==========================================================================
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

// ==========================================================================
function isValidEmail(email) {
	const re = /\S+@\S+\.\S+/;
	return re.test(email);
}

export {
	splitFileIntoChunks,
	formatTime,
	delay,
	traverseDirectory,
	notiCard,
	copyToClipboard,
	capitalizeFirstLetter,
	isValidEmail,
};
