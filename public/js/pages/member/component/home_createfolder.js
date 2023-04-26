import { createFolder } from "../../../api/create_folder.js";

// Create folder
$("#create-btn").on("click", async function () {
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const createFolderName = $("#create-folder-name").val().trim();
	console.log("create: ", currentPath);
	console.log("create: ", createFolderName);
	const createFolderRes = await createFolder(currentPath, createFolderName);
	console.log("createFolderRes: ", createFolderRes);
	// TODO: if (createFolderRes.response.status !== 200)
	if (createFolderRes.data && createFolderRes.data.msg === "Folder existed") {
		alert(`Folder ${createFolderName} has been existed`);
	}
	$("#createFolderModal").modal("hide");
	$("#create-folder-name").val("");
});