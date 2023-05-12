import { downloadShareFi } from "../../api/view.js";

// download file
$(".fi-dl-btn").on("click", async function () {
	const windowPathName = window.location.pathname;
	const shareToken = windowPathName.split("/")[3];
	console.log(shareToken);

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

	const downloadFileRes = await downloadShareFi(shareToken);
	console.log("downloadFileRes: ", downloadFileRes);

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
		const errorHTML = "<span>Opps! Something went wrong. Please try later or contact us.</span>";
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(errorHTML);
	}

	setTimeout(() => downloadModal.modal("hide"), 2000);
	$(window).off("beforeunload");
	return;
});
