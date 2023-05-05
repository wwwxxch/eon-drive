import { uploadFile } from "../../../api/upload.js";
import { traverseDirectory, notiCard } from "../../../util/util.js";

const blankNoti = notiCard("Cannot upload empty file or folder", 265);
const fileNameLengthNoti = notiCard(
	"File name should be 1 - 255 characters long",
	343
);
const fileNameRegexNoti = notiCard(
	"File name is invalid.<br>Only below characters are allowed: &nbsp <b>_-.@$</b>",
	313
);

// const ffRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.@$ ]+$/;
const ffRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.@$ \[\]\(\)\+]+$/;

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

		// 1. get e.originalEvent.dataTransfer.items
		const items = e.originalEvent.dataTransfer.items;
		// console.log("items: ", items);

		// 2. get webkitGetAsEntry
		let entries = [];
		for (let i = 0; i < items.length; i++) {
			entries.push(items[i].webkitGetAsEntry());
		}
		// console.log("entries:", entries);

		// 3. get file list
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

		if (arr.length === 0) {
			blankNoti.show();
		}

		const uploadModal = $("#waitingModal");
		const uploadStatus = $("#waiting-status");
		const uploadSpinner = $("#waiting-spinner");
		const uploadComplete = $("#waiting-complete");
		const uploadError = $("#waiting-error");

		const modalObj = {
			uploadModal,
			uploadStatus,
			uploadSpinner,
			uploadComplete,
			uploadError,
		};

		// 4. start upload
    
		for (let element of arr) {
			let fileUsed = {};
			if (element.modified) {
				fileUsed.name = element.file.name;
				fileUsed.size = element.file.size;
				fileUsed.webkitRelativePath = element.webkitRelativePath;
			} else {
				fileUsed = element;
			}
			if (fileUsed.size === 0) {
				blankNoti.show();
				break;
			}
			if (!fileUsed.name.match(ffRegex)) {
				fileNameRegexNoti.show();
				break;
			}
			if (fileUsed.name.length > 255 || fileUsed.name.trim().length < 1) {
				fileNameLengthNoti.show();
				break;
			}
      $(window).on("beforeunload", function () {
        return "Uploading will be interrupted";
      });
			const uploadFileRes = await uploadFile(currentPath, element, modalObj);
			console.log("uploadFileRes: ", uploadFileRes);
      if (uploadFileRes === false) {
        $(window).off("beforeunload");
        return;
      }
		}
    // After all files are uploaded, showing the complete message
    console.log("check");
    modalObj.uploadSpinner.removeClass("spinner-border");
		modalObj.uploadComplete.show();
		setTimeout(() => modalObj.uploadStatus.text("Complete!"), 100);
		setTimeout(() => modalObj.uploadModal.modal("hide"), 1500);
    
    $(window).off("beforeunload");
    return;
	});
});

// =================================================================================
// Form Input
const $fileUploadBtn = $("#file-upload-btn");
const $fileInput = $("#file-input");
const $fileForm = $("#file-form");
const $folderUploadBtn = $("#folder-upload-btn");
const $folderInput = $("#folder-input");
const $folderForm = $("#folder-form");

function showInputTag(btn, input) {
	btn.on("click", function () {
		input.click();
	});
}

function triggerSubmit(input, form) {
	input.on("change", function () {
		form.trigger("submit");
	});
}

async function submitForm(form, input) {
	form.on("submit", async function (e) {
		e.preventDefault();
		const currentPath = $(".path-text")
			.map(function () {
				return $(this).text().trim();
			})
			.get()
			.join("/");
		console.log(currentPath);

		const fileList = input[0].files;
		console.log("fileList: ", fileList);

		const uploadModal = $("#waitingModal");
		const uploadStatus = $("#waiting-status");
		const uploadSpinner = $("#waiting-spinner");
		const uploadComplete = $("#waiting-complete");
		const uploadError = $("#waiting-error");

		const modalObj = {
			uploadModal,
			uploadStatus,
			uploadSpinner,
			uploadComplete,
			uploadError,
		};

		// start upload
		for (let file of fileList) {
			if (file.size === 0) {
				blankNoti.show();
				break;
			}
			if (file.size === 0) {
				blankNoti.show();
				break;
			}
			if (!file.name.match(ffRegex)) {
				fileNameRegexNoti.show();
				break;
			}
			if (file.name.length > 255 || file.name.length < 1) {
				fileNameLengthNoti.show();
				break;
			}
      $(window).on("beforeunload", function () {
        return "Uploading will be interrupted";
      });
			const uploadFileRes = await uploadFile(currentPath, file, modalObj);
			console.log("uploadFileRes: ", uploadFileRes);
      if (uploadFileRes === false) {
        $(window).off("beforeunload");
        return;
      }
		}

		// After all files are uploaded, showing the complete message
    console.log("check");
    modalObj.uploadSpinner.removeClass("spinner-border");
		modalObj.uploadComplete.show();
		setTimeout(() => modalObj.uploadStatus.text("Complete!"), 100);
		setTimeout(() => modalObj.uploadModal.modal("hide"), 1500);
    
    $(window).off("beforeunload");
    return;
	});
}

showInputTag($fileUploadBtn, $fileInput);
showInputTag($("#drag-drop-box"), $fileInput);
triggerSubmit($fileInput, $fileForm);
submitForm($fileForm, $fileInput);
showInputTag($folderUploadBtn, $folderInput);
triggerSubmit($folderInput, $folderForm);
submitForm($folderForm, $folderInput);
