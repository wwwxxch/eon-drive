import { uploadFile } from "./api/upload.js";
import { createFolder } from "./api/create_folder.js";
import { getFileList, getFileHistory } from "./api/list.js";
import { deleteFile } from "./api/delete.js";
import { downloadFile } from "./api/download.js";
import { restoreFile } from "./api/restore.js";
import { createLink } from "./api/share.js";

import { formatTime } from "./util/util.js";
import { HOST } from "./constant/constant.js";
// ==========================================================================

// logout button
$("#logout-btn").on("click", async function (e) {
	e.preventDefault();
	const logoutReq = await axios.get("/logout");
	window.location.href = "/";
});

// check login status
const chkLoginStatus = async () => {
	try {
		await axios.get("/login-status");
		return true;
	} catch (err) {
		window.location.href = "/login";
		return false;
	}
};

// showList
let table;
function showList(obj) {
	console.log("showList: ", obj);
	if (obj.data.length === 0) {
		$("#list-table").hide();
		return;
	}
	table = $("#list-table").DataTable({
		data: obj.data,
		columns: [
			{
				data: "name",
				render: function (data, type, row, meta) {
					const tickboxValue =
						row.type === "folder" ? row.name + "/" : row.name;
					const tickbox = `<input type="checkbox" name="list-checkbox" value=${tickboxValue}>`;
					return tickbox;
				},
			},
			{
				data: "name",
				render: function (data, type, row, meta) {
					return `<span class="${row.type}">${data}</span>`;
				},
			},
			{
				data: "updated_at",
				render: function (data) {
					return new Date(data).toLocaleString();
				},
			},
		],
		searching: false,
		lengthChange: false,
	});

	$("input[name='list-checkbox']").on("change", function () {
		const selected = $("input[name='list-checkbox']:checked");
		const selectedVal = selected.toArray().map((item) => item.value);
		console.log("block: ", selectedVal);
		if (selected.length === 1 && !selectedVal[0].endsWith("/")) {
			$("#delete-btn-div").show();
			$("#download-btn-div").show();
			// $("#history-btn").prop("disabled", false);
		} else if (selected.length > 0) {
			$("#delete-btn-div").show();
			$("#download-btn-div").show();

			// console.log("showInfo: a - ", showInfo);
			// if (showInfo) {
			// 	$("#history-btn").trigger("click");
			// }
			// $("#history-btn").prop("disabled", true);
		} else {
			$("#delete-btn-div").hide();
			$("#download-btn-div").hide();

			// console.log("showInfo: b - ", showInfo);
			// if (showInfo) {
			// 	$("#history-btn").trigger("click");
			// }
			// $("#history-btn").prop("disabled", true);
		}
	});
}

$(document).click(function (e) {
	if (
		!$(e.target).is("input[name='list-checkbox'], #select-all") /*&&
		$(e.target).closest("#history-btn").length === 0*/
	) {
		$("input[name='list-checkbox']").prop("checked", false);
		$("#select-all").prop("checked", false);
	}
});

// show file list under root folder
const isLogin = await chkLoginStatus();
if (isLogin) {
	// add root path
	$("#whole-path").append(`
    <a href="${HOST}/home">
      <h4><span class="path-text">Home</span></h4>
    </a>
  `);
	// $("#history-btn").prop("disabled", true);

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
		// console.log("pathArray: ", pathArray);
		pathArray.forEach((item, i) => {
			$("#whole-path").append(`
        <span class="slash"> / </span>
        <a href="${HOST}/home/${item}">
          <h4><span class="path-text">${item.split("/").pop()}</span></h4>
        </a>
      `);
		});
	}
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
    <a href="${HOST}/home/${uri}">
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
      <a href="${HOST}/home">
        <h4><span class="path-text">Home</span></h4>
      </a>
    `);
		pathArray.forEach((item, i) => {
			$("#whole-path").append(`
        <span class="slash"> / </span>
        <a href="${HOST}/home/${item}">
          <h4><span class="path-text">${item.split("/").pop()}</span></h4>
        </a>
      `);
		});
	}
});

// TODO: share link !!
// click share button
$("#file-list").on("click", ".link-btn", async function () {
	// 找到按鈕所在的 file-div 元素
	const fileDiv = $(this).closest(".file-div");
	// 找到 checkbox 的 value 屬性
	const targetName = fileDiv.find('input[type="checkbox"]').val();

	const parentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");

	const getLink = await createLink(parentPath, targetName);
	console.log("getLink: ", getLink);

	if (getLink.share_link) {
		const inputForShareLink = $("<input>");
		$("body").append(inputForShareLink);
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
		};

		copyToClipboard(getLink.share_link);
		inputForShareLink.remove();
		prompt("Here's your link: ", getLink.share_link);
	}
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
	// console.log("currentPath: ", currentPath);
	// console.log("pathTexts: ", pathTexts);

	if (currentPath === data.parentPath) {
		// $("#file-list").empty();
		table.destroy();
		showList(data.list);
	}
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
	for (let file of fileList) {
		const uploadFileRes = await uploadFile(currentPath, file);
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
	for (let file of fileList) {
		const uploadFileRes = await uploadFile(currentPath, file);
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
$("#delete-btn").click(async function () {
	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const selected = $("input[name='list-checkbox']:checked");

	const deleteFileRes = await deleteFile(currentPath, selected);
	console.log("deleteFileRes: ", deleteFileRes);

	selected.prop("checked", false);
	$("#delete-btn-div").hide();
	$("#download-btn-div").hide();
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

	const downloadFileRes = await downloadFile(currentPath, selected);
	console.log("downloadFileRes: ", downloadFileRes);

	if (downloadFileRes.status === 200) {
		window.open(downloadFileRes.downloadUrl, "_self");
	}

	selected.prop("checked", false);
	$("#delete-btn-div").hide();
	$("#download-btn-div").hide();
});

// ===============================================================================
// showhistory
/*
let showInfo = false;
$("#history-btn").click(async function () {
	$("#info-block").empty();

	if (showInfo) {
		$("#list-block").removeClass("col-9").addClass("col-12");
		$("#list-table").css("width", $("#list-block").width());

		$("#info-block").removeClass("col-3");
		showInfo = false;
		return;
	}
	// } else {
	$("#list-block").removeClass("col-12").addClass("col-9");
	$("#list-table").css("width", $("#list-block").width());

	$("#info-block").addClass("col-3");
	showInfo = true;

	const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const selected = $("input[name='list-checkbox']:checked");
	const selectedArr = selected.toArray().map((item) => {
		if (currentPath === "Home") {
			return item.value;
		} else {
			return `${currentPath.replace(/^Home\//, "")}/${item.value}`;
		}
	});
	const fileWholePath = selectedArr[0];
	// console.log(fileWholePath);
	const historyRes = await getFileHistory(fileWholePath);
	// change to function
	console.log(historyRes);
	const allRecords = [...historyRes.versions, ...historyRes.deleteRecords];
	allRecords.sort((a, b) => a.operation_time - b.operation_time);
	for (const operation of allRecords) {
		let record = "";
		if (operation.operation === "delete") {
			const time = formatTime(operation.operation_time);
			record = `<div> deleted at ${time} </div>`;
		} else if (operation.operation) {
			const time = formatTime(operation.operation_time);
			let versionDiv = `
      <div class="version" data-version="${operation.ver}"> 
        ${operation.operation} at ${time}, size = ${operation.size} kb
      </div>
    `;

			if (operation.is_current === 0) {
				const recoverBtn = `
        <button class="btn btn-outline-secondary btn-sm recover-btn" data-version="${operation.ver}">
          Recover
        </button>
      `;
				versionDiv = $(versionDiv).append(recoverBtn);
			}
			record = versionDiv;
		}
		$("#info-block").append(record);
	}
	$("#info-block").on("click", ".recover-btn", async function () {
		const version = $(this).data("version");
		// call recover function with version
		console.log("recover version: ", version);
		console.log("currentPath: ", currentPath);
		console.log("fileWholePath: ", fileWholePath);
		let parentPath = "";
		if (currentPath !== "Home") {
			parentPath = currentPath.replace(/^Home\//, "");
		}
		const askRestore = await restoreFile(version, fileWholePath, parentPath);
		console.log("askRestore: ", askRestore);
	});
	// }
});
*/
