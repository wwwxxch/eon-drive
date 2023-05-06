import { getFileHistory } from "../../api/list.js";
import { restoreFile } from "../../api/restore.js";
import { singleDownloadFile } from "../../api/download.js";
import { formatTime, delay, capitalizeFirstLetter } from "../../util/util.js";
import { socket } from "../../util/socket.js";
// ===================================================

// show history list
function showHistoryList(obj) {
	const allRecords = [...obj.versions, ...obj.deleteRecords];

	allRecords.sort(
		(a, b) => new Date(b.operation_time) - new Date(a.operation_time)
	);

	let recDiv;
	for (const rec of allRecords) {
		const time = formatTime(rec.operation_time);

		if (rec.operation === "deleted") {
			recDiv = `
        <div style="width: 100%;" 
            class="rec deleted-rec d-flex justify-content-between align-items-center py-3">
          <div class="operation-time col-3 ms-3">${time}</div>
          <div class="action col-3">${capitalizeFirstLetter(
						rec.operation
					)}</div>
          <div class="col-4 d-flex justify-content-between align-items-center">
            <div class="size"></div>
            <div class="restore"></div>
          </div>
        <div>
      `;
		} else if (rec.operation) {
			let showSize;
			if (rec.size < 1024) {
				showSize = `${rec.size} bytes`;
			} else if (rec.size < 1024 * 1024) {
				showSize = `${Math.round((rec.size / 1024) * 100) / 100} KB`;
			} else if (rec.size < 1024 * 1024 * 1024) {
				showSize = `${Math.round((rec.size / (1024 * 1024)) * 100) / 100} MB`;
			} else if (rec.size < 1024 * 1024 * 1024 * 1024) {
				showSize = `${
					Math.round((rec.size / (1024 * 1024 * 1024)) * 100) / 100
				} GB`;
			}

			if (rec.is_current === 1) {
				recDiv = `
        <div style="width: 100%;" 
            class="rec current-rec d-flex justify-content-between align-items-center py-3">
            <div class="operation-time col-3 ms-3">${time}</div>
            <div class="action col-3">${capitalizeFirstLetter(
							rec.operation
						)}</div>
            <div class="col-4 d-flex justify-content-between align-items-center">
              <div class="size">${showSize}</div>
              <div class="current">
                <button class="current-btn btn" disabled>
                  Current Version
                </button>
              </div>
            </div>
          <div>
        `;
			} else {
				const restoreDiv = `
          <button class="restore-btn btn custom-operation-btn" data-version="${rec.ver}"
              data-bs-toggle="modal" data-bs-target="#confirmRestoreModal">
            Restore
          </button>
        `;
				recDiv = `
          <div style="width: 100%;" 
              class="rec previous-rec d-flex justify-content-between align-items-center py-3">
            <div class="operation-time col-3 ms-3">${time}</div>
            <div class="action col-3">${capitalizeFirstLetter(
							rec.operation
						)}</div>
            <div class="col-4 d-flex justify-content-between align-items-center">
              <div class="size">${showSize}</div>
              <div class="restore">${restoreDiv}</div>
            </div>
          <div>
        `;
			}
		}
		$("#file-history").append(recDiv);
	}
}

const reqPath = window.location.pathname;
const fileWholePath = reqPath.replace(/^\/history\//, "");
const fileId = $(".file-name").data("id");
const history = await getFileHistory(fileId);
console.log(history);
showHistoryList(history);

const arr = fileWholePath.split("/");
const rawParentPath = arr.slice(0, arr.length - 1).join("/");
console.log("fileWholePath: ", fileWholePath);
console.log("rawParentPath: ", rawParentPath);
// ===================================================================
// socket.io
// const socket = io();
socket.on("historyupd", (data) => {
	console.log("socket.on historyupd: ", data);
	const fileId = $(".file-name").data("id");
	// console.log("fileId: ", fileId);
	if (data.fileId === fileId) {
		$("#file-history").empty();
		showHistoryList({
			versions: data.versions,
			deleteRecords: data.deleteRecords,
		});
	}
});
// ===================================================================
// go back link
$("#go-back-link").on("click", function (e) {
	e.preventDefault();
	// console.log("here");
	window.location.href = `/home/${rawParentPath}`;
});

// ===================================================================
// restore button
$(".rec").on("click", ".restore-btn", function () {
	const version = $(this).data("version");

	const fileName = $(".file-name").text();
	const versionTime = $(this).closest(".rec").find(".operation-time").text();
	// console.log(fileName, versionTime);

	$("#confirm-restore-msg").html(
		`Would you like to restore <strong>${fileName}</strong> to the version <strong>${versionTime}</strong>?`
	);

	$("#confirm-restore-btn")
		.off("click")
		.on("click", async function () {
			$("#confirmRestoreModal").modal("hide");

			const arr = fileWholePath.split("/");
			const parentPath = arr.slice(0, arr.length - 1).join("/");
			// console.log("recover version: ", version);
			// console.log("fileWholePath: ", fileWholePath);
			// console.log("parentPath: ", parentPath);

			const text = `Resotred <b>${fileName}</b>`;
			// console.log("text.length: ", text.length);
			const widthPerChar = 7;
			const minWidth = 200;
			const additionalWidth = Math.max(text.length - 30, 0) * widthPerChar;
			const width = Math.max(minWidth + additionalWidth, minWidth);
			// console.log(width);

			const restoreNoti = new Noty({
				text: text,
				layout: "bottomLeft",
				closeWith: ["click"],
				timeout: 3000,
				theme: "custom-theme",
				progressBar: false,
				callbacks: {
					onTemplate: function () {
						this.barDom.style.width = `${width}px`;
					},
				},
			});
			$(window).scrollTop(0, { behavior: "instant" });
			restoreNoti.show();

			const askRestore = await restoreFile(version, fileWholePath, parentPath);
			if (askRestore.status === 200) {
				setTimeout(() => restoreNoti.close(), 2000);
			} else if (askRestore.status >= 400 && askRestore.status < 500) {
				restoreNoti.close();
				let errorHTML;
				if (typeof askRestore.data.error === "string") {
					errorHTML = `<span>${askRestore.data.error}</span>`;
				} else {
					errorHTML = askRestore.data.error
						.map((err) => `<span>${err}</span>`)
						.join("");
				}
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
			} else {
				restoreNoti.close();
				const errorHTML =
					"<span>Opps! Something went wrong. Please try later or contact us.</span>";
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
			}
		});
});
// ===================================================================
// download
$("#history-download").on("click", async function () {
	const parentPath = rawParentPath === "" ? "/" : rawParentPath;

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

	const downloadFileRes = await singleDownloadFile(parentPath, [fileWholePath]);
	console.log("downloadFileRes: ", downloadFileRes);

	$(window).on("beforeunload", function () {
		return "Downloading will be interrupted";
	});

	if (downloadFileRes.status === 200 && downloadFileRes.downloadUrl) {
		downloadSpinner.removeClass("spinner-border");
    
    await delay(100);
    downloadModal.modal("hide");
		await delay(100);
		window.open(downloadFileRes.downloadUrl, "_blank");

		$(window).off("beforeunload");
		return;
	} else if (downloadFileRes.status !== 200 && downloadFileRes.status !== 500) {
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
			"<span>Opps! Something went wrong. Please try later or contact us.</span>"
		);
	}

	setTimeout(() => downloadModal.modal("hide"), 2000);
	$(window).off("beforeunload");
	return;
});
