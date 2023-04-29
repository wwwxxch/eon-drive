import { getFileHistory } from "../../api/list.js";
import { restoreFile } from "../../api/restore.js";
import { formatTime } from "../../util/util.js";
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
          <div class="operation-time col-3">${time}</div>
          <div class="action col-3">${rec.operation}</div>
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
				showSize = `${Math.ceil(rec.size / 1024)} KB`;
			} else if (rec.size < 1024 * 1024 * 1024) {
				showSize = `${Math.ceil(rec.size / (1024 * 1024))} MB`;
			} else if (rec.size < 1024 * 1024 * 1024 * 1024) {
				showSize = `${Math.ceil(rec.size / (1024 * 1024 * 1024))} GB`;
			}

			if (rec.is_current === 1) {
				recDiv = `
        <div style="width: 100%;" 
            class="rec current-rec d-flex justify-content-between align-items-center py-3">
            <div class="operation-time col-3">${time}</div>
            <div class="action col-3">${rec.operation}</div>
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
            <div class="operation-time col-3">${time}</div>
            <div class="action col-3">${rec.operation}</div>
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
// console.log("fileWholePath: ", fileWholePath);

const history = await getFileHistory(fileWholePath);
console.log(history);
showHistoryList(history);
// ===================================================================
// socket.io
const socket = io();
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
// restore button
$(".rec").on("click", ".restore-btn", function () {
	const version = $(this).data("version");

	const fileName = $(".file-name").text();
	const versionTime = $(this).closest(".rec").find(".operation-time").text();
	// console.log(fileName, versionTime);

	$("#confirm-restore-msg").html(
		`Are you sure to restore <strong>${fileName}</strong> to the version <strong>${versionTime}</strong>?`
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
				timeout: 1000,
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
				setTimeout(() => restoreNoti.close(), 1000);
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
