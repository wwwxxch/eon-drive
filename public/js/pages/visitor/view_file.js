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

	downloadModal.modal("show");
	downloadStatus.text("Downloading...");
	downloadSpinner.addClass("spinner-border");
	downloadComplete.hide();
  downloadError.html();

	const downloadFileRes = await downloadShareFi(shareToken);
  $(window).on("beforeunload", function () {
    return "Downloading will be interrupted";
  });
	if (downloadFileRes.status === 200) {
		downloadSpinner.removeClass("spinner-border");
		setTimeout(() => downloadModal.modal("hide"), 100);
		setTimeout(() => window.open(downloadFileRes.downloadUrl, "_self"), 200);
    $(window).off("beforeunload");
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
		const errorHTML =
			"<span>Opps! Something went wrong. Please try later or contact us.</span>";
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(errorHTML);
	}
  
	setTimeout(() => downloadModal.modal("hide"), 2000);
  $(window).off("beforeunload");
  return;
});
