import { downloadShareFi } from "../../api/view.js";

// download file
$(".fi-dl-btn").on("click", async function() {
  const windowPathName = window.location.pathname;
	const shareToken = windowPathName.split("/")[3];
	console.log(shareToken);
  
  const downloadModal = $("#waitingModal");
	const downloadStatus = $(".waiting-status");
  downloadModal.modal("show");
  downloadStatus.text("Downloading...");
  $("#waiting-spinner").addClass("spinner-border");
  $(".waiting-complete").hide();

  const downloadFileRes = await downloadShareFi(shareToken);
  if (downloadFileRes.status === 200) {
    $("#waiting-spinner").removeClass("spinner-border");
    $(".waiting-complete").show();
    setTimeout(() => downloadStatus.text("Complete!"), 200);
    setTimeout(() => downloadModal.modal("hide"), 1500);
		window.open(downloadFileRes.downloadUrl, "_blank");
	}
});