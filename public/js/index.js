import { 
  uploadOneFileToS3, 
  multipartToS3,
  uploadMetadata,
  getFileList
} from "./api.js";

import { splitFileIntoChunks } from "./utils.js";

const chunkSize = 5 * 1024 * 1024;

// upload file
$("#form-file").on("submit", async function (e) {
	e.preventDefault();
  const currentPath = $("#current-path").text();
	const fileList = $("#file-input")[0].files;

	for (let element of fileList) {
		if (element.size < chunkSize) {
			const isUpload = await uploadOneFileToS3(currentPath, element);
      console.log("isUpload: ", isUpload);
      const uploadMeta = await uploadMetadata(currentPath, element);
      console.log("uploadMeta: ", uploadMeta);
		} else {
			const chunks = await splitFileIntoChunks(element, chunkSize);
			const isUpload = await multipartToS3(currentPath, element, chunks);
      console.log("isUpload: ", isUpload);
      const uploadMeta = await uploadMetadata(currentPath, element);
      console.log("uploadMeta: ", uploadMeta);
		}
	}

	$("#file-input").val("");
  // $("#file-list").empty();
  // const newList = await getFileList($("#current-path").text());
	// showList(newList);
});

// upload folder
$("#form-folder").on("submit", async function (e) {
	e.preventDefault();
  const currentPath = $("#current-path").text();
	const fileList = $("#folder-input")[0].files;

	for (let element of fileList) {
		if (element.size < chunkSize) {
      const isUpload = await uploadOneFileToS3(currentPath, element);
      console.log("isUpload: ", isUpload);
      const uploadMeta = await uploadMetadata(currentPath, element);
      console.log("uploadMeta: ", uploadMeta);
		} else {
      const chunks = await splitFileIntoChunks(element, chunkSize);
			const isUpload = await multipartToS3(currentPath, element, chunks);
      console.log("isUpload: ", isUpload);
      const uploadMeta = await uploadMetadata(currentPath, element);
      console.log("uploadMeta: ", uploadMeta);
		}
	}

	$("#folder-input").val("");
  // $("#file-list").empty();
  // const newList = await getFileList($("#current-path").text());
	// showList(newList);
});

// ==========================================================================
// User Interface
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
			span.text(`${item.name} (${item.size} bytes) ${new Date(item.updated_at).toLocaleString()}`);
			span.addClass("file").attr("data-file-id", item.id);
		} else {
			span.text(item.name);
			span.addClass("folder").attr("data-folder-id", item.id);
		}

		div.append(tickbox, span);
		fileList.append(div);
	});
}

// HOME PAGE
const homeList = await getFileList("Home");
showList(homeList);

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
  console.log("socket.on listupd: ", data);
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
// delete
$("#delete-button").click(async function () {
  let currentPath = "";
  if ($("#current-path").text() !== "Home") {
    currentPath = $("#current-path").text().split("/").slice(1).join("/");
  }

	const selected = $("input[name='list-checkbox']:checked");
	const fileToDelete = selected
		.toArray()
		.map((tickbox) => {
      if ($("#current-path").text() === "Home") {
        return tickbox.value;
      }
      else {
        let parentPath = $("#current-path").text().replace(/^Home\//,"");
        return `${parentPath}/${tickbox.value}`;
      }
    });
	console.log(fileToDelete);

	const deleteResult = await fetch("/delete", {
	  method: "POST",
	  headers: {
	    "Content-Type": "application/json"
	  },
	  body: JSON.stringify({ delList: fileToDelete })
	});
	const deleteResultData = await deleteResult.json();
  console.log(deleteResultData);

  const deleteMetadata = await fetch("/delete-metadata", {
	  method: "POST",
	  headers: {
	    "Content-Type": "application/json"
	  },
	  body: JSON.stringify({ 
      delList: fileToDelete,
      parentPath: currentPath
    })
	});
  const deleteMetadataRes = await deleteMetadata.json();
  console.log(deleteMetadataRes);
  
  // $("#file-list").empty();
  // const newList = await getFileList($("#current-path").text());
	// showList(newList);

	selected.prop("checked", false);
	$("#delete-button").hide();
  $("#download-button").hide();
});

// download
$("#download-button").click(async function () {
	const selected = $("input[name='list-checkbox']:checked");
  let parentPath;
	const fileToDownload = selected
		.toArray()
		.map((tickbox) => {
      console.log(tickbox.value);
      if ($("#current-path").text() === "Home") {
        parentPath = "/";
        return tickbox.value;
      }
      else {        
        parentPath = $("#current-path").text().replace(/^Home/,"");
        return `${parentPath}/${tickbox.value}`;
      }
    });
	console.log(fileToDownload);

	const downloadResult = await fetch("/download", {
	  method: "POST",
	  headers: {
	    "Content-Type": "application/json"
	  },
	  body: JSON.stringify({ 
      downloadList: fileToDownload,
      parentPath: parentPath 
    })
	});
	const downloadResultData = await downloadResult.json();
  // console.log(downloadResultData);
  window.open(downloadResultData.downloadUrl, "_self");

	selected.prop("checked", false);
  $("#delete-button").hide();
	$("#download-button").hide();
});

// ==========================
// split chunks manully then upload it to S3
// to be testd

// $("#form-chunks").on("submit", async function(e) {
//   e.preventDefault();
//   const fileList = $("#file-input-chunks")[0].files;
//   for (let element of fileList) {
//     console.log(element);
//     if (element.size < 2 * 1024 * 1024) {
//       await uploadOneFileToS3(element.name, element);
//     } else {
//       const chunks = await splitFileIntoChunks(element, 2);
//       for (let i = 0; i < chunks.length; i++) {
//         await uploadOneFileToS3(element.name, chunks[i]);
//       }
//     }
//   }
// });
// =============================
