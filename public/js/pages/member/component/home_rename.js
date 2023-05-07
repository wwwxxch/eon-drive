import { renameFF } from "../../../api/rename.js";
import { notiCard } from "../../../util/util.js";

const ffNameLengthNoti = notiCard(
	"Name should be 1 - 255 characters long",
	343
);
const ffNameRegexNoti = notiCard(
	"Name is invalid.<br>Only below characters are allowed: &nbsp <b>_-.@$</b>",
	313
);

const renameSuccessNoti = notiCard("Renamed successfully", 210);
const ffRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.@$ ]+$/;

// Rename
$("#rename-btn").on("click", async function () {
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
  const ff_id = $("input[name='list-checkbox']:checked").closest("tr").find(".ff-name").data("id"); 
	const renameName = $("#rename-ff-name").val().trim();
	console.log("rename currentPath: ", currentPath);
  console.log("rename ff_id: ", ff_id);
	console.log("rename renameName: ", renameName);

	if (renameName.length > 255 || renameName.length < 1) {
		ffNameLengthNoti.show();
    $("#create-folder-name").val("");
		return;
	}
	if (!renameName.match(ffRegex)) {
		ffNameRegexNoti.show();
    $("#create-folder-name").val("");
		return;
	}

	// const renameRes = await renameFF(currentPath, renameName);
	// console.log("renameRes: ", renameRes);
	// if (renameRes.status !== 200) {
	// 	$("#renameModal").modal("hide");
	// 	$("#rename-ff-name").val("");
	// 	let errorHTML;
	// 	if (typeof renameRes.data.error === "string") {
	// 		errorHTML = `<span>${renameRes.data.error}</span>`;
	// 	} else {
	// 		errorHTML = renameRes.data.error
	// 			.map((err) => `<span>${err}</span>`)
	// 			.join("");
	// 	}
	// 	$("#errorModal").modal("show");
	// 	$("#error-msg").html(errorHTML);
	// 	return;
	// }
	// $("#renameModal").modal("hide");
	// $("#rename-ff-name").val("");

	// renameSuccessNoti.show();
});
