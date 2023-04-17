import { uploadFile } from "./api/upload.js";
import { createFolder } from "./api/create_folder.js";
import { getFileList } from "./api/list.js";
import { deleteFile } from "./api/delete.js";
import { downloadFile } from "./api/download.js";
import { createLink } from "./api/share.js";
import { formatTime } from "./util/util.js";
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
	const path = window.location.pathname.split("/").slice(2).join("/");
	console.log(path);
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
					if (row.type === "folder") {
						return `<span class="${row.type} ff_name">${data}</span>`;
					} else {
						const uri = path === "" ? data : `${path}/${data}`;
						return `<a class="file-link" href="/history/${uri}">
                      <span class="${row.type} ff_name">${data}</span>
                      </a>
                    `;
					}
				},
			},
			{
				data: "updated_at",
				render: function (data, type, row, meta) {
					const time = row.type === "folder" ? "-" : formatTime(data);
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
                  <button class="dropdown-item get-link">revoke link</button>
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

	$("input[name='list-checkbox']").on("change", function () {
		const selected = $("input[name='list-checkbox']:checked");
		const selectedVal = selected.toArray().map((item) => item.value);
		console.log("block: ", selectedVal);
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
}

$(document).click(function (e) {
	if (!$(e.target).is("input[name='list-checkbox'], #select-all")) {
		$("input[name='list-checkbox']").prop("checked", false);
		$("#select-all").prop("checked", false);
	}
});

// show file list under root folder
const isLogin = await chkLoginStatus();
if (isLogin) {
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
		// console.log("pathArray: ", pathArray);
		pathArray.forEach((item, i) => {
			$("#whole-path").append(`
        <span class="slash"> / </span>
        <a href="/home/${item}">
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

$("input[name='access']").change(function () {
	if ($(this).attr("id") == "access-user") {
		$("#recipient").prop("disabled", false);
	} else {
		$("#recipient").prop("disabled", true);
	}
});

// 按下 get-link 按鈕 -> 跳出視窗問要 public or private share
// 按送出才真的送到後端去 create link
// TODO: email validation & email search ......
$("#list-table").on("click", ".get-link", async function () {
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

	$("#create-link-btn").off("click").on("click", async function () {
		const access = $("input[name='access']:checked").val();
		const email = $("#recipient").val().split(";");
		// console.log(access);
		// console.log(email);
		// console.log(parentPath);
		// console.log(targetName);
		const getLink = await createLink(parentPath, targetName, access, email);
		console.log("getLink: ", getLink);
    $("#getLinkModal").modal("hide");
    let inputForShareLink;
		if (getLink.share_link) {
			if (!inputForShareLink) {
        inputForShareLink = $("<input>");
        $("body").append(inputForShareLink);
      }
			inputForShareLink.val(getLink.share_link);
			inputForShareLink.select();

			const copyToClipboard = (text) => {
				// navigator.clipboard
				// 	.writeText(text)
				// 	.then(() => {
				// 		console.log("Text copied to clipboard");
				// 	})
				// 	.catch((err) => {
				// 		console.error("Error copying text to clipboard:", err);
				// 	});
        const input = document.createElement("textarea");
				input.value = text;
				document.body.appendChild(input);
				input.select();
				document.execCommand("copy");
				document.body.removeChild(input);
			};

			copyToClipboard(getLink.share_link);
			inputForShareLink.remove();
			// prompt("Here's your link: ", getLink.share_link);
      alert("Link has been copied");
		}		
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
	// console.log("currentPath: ", currentPath);
	// console.log("pathTexts: ", pathTexts);

	if (currentPath === data.parentPath) {
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
