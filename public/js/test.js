import { 
  uploadOneFileToS3, 
  multipartToS3,
  getFileList
} from "./api.js";

async function splitFileIntoChunks(file, chunk_size) {
	const CHUNK_SIZE = chunk_size * 1024 * 1024; // MB
	const chunks = [];

	let start = 0;
	let end = CHUNK_SIZE;
	while (start < file.size) {
		const chunk = file.slice(start, end);
		chunks.push(chunk);
		start = end;
		end = start + CHUNK_SIZE;
	}

	return chunks;
}

const chunk_unit = 5 * 1024 * 1024;

// upload entire file to S3 & upload multipart to S3
$("#form-upload").on("submit", async function (e) {
	e.preventDefault();
	const fileList = $("#file-input")[0].files;
	console.log(fileList);

	for (let element of fileList) {
		console.log(element);
		if (element.size < chunk_unit) {
			await uploadOneFileToS3(element);
		} else {
			const chunks = await splitFileIntoChunks(element, 5);
			await multipartToS3(element, chunks);
		}

		const fileMetadata = await fetch("/upload-metadata", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filename: element.name,
				filesize: element.size,
				filerelpath: element.webkitRelativePath,
			}),
		});
		const fileMetadataRes = await fileMetadata.json();
		console.log(fileMetadataRes);
	}

	$("#file-input").val("");
});

// upload folder
$("#form-folder").on("submit", async function (e) {
	e.preventDefault();
	const fileList = $("#folder-input")[0].files;
	console.log($("#folder-input"));
	console.log(fileList);

	for (let element of fileList) {
		console.log(element);
		if (element.size < chunk_unit) {
			await uploadOneFileToS3(element);
		} else {
			const chunks = await splitFileIntoChunks(element, 5);
			await multipartToS3(element, chunks);
		}
		const fileMetadata = await fetch("/upload-metadata", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filename: element.name,
				filesize: element.size,
				filerelpath: element.webkitRelativePath,
			}),
		});
		const fileMetadataRes = await fileMetadata.json();
		console.log(fileMetadataRes);
	}
	$("#folder-input").val("");
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
			} else {
				$("#delete-button").hide();
			}
		});

		if (item.type !== "folder") {
			span.text(`${item.name} (${item.size} bytes)`);
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
const homeList = await getFileList("");
showList(homeList);

// click folder --> show lists under that folder
$("#file-list").on("click", ".folder", async function () {
	// const dirId = $(this).data("folder-id");
	const dirName = $(this).text();
	const newPath = `${$("#current-path").text()}/${dirName}`;

	// clear file list and get file list under new dir
	$("#file-list").empty();
  const newList = await getFileList(newPath);
	showList(newList);

	// update current path
	$("#current-path").text(newPath);
});

// ==========================================================================
// delete
$("#delete-button").click(async function () {
	const selected = $("input[name='list-checkbox']:checked");
	console.log("selected: ", selected.toArray());
	const fileToDelete = selected
		.toArray()
		.map((tickbox) => {
      if ($("#current-path").text() === "") {
        return tickbox.value;
      }
      else {
        let parentPath = $("#current-path").text().replace(/^\//,"");
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
	  body: JSON.stringify({ delList: fileToDelete })
	});
  const deleteMetadataRes = await deleteMetadata.json();
  console.log(deleteMetadataRes);
  
  $("#file-list").empty();
  const newList = await getFileList($("#current-path").text());
	showList(newList);

	selected.prop("checked", false);
	$("#delete-button").hide();
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
