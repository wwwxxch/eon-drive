import { uploadFile } from "../../../api/upload.js";
import { traverseDirectory } from "../../../util/util.js";

// Drag & Drop
$(function () {
	$("#drag-drop-zone").on("dragenter", function (e) {
		e.preventDefault();
		$(this).addClass("drag-over");
		$("#drag-drop-box").addClass("drag-over");
	});

	$("#drag-drop-zone").on("dragover", function (e) {
		e.preventDefault();
		$(this).addClass("drag-over");
		$("#drag-drop-box").addClass("drag-over");
	});

	$("#drag-drop-zone").on("dragleave", function (e) {
		$(this).removeClass("drag-over");
		$("#drag-drop-box").removeClass("drag-over");
	});

	$("#drag-drop-zone").on("drop", async function (e) {
		e.preventDefault();
		$(this).removeClass("drag-over");
		$("#drag-drop-box").removeClass("drag-over");

		const currentPath = $(".path-text")
			.map(function () {
				return $(this).text().trim();
			})
			.get()
			.join("/");

		const items = e.originalEvent.dataTransfer.items;
		// console.log("items: ", items);

		let entries = [];
		for (let i = 0; i < items.length; i++) {
			entries.push(items[i].webkitGetAsEntry());
		}
		// console.log("entries:", entries);

		let arr = [];
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			// console.log("entry: ", entry, entry.isDirectory);

			if (entry.isDirectory) {
				const fileList = await traverseDirectory(entry);
				arr.push(...fileList);
			} else {
				const file = items[i].getAsFile();
				arr.push(file);
			}
		}
		console.log("arr: ", arr);

		const uploadModal = $("#waitingModal");
    const uploadStatus = $(".waiting-status");

		// START UPLOAD
		for (let element of arr) {
			console.log(element);
			const uploadFileRes = await uploadFile(
				currentPath,
				element,
        uploadModal,
        uploadStatus
			);
			console.log("uploadFileRes: ", uploadFileRes);
		}
	});
});

// =================================================================================
// Form Input

$("#file-upload-btn").on("click", function () {
	$("#file-input").click();
});

$("#folder-upload-btn").on("click", function () {
	$("#folder-input").click();
});

$("#file-input").on("change", function () {
	$("#file-form").trigger("submit");
});

$("#folder-input").on("change", function () {
	$("#folder-form").trigger("submit");
});

// File
$("#file-form").on("submit", async function (e) {
	e.preventDefault();
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(currentPath);
	const fileList = $("#file-input")[0].files;
	console.log("fileList: ", fileList);

	const uploadModal = $("#waitingModal");
	const uploadStatus = $(".waiting-status");

	// START UPLOAD
	for (let file of fileList) {
		const uploadFileRes = await uploadFile(
			currentPath,
			file,
			uploadModal,
			uploadStatus
		);
		console.log("uploadFileRes: ", uploadFileRes);
	}

	$("#file-input").val("");
});

// Folder
$("#folder-form").on("submit", async function (e) {
	e.preventDefault();
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(currentPath);
	const fileList = $("#folder-input")[0].files;
	console.log("fileList: ", fileList);

	const uploadModal = $("#waitingModal");
	const uploadStatus = $(".waiting-status");

  // START UPLOAD
	for (let file of fileList) {
		const uploadFileRes = await uploadFile(
			currentPath,
			file,
			uploadModal,
			uploadStatus
		);
		console.log("uploadFileRes: ", uploadFileRes);
	}

	$("#folder-input").val("");
});