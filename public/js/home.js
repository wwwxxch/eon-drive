import { uploadFile } from "./api/upload.js";
import { getFileList } from "./api/list.js";
import { deleteFile } from "./api/delete.js";
import { downloadFile } from "./api/download.js";
// ==========================================================================
// logout button
$(".logout-button").on("click", async function(e) {
  e.preventDefault();
  const logoutReq = await axios.get("/logout");
  // console.log("logoutReq: ", logoutReq);
  window.location.href="/";
});

// check login status
const chkLoginStatus = async() => {
  try {
    await axios.get("/login-status");
    return true;
  } catch(err) {
    window.location.href="/login.html";
    return false;
  }
};

// show file list under root folder
const isLogin = await chkLoginStatus();
if (isLogin) {
  const homeList = await getFileList("Home");
  showList(homeList);
}

function showList(obj) {
	const fileList = $("#file-list");
	obj.data.forEach((item) => {
		const tickboxValue = item.type === "folder" ? item.name + "/" : item.name;
		const div = $("<div>");
		const tickbox = $("<input>").attr({
			type: "checkbox",
			name: "list-checkbox",
			value: tickboxValue,
		});
		const span = $("<span>");

		tickbox.change(function () {
			const selected = $("input[name='list-checkbox']:checked");
			if (selected.length > 0) {
				$("#delete-button").show();
				$("#download-button").show();
			} else {
				$("#delete-button").hide();
				$("#download-button").hide();
			}
		});

		if (item.type !== "folder") {
			span.text(
				`${item.name} (${item.size} bytes) ${new Date(
					item.updated_at
				).toLocaleString()}`
			);
			span.addClass("file").attr("data-file-id", item.id);
		} else {
			span.text(item.name);
			span.addClass("folder").attr("data-folder-id", item.id);
		}

		div.append(tickbox, span);
		fileList.append(div);
	});
}

// click folder --> show lists under that folder
$("#file-list").on("click", ".folder", async function () {
	const dirName = $(this).text();
	const newPath = `${$("#current-path").text()}/${dirName}`;

	// clear file list and get file list under new dir
	$("#file-list").empty();
	const newList = await getFileList(newPath);
	showList(newList);

	// update current path
	$("#current-path").text(newPath);

	$("#file-input").val("");
	$("#folder-input").val("");
});

// socket.io
const socket = io();
socket.on("listupd", (data) => {
	// console.log("socket.on listupd: ", data);
  console.log("In socket.on(\"listupd\")");
	let currentPath = "";
	if ($("#current-path").text() !== "Home") {
		currentPath = $("#current-path").text().split("/").slice(1).join("/");
	}
	if (currentPath === data.parentPath) {
		$("#file-list").empty();
		showList(data.list);
	}
});

// ==========================================================================
// upload file
$("#form-file").on("submit", async function (e) {
	e.preventDefault();
	const currentPath = $("#current-path").text();
	const fileList = $("#file-input")[0].files;

	for (let file of fileList) {
    const uploadFileRes = await uploadFile(currentPath, file);
    console.log("uploadFileRes: ", uploadFileRes);
	}

	$("#file-input").val("");
});

// upload folder
$("#form-folder").on("submit", async function (e) {
	e.preventDefault();
	const currentPath = $("#current-path").text();
	const fileList = $("#folder-input")[0].files;

	for (let file of fileList) {
		const uploadFileRes = await uploadFile(currentPath, file);
    console.log("uploadFileRes: ", uploadFileRes);
	}

	$("#folder-input").val("");
});

// ==========================================================================
// delete
$("#delete-button").click(async function () {
  const currentPath = $("#current-path").text();
  const selected = $("input[name='list-checkbox']:checked");
  
  const deleteFileRes = await deleteFile(currentPath, selected);
  console.log("deleteFileRes: ", deleteFileRes);
	
	selected.prop("checked", false);
	$("#delete-button").hide();
	$("#download-button").hide();
});

// download
$("#download-button").click(async function () {
  const currentPath = $("#current-path").text();
	const selected = $("input[name='list-checkbox']:checked");
	
  const downloadFileRes = await downloadFile(currentPath, selected);
  // console.log("downloadFileRes: ", downloadFileRes);
  if (downloadFileRes.status === 200) {
    window.open(downloadFileRes.downloadUrl, "_self");
  }

	selected.prop("checked", false);
	$("#delete-button").hide();
	$("#download-button").hide();
});
