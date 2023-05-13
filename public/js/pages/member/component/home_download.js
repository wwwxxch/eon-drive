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
	const uploadClose = $("#waiting-close");

	downloadModal.modal("show");
	downloadStatus.text("Downloading...");
	downloadSpinner.addClass("spinner-border");
	downloadComplete.hide();
	downloadError.html();
	uploadClose.hide();

	const downloadFileRes = await downloadFile(currentPath, checkboxes);
	console.log("downloadFileRes: ", downloadFileRes);

	checkboxes.prop("checked", false);
	$("#delete-btn-div").hide();
	$("#download-btn-div").hide();

	$(window).on("beforeunload", function () {
		return "Downloading will be interrupted";
	});

	if (downloadFileRes.status === 200 && downloadFileRes.downloadUrl) {
		downloadSpinner.removeClass("spinner-border");
		downloadComplete.show();
		downloadStatus.text("Complete!");
		uploadClose.show();

		setTimeout(() => downloadModal.modal("hide"), 500);
		setTimeout(() => window.open(downloadFileRes.downloadUrl, "_blank"), 200);

		$(window).off("beforeunload");
		return;
	} else if (downloadFileRes.status !== 200 && downloadFileRes.status !== 500) {
		let errorHTML;
		if (typeof downloadFileRes.data.error === "string") {
			errorHTML = `<span>${downloadFileRes.data.error}</span>`;
		} else {
			errorHTML = downloadFileRes.data.error.map((err) => `<span>${err}</span>`).join("");
		}
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(errorHTML);
	} else {
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(
			"<span>Opps! Something went wrong. Please try later or contact us.</span>"
		);
	}

	setTimeout(() => downloadModal.modal("hide"), 2000);
	$(window).off("beforeunload");
});
