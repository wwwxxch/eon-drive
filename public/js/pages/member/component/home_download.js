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
  // const selected = checkboxes.map(function() {
  //   return $(this).closest("tr").find(".ff_name").data("id");
  // }).get();
  // console.log("selected: ", selected);

  const downloadModal = $("#waitingModal");
	const downloadStatus = $(".waiting-status");
  downloadModal.modal("show");
  downloadStatus.text("Downloading...");
  $("#waiting-spinner").addClass("spinner-border");
  $(".waiting-complete").hide();
	const downloadFileRes = await downloadFile(currentPath, checkboxes);
	console.log("downloadFileRes: ", downloadFileRes);

	if (downloadFileRes.status === 200) {
    $("#waiting-spinner").removeClass("spinner-border");
    $(".waiting-complete").show();
    setTimeout(() => downloadStatus.text("Complete!"), 200);
    setTimeout(() => downloadModal.modal("hide"), 1500);
		window.open(downloadFileRes.downloadUrl, "_blank");
	}

	checkboxes.prop("checked", false);
	$("#delete-btn-div").hide();
	$("#download-btn-div").hide();
});