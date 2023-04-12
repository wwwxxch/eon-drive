import { uploadFile } from "./api/upload.js";
import { createFolder } from "./api/create_folder.js";
import { getFileList } from "./api/list.js";
import { deleteFile } from "./api/delete.js";
import { downloadFile } from "./api/download.js";
import { createLink } from "./api/share.js";

import { HOST } from "./constant/constant.js";
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

// show file list function
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
			span.text(`${item.name} ${new Date(item.updated_at).toLocaleString()}`);
			span.addClass("file").attr("data-file-id", item.id);
		} else {
			span.text(item.name);
			span.addClass("folder").attr("data-folder-id", item.id);
		}
    const linkbtn = $("<button>");
    linkbtn.text("Get Link").addClass("link-btn");
    div.addClass("file-div");
		div.append(tickbox, span, linkbtn);
		fileList.append(div);
	});
}

// show file list under root folder 
const isLogin = await chkLoginStatus();
if (isLogin) {
  
  // add root path
  $("#whole-path").append(`
    <a href="${HOST}/home.html">
      <h2>
        <span class="path-text">
          Home
        </span>
      </h2>
    </a>
  `);

  const url = new URL(window.location.href);
  const path = url.searchParams.get("path");
  const list = await getFileList((path === null ? "Home" : "Home/" + path));
  showList(list);
  if (path != null) {
    const pathArray = path.split("/").reduce((prev, curr, i) => {
      const folder = (i === 0) ? curr : `${prev[i - 1]}/${curr}`;
      return [...prev, folder];
    }, []);
    // console.log("pathArray: ", pathArray);
    pathArray.forEach((item, i) => {
      $("#whole-path").append(`
        <span class="path-slash"> / </span>
        <a href="${HOST}/home.html?path=${item}">
          <h2>
            <span class="path-text">
              ${item.split("/").pop()}
            </span>
          </h2>
        </a>
      `);
    });
  }
  // TODO: if path in url is not exsited -> should redirect user to home page
}

// click folder --> show lists under that folder
$("#file-list").on("click", ".folder", async function () {
	const dirName = $(this).text();
  const pathTexts = $(".path-text").map(function() {
    return $(this).text().trim();
  }).get().join("/");
  let uri;
  if (pathTexts === "Home") {
    uri = dirName;
  } else {
    uri = `${pathTexts.replace(/^Home\//,"")}/${dirName}`;
  }

  console.log("dirName: ", dirName);
  console.log("pathTexts: ", pathTexts);
  console.log("uri: ", uri);
  history.pushState({}, "", `/home.html?path=${uri}`);

	// clear file list and get file list under new dir
  const newPath = `${pathTexts}/${dirName}`;
	$("#file-list").empty();
	const newList = await getFileList(newPath);
	showList(newList);
  
	// update current path
  $("#whole-path").append(`
    <span class="path-slash"> / </span>
    <a href="${HOST}/home.html?path=${uri}">
      <h2>
        <span class="path-text">
          ${dirName}
        </span>
      </h2>
    </a>
  `);

	$("#file-input").val("");
	$("#folder-input").val("");
});

// click share button
$("#file-list").on("click", ".link-btn", async function () {
  
  // 找到按鈕所在的 file-div 元素
  const fileDiv = $(this).closest(".file-div");
  // 找到 checkbox 的 value 屬性
  const targetName = fileDiv.find("input[type=\"checkbox\"]").val();

  const parentPath = $(".path-text").map(function() {
    return $(this).text().trim();
  }).get().join("/");
  
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
	
  const pathTexts = $(".path-text").map(function() {
    return $(this).text().trim();
  }).get().join("/");
  
  let currentPath = "";
	if (pathTexts !== "Home") {
		currentPath = pathTexts.replace(/^Home\//,"");
	}
  // console.log("currentPath: ", currentPath);
  // console.log("pathTexts: ", pathTexts);

	if (currentPath === data.parentPath) {
		$("#file-list").empty();
		showList(data.list);
	}
});

// ==========================================================================
// upload file
$("#form-file").on("submit", async function (e) {
	e.preventDefault();
  const currentPath = $(".path-text").map(function() {
    return $(this).text().trim();
  }).get().join("/");
  console.log(currentPath);
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
	// const currentPath = $("#current-path").text();
  const currentPath = $(".path-text").map(function() {
    return $(this).text().trim();
  }).get().join("/");
	const fileList = $("#folder-input")[0].files;

	for (let file of fileList) {
		const uploadFileRes = await uploadFile(currentPath, file);
    console.log("uploadFileRes: ", uploadFileRes);
	}

	$("#folder-input").val("");
});

// create folder
const dialog = $("#create-folder-dialog").dialog({
  autoOpen: false,
  modal: true,
  buttons: {
    "Create": async function() {
      
      const currentPath = $(".path-text").map(function() {
        return $(this).text().trim();
      }).get().join("/");
      const createFolderName = $("#create-folder-name").val();

      const createFolderRes = await createFolder(currentPath, createFolderName);
      console.log("createFolderRes: ", createFolderRes);
      
      // TODO: if (createFolderRes.response.status !== 200)
      // if (createFolderRes.data && createFolderRes.data.msg === "Folder existed") {
      //   alert(`Folder ${createFolderName} has been existed`);
      // }

      $(this).dialog("close");
      $("#create-folder-name").val("");
    },
    "Cancel": function() {
      $(this).dialog("close");
      $("#create-folder-name").val("");
    }
  }
});

$("#create-button").on("click", function() {
  dialog.dialog("open");
});

// ==========================================================================
// delete
$("#delete-button").click(async function () {
  // const currentPath = $("#current-path").text();
  const currentPath = $(".path-text").map(function() {
    return $(this).text().trim();
  }).get().join("/");
  const selected = $("input[name='list-checkbox']:checked");
  
  const deleteFileRes = await deleteFile(currentPath, selected);
  console.log("deleteFileRes: ", deleteFileRes);
	
	selected.prop("checked", false);
	$("#delete-button").hide();
	$("#download-button").hide();
});

// download
$("#download-button").click(async function () {
  // const currentPath = $("#current-path").text();
  const currentPath = $(".path-text").map(function() {
    return $(this).text().trim();
  }).get().join("/");
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
