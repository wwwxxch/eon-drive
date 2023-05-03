import { getShareFoList, downloadShareFo } from "../../api/view.js";
import { formatTime } from "../../util/util.js";

function showShareFoList(obj) {
	if (obj.data.length === 0) {
		$(".fo-dl-btn").hide();
		$("thead").hide();
		$("tbody").hide();
		return;
	}
	obj.data.forEach((item) => {
		const cellName = `
      <td style="width: 29vw">
        <div class="${item.type} ff" data-id="${item.id}">
          ${item.name}
        </div>
      </td>
    `;
		let cellTime;
		if (item.type === "folder") {
			cellTime = `
        <td >
          <div class="d-flex justify-content-between">
            <div>-</div>
            <div>
              <button class="btn individual-dl-btn custom-operation-btn">
                Download
              </button>
            </div>
          </div>
        </td>
      `;
		} else if (item.type === "file") {
			cellTime = `
        <td > 
          <div class="d-flex justify-content-between">
            <div>${formatTime(item.updated_at)}</div>
            <div>
              <button class="btn individual-dl-btn custom-operation-btn">
                Download
              </button>
            </div>
          </div>
        </td>
      `;
		}
		const tr = $("<tr>").addClass("ff-row");
		tr.append(cellName, cellTime);
		$("#fo-list-tbody").append(tr);
	});
}

// show list for new request
const windowPathName = window.location.pathname;
const shareToken = windowPathName.split("/")[3];
console.log(shareToken);
const subPath = windowPathName.split("/").slice(4).join("/");
console.log("subPath: ", subPath);

const target = $("#share-path").data("target-name");
console.log("target: ", target);

const res = await getShareFoList(shareToken, subPath);
showShareFoList(res);

if (subPath) {
	const pathArray = subPath.split("/").reduce((prev, curr, i) => {
		const folder = i === 0 ? curr : `${prev[i - 1]}/${curr}`;
		return [...prev, folder];
	}, []);
	// console.log(pathArray);

	$("#share-path").empty();
	$("#share-path").append(`
    <a href="/view/fo/${shareToken}">
      <h3><span class="path-text">${target}</span></h3>
    </a>
  `);
	pathArray.forEach((item, i) => {
		$("#share-path").append(`
      <span class="slash"> / </span>
      <a href="/view/fo/${shareToken}/${item}">
        <h3><span class="path-text">${item.split("/").pop()}</span></h3>
      </a>
    `);
	});
}

// show list when clicking
$("#fo-list-table").on("click", ".folder", async function () {
  console.log("#list-table on click");
	const dirName = $(this).text().trim();
	const pathTexts = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	const uri = pathTexts.includes("/")
		? `${pathTexts.split("/").slice(1).join("/")}/${dirName}`
		: dirName;

	console.log("dirName: ", dirName);
	console.log("pathTexts: ", pathTexts);
	console.log("uri: ", uri);

	history.pushState({}, "", `/view/fo/${shareToken}/${uri}`);
	const subRes = await getShareFoList(shareToken, uri);
	// console.log("subRes: ", subRes);

	$("#fo-list-tbody").empty();
	showShareFoList(subRes);

	$("#share-path").append(`
    <span class="slash"> / </span>
    <a href="/view/fo/${shareToken}/${uri}">
      <h3><span class="path-text">${dirName}</span></h3>
    </a>
  `);
});

$(window).on("popstate", async function () {
	console.log("popstate");
  const windowPathName = window.location.pathname;
  const shareToken = windowPathName.split("/")[3];
  console.log(shareToken);
  const subPath = windowPathName.split("/").slice(4).join("/");
  console.log("subPath: ", subPath);

  const res = await getShareFoList(shareToken, subPath);
  $("#fo-list-tbody").empty();
  showShareFoList(res);

  $("#share-path").empty();
  $("#share-path").append(`
    <a href="/view/fo/${shareToken}">
      <h3><span class="path-text">${target}</span></h3>
    </a>
  `);

  if (subPath) {
    const pathArray = subPath.split("/").reduce((prev, curr, i) => {
      const folder = i === 0 ? curr : `${prev[i - 1]}/${curr}`;
      return [...prev, folder];
    }, []);
    // console.log(pathArray);

    pathArray.forEach((item, i) => {
      $("#share-path").append(`
        <span class="slash"> / </span>
        <a href="/view/fo/${shareToken}/${item}">
          <h3><span class="path-text">${item.split("/").pop()}</span></h3>
        </a>
      `);
    });
  }
});

const downloadModal = $("#waitingModal");
const downloadStatus = $("#waiting-status");
const downloadSpinner = $("#waiting-spinner");
const downloadComplete = $("#waiting-complete");
const downloadError = $("#waiting-error");

// download folder
$(".fo-dl-btn").on("click", async function () {
	const pathTexts = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(shareToken);
	console.log(pathTexts);

	downloadModal.modal("show");
	downloadStatus.text("Downloading...");
	downloadSpinner.addClass("spinner-border");
	downloadComplete.hide();
	downloadError.html();

	const downloadFileRes = await downloadShareFo(shareToken, pathTexts + "/");
	if (downloadFileRes.status === 200) {
		downloadSpinner.removeClass("spinner-border");
		// setTimeout(() => downloadStatus.text("Complete!"), 100);
		setTimeout(() => downloadModal.modal("hide"), 200);
    setTimeout(() => window.open(downloadFileRes.downloadUrl, "_self"), 100);
		return;
	} else if (downloadFileRes.status !== 500) {
		let errorHTML;
		if (typeof downloadFileRes.data.error === "string") {
			errorHTML = `<span>${downloadFileRes.data.error}</span>`;
		} else {
			errorHTML = downloadFileRes.data.error
				.map((err) => `<span>${err}</span>`)
				.join("");
		}
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(errorHTML);
	} else {
		const errorHTML =
			"<span>Opps! Something went wrong. Please try later or contact us.</span>";
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(errorHTML);
	}
	setTimeout(() => downloadModal.modal("hide"), 3000);
});

// download individual file/folder
$("#fo-list-table").on("click", ".individual-dl-btn", async function () {
  const pathTexts = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(pathTexts);
	const $tr = $(this).closest("tr");
	const target = $tr.find(".ff").text().trim();
	const targetClass = $tr.find(".ff").attr("class").split(" ");

	let desired;
	if (targetClass.includes("file")) {
		desired = pathTexts + "/" + target;
	} else if (targetClass.includes("folder")) {
		desired = pathTexts + "/" + target + "/";
	}

	downloadModal.modal("show");
	downloadStatus.text("Downloading...");
	downloadSpinner.addClass("spinner-border");
	downloadComplete.hide();
	downloadError.html();

	const downloadFileRes = await downloadShareFo(shareToken, desired);
	if (downloadFileRes.status === 200) {
		downloadSpinner.removeClass("spinner-border");
		// setTimeout(() => downloadStatus.text("Complete!"), 100);
		setTimeout(() => downloadModal.modal("hide"), 200);
		setTimeout(() => window.open(downloadFileRes.downloadUrl, "_self"), 100);
		return;
	} else if (downloadFileRes.status !== 500) {
		let errorHTML;
		if (typeof downloadFileRes.data.error === "string") {
			errorHTML = `<span>${downloadFileRes.data.error}</span>`;
		} else {
			errorHTML = downloadFileRes.data.error
				.map((err) => `<span>${err}</span>`)
				.join("");
		}
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(errorHTML);
	} else {
		const errorHTML =
			"<span>Opps! Something went wrong. Please try later or contact us.</span>";
		downloadSpinner.removeClass("spinner-border");
		downloadStatus.text("");
		downloadError.html(errorHTML);
	}
	setTimeout(() => downloadModal.modal("hide"), 3000);
});
