import { downloadFile } from "../../../api/download.js";

// download
$("#download-btn").click(async function () {
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const checkboxes = $("input[name='list-checkbox']:checked");

	const downloadModal = $("#waitingModal");
	const downloadStatus = $("#waiting-status");
  const downloadSpinner = $("#waiting-spinner");
  const downloadComplete = $("#waiting-complete");
  const downloadError = $("#waiting-error");

	downloadModal.modal("show");
	downloadStatus.text("Downloading...");
	downloadSpinner.addClass("spinner-border");
	downloadComplete.hide();
  downloadError.html();

	const downloadFileRes = await downloadFile(currentPath, checkboxes);
	console.log("downloadFileRes: ", downloadFileRes);

	checkboxes.prop("checked", false);
	$("#delete-btn-div").hide();
	$("#download-btn-div").hide();
  
	if (downloadFileRes.status === 200) {
    downloadSpinner.removeClass("spinner-border");
		// setTimeout(() => downloadStatus.text("Complete!"), 100);
		setTimeout(() => downloadModal.modal("hide"), 200);
		window.open(downloadFileRes.downloadUrl, "_self");
    return;

	} else if (downloadFileRes.status !== 500) {
		let errorHTML;
		if (typeof downloadFileRes.data.error === "string") {
			errorHTML = `<span>${downloadFileRes.data.error}</span>`;
		} else {
			errorHTML = downloadFileRes.data.error
				.map((err) => `<span>${err}</span>`)
				.join("");
		}
    downloadSpinner.removeClass("spinner-border");
    downloadStatus.text("");
    downloadError.html(errorHTML);

	} else {
    downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
    downloadError.html(
      "<span>Opps! Something went wrong. Please try later or contact us.</span>");
	}
  setTimeout(() => downloadModal.modal("hide"), 2000);
});
