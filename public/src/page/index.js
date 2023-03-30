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

// upload entire file to S3 & upload multipart to S3
$("#form-upload").on("submit", async function(e) {
  e.preventDefault();
  const fileList = $("#file-input")[0].files;
  console.log(fileList);

  for (let element of fileList) {
    console.log(element);
    if (element.size < 5 * 1024 * 1024) {
      await uploadOneFileToS3(element);
    } else {
      const chunks = await splitFileIntoChunks(element, 5);
      await multipartToS3(element, chunks);
    }
  }
});


// split chunks manully then upload it to S3
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
    if (element.size < 5 * 1024 * 1024) {
      await uploadOneFileToS3(element);
    } else {
      const chunks = await splitFileIntoChunks(element, 5);
      await multipartToS3(element, chunks);
    }
  }
});