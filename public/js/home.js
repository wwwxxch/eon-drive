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
        <a href="http://localhost:9999/home.html?path=${item}">
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
    <a href="http://localhost:9999/home.html?path=${uri}">
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
