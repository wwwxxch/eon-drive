import { 
  uploadOneFileToS3,
  multipartToS3
} from "../util/api.js";

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
$("#form-upload").on("submit", async function(e) {
  e.preventDefault();
  const fileList = $("#file-input")[0].files;
  console.log(fileList);

  for (let element of fileList) {
    console.log(element);
    // if (element.size < chunk_unit) {
    //   await uploadOneFileToS3(element);
    // } else {
    //   const chunks = await splitFileIntoChunks(element, 5);
    //   await multipartToS3(element, chunks);
    // }

    const fileMetadata = await fetch("/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        filename: element.name,
        filesize: element.size,
        filerelpath: element.webkitRelativePath 
      })
    });  
    const fileMetadataRes = await fileMetadata.json();
    console.log(fileMetadataRes);
  }

  $("#file-input").val("");
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

// upload folder
$("#form-folder").on("submit", async function(e) {
  e.preventDefault();
  const fileList = $("#folder-input")[0].files;
  console.log($("#folder-input"));
  console.log(fileList);

  for (let element of fileList) {
    console.log(element);
    // if (element.size < chunk_unit) {
    //   await uploadOneFileToS3(element);
    // } else {
    //   const chunks = await splitFileIntoChunks(element, 5);
    //   await multipartToS3(element, chunks);
    // }
    const fileMetadata = await fetch("/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        filename: element.name,
        filesize: element.size,
        filerelpath: element.webkitRelativePath 
      })
    });
    const fileMetadataRes = await fileMetadata.json();
    console.log(fileMetadataRes); 
  }
  $("#folder-input").val("");
});


const fileList = $("#file-list");

function showList (obj) {
  obj.data.forEach(item => {
    const li = $("<li>").text(item.name);
    if (item.type !== "folder") {
      li.text(`${item.name} (${item.size} bytes)`);
    } else {
      li.addClass("folder").attr("data-folder-id", item.id);
    }
    fileList.append(li);
  });
}

const getList = await fetch("/list");
const getListData = await getList.json();

showList(getListData);

$("#file-list").on("click", ".folder", async function() {
  const dirId = $(this).data("folder-id");
  const getList = await fetch(`/list?dirId=${dirId}`);
  const getListData = await getList.json();
  $("#file-list").empty();
  showList(getListData);
});

