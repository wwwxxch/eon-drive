import { uploadFile } from "../../api/upload.js";
import { createFolder } from "../../api/create_folder.js";
import { getFileList } from "../../api/list.js";
import { deleteFile } from "../../api/delete.js";
import { downloadFile } from "../../api/download.js";
import { createLink, revokeLink, checkShareStatus } from "../../api/share.js";
import { formatTime, traverseDirectory } from "../../util/util.js";
// ==========================================================================

//show usage
const usageRes = await axios.get("/usage");
const usedNum = parseInt(usageRes.data.used);
const allocatedNum = parseInt(usageRes.data.allocated);
const percent = (usedNum / allocatedNum) * 100;
$(".usage-progress").css("width", percent + "%");
$(".usage-progress").attr("aria-valuenow", percent);
$("#progress-des").text(
	`${(usedNum / (1024 * 1024)).toFixed(2)} MB / ${
		allocatedNum / (1024 * 1024)
	} MB`
);

// get User's timezone
const userTimezoneOffset = new Date().getTimezoneOffset();
const timeZone = luxon.DateTime.local().minus({
	minutes: userTimezoneOffset,
}).zoneName;
console.log("timeZone: ", timeZone);

// showList
let table;
function showList(obj) {
	console.log("showList: ", obj);
	if (obj.data.length === 0) {
		console.log("obj.data.length === 0");
		$("#list-table").hide();
		return;
	} else {
		console.log("obj.data.length !== 0");
		$("#list-table").show();
	}
	const path = window.location.pathname.split("/").slice(2).join("/");
	// console.log(path);
	table = $("#list-table").DataTable({
		data: obj.data,
		columns: [
			{
				data: "name",
				render: function (data, type, row, meta) {
					const tickboxValue =
						row.type === "folder" ? row.name + "/" : row.name;
					// console.log("tickboxValue: ", tickboxValue);
					const tickbox = `<input type="checkbox" name="list-checkbox" value="${tickboxValue}">`;
					return tickbox;
				},
			},
			{
				data: "name",
				render: function (data, type, row, meta) {
					if (row.type === "folder") {
						return `<span class="${row.type} ff_name" data-id="${row.id}">${data}</span>`;
					} else {
						const uri = path === "" ? data : `${path}/${data}`;
						return `<a class="file-link" href="/history/${uri}">
                      <span class="${row.type} ff_name" data-id="${row.id}">${data}</span>
                      </a>
                    `;
					}
				},
			},
			{
				data: "updated_at",
				render: function (data, type, row, meta) {
					// const time = row.type === "folder" ? "-" : formatTime(data);
					const time =
						row.type === "folder"
							? "-"
							: luxon.DateTime.fromISO(data)
									.setZone(timeZone)
									.toFormat("yyyy-MM-dd HH:mm:ss");
					const div = `
            <div class="d-flex justify-content-between">
              <div>${time}</div>
              <div class="dropdown">
                <button class="btn btn-link links-operation"  type="button" id="linksOperationMenu"
                  data-bs-toggle="dropdown" data-mdb-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" fill="currentColor" class="bi bi-three-dots links-operation-svg"
                    viewBox="0 0 16 16">
                    <path
                      d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                  </svg>
                </button>
                <div class="dropdown-menu" aria-labelledby="linksOperationMenu">
                  <button type="button" class="dropdown-item get-link"
                    data-bs-toggle="modal" data-bs-target="#getLinkModal">
                    get link</button>
                  <button type="button" class="dropdown-item revoke-link"
                    data-bs-toggle="modal" data-bs-target="#revokeLinkModal">
                    revoke link</button>
                </div>
              </div>
            </div>
          `;
					return div;
				},
			},
		],
		searching: false,
		lengthChange: false,
	});
}

$("#list-table").on("change", "input[name='list-checkbox']", function () {
	const selected = $("input[name='list-checkbox']:checked");
	const selectedVal = selected.toArray().map((item) => item.value);
	// console.log("block: ", selectedVal);
	if (selected.length === 1 && !selectedVal[0].endsWith("/")) {
		$("#delete-btn-div").show();
		$("#download-btn-div").show();
	} else if (selected.length > 0) {
		$("#delete-btn-div").show();
		$("#download-btn-div").show();
	} else {
		$("#delete-btn-div").hide();
		$("#download-btn-div").hide();
	}
});

$(document).click(function (e) {
	if (!$(e.target).is("input[name='list-checkbox'], #select-all")) {
		$("input[name='list-checkbox']").prop("checked", false);
		$("#select-all").prop("checked", false);
    $("#delete-btn-div").hide();
		$("#download-btn-div").hide();
	}
});

// show file list under root folder

// add root path
$("#whole-path").append(`
  <a href="/home">
    <h4><span class="path-text">Home</span></h4>
  </a>
`);

const path = window.location.pathname.split("/").slice(2).join("/");
console.log("window.location.pathname: ", window.location.pathname);
console.log("path: ", path);
const list = await getFileList(path === "" ? "Home" : "Home/" + path);
showList(list);

if (path !== "") {
	const pathArray = path.split("/").reduce((prev, curr, i) => {
		const folder = i === 0 ? curr : `${prev[i - 1]}/${curr}`;
		return [...prev, folder];
	}, []);
	console.log("pathArray: ", pathArray);
	pathArray.forEach((item, i) => {
		$("#whole-path").append(`
      <span class="slash"> / </span>
      <a href="/home/${decodeURIComponent(item)}">
        <h4><span class="path-text">${decodeURIComponent(
					item.split("/").pop()
				)}</span></h4>
      </a>
    `);
	});
}

// click folder --> show lists under that folder
$("#list-table").on("click", ".folder", async function () {
	const dirName = $(this).text();
	const pathTexts = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const uri =
		pathTexts === "Home"
			? dirName
			: `${pathTexts.replace(/^Home\//, "")}/${dirName}`;

	console.log("dirName: ", dirName);
	console.log("pathTexts: ", pathTexts);
	console.log("uri: ", uri);
	history.pushState({}, "", `/home/${uri}`);

	// clear file list and get file list under new dir
	const newPath = `${pathTexts}/${dirName}`;
	const newList = await getFileList(newPath);
	table.destroy();
	showList(newList);

	// update current path
	$("#whole-path").append(`
    <span class="slash"> / </span>
    <a href="/home/${uri}">
      <h4><span class="path-text">${dirName}</span></h4>
    </a>
  `);

	$("#file-input").val("");
	$("#folder-input").val("");
});

$(window).on("popstate", async function () {
	const path = window.location.pathname.split("/").slice(2).join("/");
	const list = await getFileList(path === "" ? "Home" : "Home/" + path);
	table.destroy();
	showList(list);

	if (path !== "") {
		const pathArray = path.split("/").reduce((prev, curr, i) => {
			const folder = i === 0 ? curr : `${prev[i - 1]}/${curr}`;
			return [...prev, folder];
		}, []);
		// console.log("pathArray: ", pathArray);

		$("#whole-path").empty().append(`
      <a href="/home">
        <h4><span class="path-text">Home</span></h4>
      </a>
    `);
		pathArray.forEach((item, i) => {
			$("#whole-path").append(`
        <span class="slash"> / </span>
        <a href="/home/${item}">
          <h4><span class="path-text">${item.split("/").pop()}</span></h4>
        </a>
      `);
		});
	}
});
// ===============================================================================
// create share link

// get link - email input
$("input[name='access']").change(function () {
	if ($(this).attr("id") == "access-user") {
		$("#recipient").prop("disabled", false);
	} else {
		$("#recipient").prop("disabled", true);
		$("#recipient").val("");
		$(".email-list").empty();
		$(".email-chips-container").empty();
	}
});

$("#list-table").on("click", ".get-link", async function () {
	const targetId = $(this).closest("tr").find(".ff_name").data("id");
	console.log("targetId: ", targetId);
	const shareStatus = await checkShareStatus(targetId);
	console.log(shareStatus);
	$("#current-access-list").empty();
	if (!shareStatus.share_link) {
		$("#current-access-list").append(`
      <div>Only you</div>
    `);
	} else if (shareStatus.is_public === 1) {
		$("#current-access-list").append(`
      <div>Anyone knows the link</div>
      <div>
        <a href="${shareStatus.share_link}">
          ${window.location.origin}${shareStatus.share_link}      
        </a>
      </div>
    `);
	} else if (shareStatus.acl.length > 0) {
		const userDiv = shareStatus.acl
			.map((item) => {
				return `
          <div class="d-flex align-items-center">
            <div>${item.name}&ensp;&ensp;</div>
            <div style="font-size: smaller; color: rgb(86, 86, 86);">
              ${item.email}
            </div>
          </div>
        `;
			})
			.join("");
		$("#current-access-list").append(`
        <div>${userDiv}</div>
        <div>
          <a href="${shareStatus.share_link}">
            ${window.location.origin}${shareStatus.share_link}      
          </a>
        </div>
      `);
	}

	const targetName = $(this)
		.closest("tr")
		.find("input[name='list-checkbox']")
		.val();
	const parentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(parentPath);
	console.log(targetName);

	$("#recipient").on("input", function () {
		const text = $(this).val().trim();

		if (text) {
			axios
				.get(`/select-user?q=${text}`)
				.then((res) => {
					const emails = res.data.list;
					if (emails.length > 0) {
						$(".email-list").empty();
						emails.forEach((email) => {
							// TODO: if this email has been displayed in $(".email-chips-container"), then no need to add it into list
							const $emailItem = $("<div class='email-item'></div>");
							$emailItem.text(email);
							$emailItem.appendTo($(".email-list"));
						});
						$(".email-list").show();
					} else {
						$(".email-list").hide();
					}
				})
				.catch((e) => {
					console.error("selectableEmail: ", e);
				});
		} else {
			$(".email-list").hide();
		}
	});

	// Hide email list when user clicks outside of it
	$(document).on("click", function (e) {
		if (
			!$(".email-list").is(e.target) &&
			!$("#recipient").is(e.target) &&
			$(".email-list").has(e.target).length === 0
		) {
			$("#recipient").val("");
			$(".email-list").hide();
		}
	});

	$(".email-list")
		.off("click")
		.on("click", ".email-item", function () {
			const email = $(this).text();
			const $emailChip = $(
				`<div class="email-chip">
        <span class="email-text"></span>
        <button class="email-remove">&times;</button>
      </div>`
			);
			$emailChip.find(".email-text").text(email);
			$(".email-chips-container").append($emailChip);
			$(this).remove();
			$(".email-list").hide();
			$("#recipient").val("");
		});

	$(".email-chips-container")
		.off("click")
		.on("click", ".email-remove", function () {
			const $emailChip = $(this).parent(".email-chip");
			const email = $emailChip.find(".email-text").text();
			const $emailItem = $("<div class='email-item'></div>");
			$emailItem.text(email);
			$(".email-list").append($emailItem);
			$(this).parent().remove();
		});

	// back to init state
	$("#create-link-cancel-btn")
		.off("click")
		.on("click", function () {
			$("#recipient").val("");
			$(".email-list").empty();
			$(".email-chips-container").empty();
			$("input[id='access-anyone']").prop("checked", true);
			$("input[id='access-user']").prop("checked", false);
			$("#recipient").prop("disabled", true);
		});

	$("#create-link-btn")
		.off("click")
		.on("click", async function () {
			const access = $("input[name='access']:checked").val();
			const selectedEmails = [];
			$(".email-chip")
				.find(".email-text")
				.each(function () {
					selectedEmails.push($(this).text());
				});

			console.log(selectedEmails);

			const getLink = await createLink(
				parentPath,
				targetName,
				access,
				selectedEmails
			);
			console.log("getLink: ", getLink);
			$("#getLinkModal").modal("hide");
			$("#recipient").val("");
			$(".email-list").empty();
			$(".email-chips-container").empty();
			$("input[id='access-anyone']").prop("checked", true);
			$("input[id='access-user']").prop("checked", false);
			$("#recipient").prop("disabled", true);

			let inputForShareLink;
			if (getLink.share_link) {
				if (!inputForShareLink) {
					inputForShareLink = $("<input>");
					$("body").append(inputForShareLink);
				}
				inputForShareLink.val(getLink.share_link);
				inputForShareLink.select();

				const copyToClipboard = (text) => {
					navigator.clipboard
						.writeText(text)
						.then(() => {
							console.log("Text copied to clipboard");
						})
						.catch((err) => {
							console.error("Error copying text to clipboard:", err);
						});

					// // workaround when clipboard cannot be used
					// const input = document.createElement("textarea");
					// input.value = text;
					// document.body.appendChild(input);
					// input.select();
					// document.execCommand("copy");
					// document.body.removeChild(input);
				};

				copyToClipboard(getLink.share_link);
				inputForShareLink.remove();
				// prompt("Here's your link: ", getLink.share_link);
				$("#linkModal").on("show.bs.modal", function (event) {
					const linkInput = $(this).find("#linkInput");
					linkInput.val(getLink.share_link);
				});
				$("#linkModal").modal("show");
				$("#linkModal").on("click", ".copy-link-btn", function () {
					$("#linkModal").modal("hide");
				});
			}
		});
});

// ===============================================================================
// revoke share link
$("#list-table").on("click", ".revoke-link", async function () {
	const ff_id = $(this).closest("tr").find(".ff_name").data("id");
	console.log(ff_id);

	$("#revoke-link-btn")
		.off("click")
		.on("click", async function () {
			const askRevokeLink = await revokeLink(ff_id);
			console.log("askRevokeLink: ", askRevokeLink);
			// TODO: response from backend
			if (askRevokeLink) {
				$("#revokeAlertModal").modal("show");
				setTimeout(function () {
					$("#revokeAlertModal").modal("hide");
				}, 2000);
			}
			$("#revokeLinkModal").modal("hide");
		});
});

// ==========================================================================
// socket.io
const socket = io();
socket.on("listupd", (data) => {
	console.log("socket.on listupd: ", data);
	// console.log("In socket.on(\"listupd\")");

	const pathTexts = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");

	let currentPath = "";
	if (pathTexts !== "Home") {
		currentPath = pathTexts.replace(/^Home\//, "");
	}
	console.log("currentPath: ", currentPath);
	console.log("pathTexts: ", pathTexts);

	if (currentPath === data.parentPath) {
		if ($("#list-table").is(":visible")) {
			table.destroy();
		}
		showList(data.list);
	}
});
socket.on("usageupd", (data) => {
	const usedNum = parseInt(data.used);
	const allocatedNum = parseInt(data.allocated);
	const percent = (usedNum / allocatedNum) * 100;
	$(".usage-progress").css("width", percent + "%");
	$(".usage-progress").attr("aria-valuenow", percent);
	$("#progress-des").text(
		`${(usedNum / (1024 * 1024)).toFixed(2)} MB / 
    ${allocatedNum / (1024 * 1024)} MB`
	);
});

// =================================================================================
// Drag & Drop
$(function () {
	$("#drag-drop-zone").on("dragenter", function (e) {
		e.preventDefault();
		$(this).addClass("drag-over");
		$("#drag-drop-box").addClass("drag-over");
	});

	$("#drag-drop-zone").on("dragover", function (e) {
		e.preventDefault();
		$(this).addClass("drag-over");
		$("#drag-drop-box").addClass("drag-over");
	});

	$("#drag-drop-zone").on("dragleave", function (e) {
		$(this).removeClass("drag-over");
		$("#drag-drop-box").removeClass("drag-over");
	});

	$("#drag-drop-zone").on("drop", async function (e) {
		e.preventDefault();
		$(this).removeClass("drag-over");
		$("#drag-drop-box").removeClass("drag-over");

		const currentPath = $(".path-text")
			.map(function () {
				return $(this).text().trim();
			})
			.get()
			.join("/");

		const items = e.originalEvent.dataTransfer.items;
		console.log(items);

		let entries = [];
		for (let i = 0; i < items.length; i++) {
			entries.push(items[i].webkitGetAsEntry());
		}
		console.log(entries);

		let arr = [];
		for (let i = 0; i < entries.length; i++) {
			console.log(i);
			// const item = items[i];
			// console.log("item: ", item);
			const entry = entries[i];
			console.log("entry: ", entry, entry.isDirectory);

			if (entry.isDirectory) {
				const fileList = await traverseDirectory(entry);
				arr.push(...fileList);
			} else {
				const file = items[i].getAsFile();
				arr.push(file);
			}
		}
		console.log("arr: ", arr);

		// let uploadInterval;
		// $("#uploadModal").modal("show");
		const uploadModal = $("#waitingModal");
    const uploadStatus = $(".waiting-status");
		// let currentValue = 0;
		// progressBar.css("width", "0%");
		// progressBar.attr("aria-valuenow", 0);
		// function countUp() {
		//   currentValue+=10;
		//   if (currentValue > 100) {
		//     currentValue = 0;
		//   }
		//   console.log(currentValue);
		//   progressBar.css("width", `${currentValue}%`);
		//   progressBar.attr("aria-valuenow", currentValue);
		// }
		// uploadInterval = setInterval(countUp, 200);

		// Upload function
		for (let element of arr) {
			console.log(element);
			const uploadFileRes = await uploadFile(
				currentPath,
				element,
        uploadModal,
        uploadStatus
			);
			console.log("uploadFileRes: ", uploadFileRes);
		}

		// clearInterval(uploadInterval);
		// progressBar.css("width", "100%");
		// progressBar.attr("aria-valuenow", 100);
		// $(".upload-status").text("Complete!");
		// setTimeout(() => $("#uploadModal").modal("hide"), 500);
		// $(".upload-status").text("Uploading...");
	});
});
// =================================================================================
// Upload
$("#file-upload-btn").on("click", function () {
	$("#file-input").click();
});

$("#folder-upload-btn").on("click", function () {
	$("#folder-input").click();
});

$("#file-input").on("change", function () {
	$("#file-form").trigger("submit");
});

$("#folder-input").on("change", function () {
	$("#folder-form").trigger("submit");
});

$("#file-form").on("submit", async function (e) {
	e.preventDefault();
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(currentPath);
	const fileList = $("#file-input")[0].files;
	console.log("fileList: ", fileList);

	const uploadModal = $("#waitingModal");
	const uploadStatus = $(".waiting-status");

	// START UPLOAD
	for (let file of fileList) {
		const uploadFileRes = await uploadFile(
			currentPath,
			file,
			uploadModal,
			uploadStatus
		);
		console.log("uploadFileRes: ", uploadFileRes);
	}

	$("#file-input").val("");
});

$("#folder-form").on("submit", async function (e) {
	e.preventDefault();
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(currentPath);
	const fileList = $("#folder-input")[0].files;
	console.log("fileList: ", fileList);

	const uploadModal = $("#waitingModal");
	const uploadStatus = $(".waiting-status");

	for (let file of fileList) {
		const uploadFileRes = await uploadFile(
			currentPath,
			file,
			uploadModal,
			uploadStatus
		);
		console.log("uploadFileRes: ", uploadFileRes);
	}

	$("#folder-input").val("");
});

// ==========================================================================
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

// ==========================================================================
// select all & deselect all
$("#select-all").on("change", function () {
	if (this.checked) {
		$("input[name='list-checkbox']").prop("checked", true);
		$("#delete-btn-div").show();
		$("#download-btn-div").show();
	} else {
		$("input[name='list-checkbox']").prop("checked", false);
		$("#delete-btn-div").hide();
		$("#download-btn-div").hide();
	}
});
// ===============================================================================
// delete
$("#delete-btn").on("click", async function () {
  const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
  const selected = $("input[name='list-checkbox']:checked");
  const toDelete = selected.toArray().map(item => item.value);
  console.log("toDelete: ", toDelete);
  let targetName;
  
  if (toDelete.length > 1) {
    $("#confirm-delete-msg").html(`Are you sure you want to delete <b> ${toDelete.length} items</b>?`);
  } else if (toDelete.length === 1) {
    const arr = toDelete[0].split("/");
    
    if (toDelete[0].endsWith("/")) {
      targetName = arr[arr.length-2];
    } else {
      targetName = arr.pop();
    }
    $("#confirm-delete-msg").html(`Are you sure you want to delete <b>${targetName}</b>?`);
  }

  $("#confirm-delete-btn").off("click").on("click", async function () {
    $("#confirmDeleteModal").modal("hide");
    let text;
    if (toDelete.length > 1) {
      text = `Delete <b>${toDelete.length} items</b>`;
    } else if (toDelete.length === 1) {
      text = `Delete <b>${targetName}</b>`;
    }

    const widthPerChar = 7;
    const minWidth = 250;
    const additionalWidth = Math.max(text.length - 30, 0) * widthPerChar;
    const width = Math.max(minWidth + additionalWidth, minWidth);

    const deleteNoti = new Noty({
      text: text,
      layout: "bottomLeft",
      closeWith: ["click"],
      timeout: 2000,
      theme: "custom-theme",
      progressBar: true,
      callbacks: {
        onTemplate: function () {
          this.barDom.style.width = `${width}px`;
        },
      },
    });
    deleteNoti.show();
    let requestIsOngoing = true;
    const deleteFileRes = await deleteFile(currentPath, toDelete);
    // For test 
    // const deleteFileRes = true;

    if (deleteFileRes) {
      requestIsOngoing = false;
    } else {
      // TODO: if delete failed
      requestIsOngoing = false;
    }
    if (!requestIsOngoing) {
      setTimeout(() => deleteNoti.close(), 2000);
    }
    
    selected.prop("checked", false);
    $("#delete-btn-div").hide();
    $("#download-btn-div").hide();
    
  });	
});

// download
$("#download-btn").click(async function () {
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const selected = $("input[name='list-checkbox']:checked");
  
  const downloadModal = $("#waitingModal");
	const downloadStatus = $(".waiting-status");
  downloadModal.modal("show");
  downloadStatus.text("Downloading...");
  $("#waiting-spinner").addClass("spinner-border");
  $(".waiting-complete").hide();
	const downloadFileRes = await downloadFile(currentPath, selected);
	console.log("downloadFileRes: ", downloadFileRes);

	if (downloadFileRes.status === 200) {
    $("#waiting-spinner").removeClass("spinner-border");
    $(".waiting-complete").show();
    setTimeout(() => downloadStatus.text("Complete!"), 200);
    setTimeout(() => downloadModal.modal("hide"), 1500);
		window.open(downloadFileRes.downloadUrl, "_self");
	}

	selected.prop("checked", false);
	$("#delete-btn-div").hide();
	$("#download-btn-div").hide();
});
