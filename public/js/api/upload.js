import { CHUNK_SIZE } from "../constant/constant.js";
import { splitFileIntoChunks } from "../util/util.js";

// 1. startUpload
const startUpload = async (fileName, fileWholePath, fileSize, fileSplit) => {
	try {
		const start = await axios({
			url: "/upload-start",
			method: "post",
			data: { fileName, fileWholePath, fileSize, fileSplit },
		});
		console.log("start.status: ", start.status);
		return start;
	} catch (e) {
		console.error("startUpload: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

// 2. singleUpload
const singleUpload = async (url, file) => {
	try {
		const putFile = await axios({
			url: url,
			method: "put",
			data: file,
		});
		console.log("putFile: ", putFile);
		return { status: putFile.status };
	} catch (e) {
		console.error("singleUpload: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

// 3. multiUpload
const multiUpload = async (partUrls, completeUrl, chunkArray) => {
	const etagArray = Array(chunkArray.length);
	const putRequests = [];
	try {
		// upload parts
		for (let i = 0; i < partUrls.length; i++) {
			const putParts = fetch(partUrls[i], {
				method: "PUT",
				headers: {
					"Content-Type": "application/octet-stream",
				},
				body: chunkArray[i],
			})
				.then((res) => {
					console.log(`Part ${i + 1} has been uploaded`);
					etagArray[i] = res.headers.get("etag").replace(/"/g, "");
				})
				.catch((err) => {
					console.error(err);
					return { status: err };
				});
			putRequests.push(putParts);
		}

		// complete multipart upload
		return Promise.all(putRequests).then(async () => {
			const xmlBody = `
          <CompleteMultipartUpload>
            ${etagArray
							.map((item, i) => {
								return `
                <Part>
                  <PartNumber>${i + 1}</PartNumber>
                  <ETag>${item}</ETag>
                </Part>
              `;
							})
							.join("")}
          </CompleteMultipartUpload>
        `;

			const completeMultipart = await fetch(completeUrl, {
				method: "POST",
				headers: { "Content-Type": "application/xml" },
				body: xmlBody,
			});
			console.log("completeMultipart.status: ", completeMultipart.status);
			return { status: completeMultipart.status };
		});
	} catch (e) {
		console.error("multiUpload: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

// 4. uploadFailedNoti
const uploadFailedNoti = async (token) => {
	try {
		const failedNoti = await axios({
			url: "/upload-failed",
			method: "post",
			data: { token },
		});
		console.log("failedNoti.status: ", failedNoti.status);
		return { status: failedNoti.status };
	} catch (e) {
		console.error("uploadFailedNoti: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

// 5. commitUpload
const commitUpload = async (token, parentPath) => {
	try {
		const commit = await axios({
			url: "/upload-commit",
			method: "post",
			data: {
				token: token,
				parentPath: parentPath,
			},
		});
		console.log("commit.status: ", commit.status);
		return { status: commit.status };
	} catch (e) {
		console.error("commitUpload: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

// ==============================================================================
const uploadFile = async (currentDir, file, modalObj) => {
	modalObj.uploadModal.modal("show");
	modalObj.uploadStatus.text("Uploading...");
	modalObj.uploadSpinner.addClass("spinner-border");
	modalObj.uploadComplete.hide();
	modalObj.uploadError.empty();

	// 0. request payload
	let fileUsed = {};
  let fileItself;
	if (file.modified) {
		fileUsed.name = file.file.name;
		fileUsed.size = file.file.size;
		fileUsed.webkitRelativePath = file.webkitRelativePath;
    fileItself = file.file;
	} else {
		fileUsed = file;
    fileItself = file;
	}

	let parentPath = "";
	if (currentDir !== "Home") {
		parentPath = currentDir.split("/").slice(1).join("/");
	}
	console.log("parentPath: ", parentPath);

	let wholePath = "";
	if (fileUsed.webkitRelativePath) {
		wholePath = (
			(parentPath === "" ? "" : parentPath + "/") + fileUsed.webkitRelativePath
		).trim();
	} else {
		wholePath = (
			(parentPath === "" ? "" : parentPath + "/") + fileUsed.name
		).trim();
	}
	console.log("wholePath: ", wholePath);

	let splitCount = 1;
	if (fileUsed.size > CHUNK_SIZE) {
		splitCount = Math.ceil(fileUsed.size / CHUNK_SIZE);
	}

	try {
		// 1. fetch /upload-start
		const startUploadRes = await startUpload(
			fileUsed.name,
			wholePath,
			fileUsed.size,
			splitCount
		);
		console.log("startUploadRes.status: ", startUploadRes.status);
		if (startUploadRes.status !== 200 && startUploadRes.status !== 500) {
			let errorHTML;
			if (typeof startUploadRes.data.error === "string") {
				errorHTML = `<span>${startUploadRes.data.error}</span>`;
			} else {
				errorHTML = singleUpload.data.error
					.map((item) => {
						return `<div>${item}</div>`;
					})
					.join(" ");
			}
			modalObj.uploadSpinner.removeClass("spinner-border");
			modalObj.uploadStatus.text("");
			modalObj.uploadError.html(errorHTML);
			setTimeout(() => modalObj.uploadModal.modal("hide"), 2000);

			// notify server that this upload failed
			const uploadFailed = await uploadFailedNoti(token);
			return false;
		} else if (startUploadRes.status === 500) {
			let errorHTML =
				"<span>Opps! Something went wrong. Please try later or contact us.</span>";
			modalObj.uploadSpinner.removeClass("spinner-border");
			modalObj.uploadStatus.text("");
			modalObj.uploadError.html(errorHTML);
			setTimeout(() => modalObj.uploadModal.modal("hide"), 2000);

			// notify server that this upload failed
			const uploadFailed = await uploadFailedNoti(token);
			return false;
		}

		const { singleUrl, partUrls, completeUrl, token } = startUploadRes.data;

		// 2. fetch S3 presigned URL
		let toS3Res;
		if (singleUrl) {
			const singleUploadRes = await singleUpload(singleUrl, file);
			console.log("singleUploadRes: ", singleUploadRes);
			toS3Res = singleUploadRes.status;
		} else if (completeUrl) {
			const chunks = await splitFileIntoChunks(fileItself, fileUsed.size, CHUNK_SIZE);
			const multiUploadRes = await multiUpload(partUrls, completeUrl, chunks);
			console.log("multiUploadRes: ", multiUploadRes);
			toS3Res = multiUploadRes.status;
		}

		if (toS3Res !== 200) {
			console.error("toS3Res: ", toS3Res);

			let errorHTML =
				"<span>Opps! Something went wrong. Please try later or contact us.</span>";
			modalObj.uploadSpinner.removeClass("spinner-border");
			modalObj.uploadStatus.text("");
			modalObj.uploadError.html(errorHTML);
			setTimeout(() => modalObj.uploadModal.modal("hide"), 2000);

			// notify server that this upload failed
			const uploadFailed = await uploadFailedNoti(token);
			return false;
		}

		// 3. fetch /upload-commit
		const commitUploadRes = await commitUpload(token, parentPath);
		if (commitUploadRes.status !== 200 && commitUploadRes.status !== 500) {
			let errorHTML = `<span>${commitUploadRes.data.error}</span>`;
			modalObj.uploadSpinner.removeClass("spinner-border");
			modalObj.uploadStatus.text("");
			modalObj.uploadError.html(errorHTML);
			setTimeout(() => modalObj.uploadModal.modal("hide"), 2000);

			// notify server that this upload failed
			const uploadFailed = await uploadFailedNoti(token);
			return false;
		} else if (commitUploadRes.status === 500) {
      let errorHTML =
				"<span>Opps! Something went wrong. Please try later or contact us.</span>";
			modalObj.uploadSpinner.removeClass("spinner-border");
			modalObj.uploadStatus.text("");
			modalObj.uploadError.html(errorHTML);
			setTimeout(() => modalObj.uploadModal.modal("hide"), 2000);

			// notify server that this upload failed
			const uploadFailed = await uploadFailedNoti(token);
			return false;
		}

		// 4. show complete message
		// modalObj.uploadSpinner.removeClass("spinner-border");
		// modalObj.uploadComplete.show();
		// setTimeout(() => modalObj.uploadStatus.text("Complete!"), 100);
		// setTimeout(() => modalObj.uploadModal.modal("hide"), 1500);

		return true;
	} catch (e) {
		console.error("uploadFile: ", e);
		return false;
	}
};

export { uploadFile };
