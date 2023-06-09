import { createFolder } from "../../../api/create_folder.js";
import { notiCard } from "../../../utils/utils.js";

const folderNameLengthNoti = notiCard(
	"Folder name should be 1 - 255 characters long",
	343
);
const folderNameRegexNoti = notiCard(
	"Folder name is invalid.<br>Only below characters are allowed: &nbsp <b>_-.@$</b>",
	313
);

const folderCreatedNoti = notiCard("Folder created successfully", 210);
const ffRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.@$ ]+$/;

// Create folder
$("#create-btn").on("click", async function () {
	const createFolderNameInput = $("#create-folder-name");
	const createFolderModal = $("#createFolderModal");

	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const createFolderName = createFolderNameInput.val().trim();

	console.log("create: ", currentPath);
	console.log("create: ", createFolderName);

	if (createFolderName.length > 255 || createFolderName.length < 1) {
		folderNameLengthNoti.show();
		createFolderNameInput.val("");
		return;
	}

	if (!createFolderName.match(ffRegex)) {
		folderNameRegexNoti.show();
		createFolderNameInput.val("");
		return;
	}

	const createFolderRes = await createFolder(currentPath, createFolderName);
	console.log("createFolderRes: ", createFolderRes);

	if (createFolderRes.status !== 200) {
		createFolderModal.modal("hide");
		createFolderNameInput.val("");

		let errorHTML;
		if (typeof createFolderRes.data.error === "string") {
			errorHTML = `<span>${createFolderRes.data.error}</span>`;
		} else {
			errorHTML = createFolderRes.data.error.map((err) => `<span>${err}</span>`).join("");
		}
		$("#errorModal").modal("show");
		$("#error-msg").html(errorHTML);

		return;
	}

	createFolderModal.modal("hide");
	createFolderNameInput.val("");

	folderCreatedNoti.show();
});
