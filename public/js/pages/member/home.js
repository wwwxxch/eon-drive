import { getFileList } from "../../api/list.js";
import { formatTime } from "../../util/util.js";

const threedotsSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" fill="currentColor" class="bi bi-three-dots links-operation-svg"
  viewBox="0 0 16 16">
    <path
      d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
`;

const personplusSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" height="18" fill="currentColor" class="bi bi-person-plus"
  viewBox="0 0 16 16">
  <path
    d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
  <path fill-rule="evenodd"
    d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z" />
  </svg>
`;

const unlinkSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" height="18" fill="currentColor" class="bi" shape-rendering="geometricPrecision" text-rendering="geometricPrecision"
  image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 509.84">
  <path fill-rule="nonzero"
    d="M245.14 352.14c8.49-8.49 22.27-8.49 30.76 0 8.5 8.5 8.5 22.27 0 30.76l-58.53 58.54c-20.35 20.34-47.15 30.51-73.94 30.51s-53.6-10.17-73.94-30.51c-20.34-20.35-30.52-47.15-30.52-73.94 0-26.78 10.18-53.6 30.52-73.94l58.53-58.53c8.5-8.5 22.27-8.5 30.77 0 8.49 8.49 8.49 22.27 0 30.76l-58.54 58.53c-11.84 11.85-17.77 27.51-17.77 43.18 0 15.67 5.93 31.33 17.77 43.17 11.85 11.85 27.51 17.78 43.18 17.78 15.67 0 31.33-5.93 43.17-17.77l58.54-58.54zm46.1-92.68c8.47 8.48 8.47 22.24 0 30.71-8.48 8.47-22.23 8.47-30.71 0l-39.78-39.78c-8.47-8.48-8.47-22.23 0-30.71 8.48-8.47 22.23-8.47 30.71 0l39.78 39.78zm45.28 245.07-25.07 5.19c-3.24.66-6.43-1.44-7.09-4.68l-16.18-78.09a6.006 6.006 0 0 1 4.66-7.11l25.05-5.29c3.27-.65 6.45 1.44 7.11 4.69l16.21 78.2c.66 3.25-1.44 6.43-4.69 7.09zM178.82 6.26 203.39.18c3.22-.8 6.48 1.17 7.28 4.38l19.46 77.29c.8 3.23-1.16 6.5-4.39 7.31l-24.8 6.28c-3.23.8-6.5-1.16-7.31-4.38l-19.46-77.43c-.81-3.23 1.16-6.5 4.38-7.31l.27-.06zm264.17 419.63-17.86 18.43a6.03 6.03 0 0 1-8.52 0l-57.22-55.51a6.015 6.015 0 0 1-.11-8.5l17.8-18.39c2.32-2.38 6.13-2.44 8.51-.12l57.28 55.58a6.027 6.027 0 0 1 .12 8.51zm68.81-112.11-6.62 24.69c-.85 3.21-4.15 5.12-7.37 4.26l-77.08-20.62c-3.22-.86-5.12-4.16-4.27-7.38l6.64-24.72c.86-3.21 4.16-5.12 7.38-4.27l77.05 20.67c3.21.85 5.12 4.16 4.27 7.37zM.38 201.65l6.97-24.15a6.025 6.025 0 0 1 7.42-4.11l76.66 21.79c3.2.91 5.05 4.25 4.15 7.45l-6.96 24.61a6.034 6.034 0 0 1-7.42 4.17L4.38 209.55a6.035 6.035 0 0 1-4.15-7.45l.15-.45zM65.14 87.17l17.84-17.81c2.35-2.34 6.17-2.33 8.51.02l56.38 56.41c2.33 2.35 2.33 6.15 0 8.49l-18.06 18.11a6.014 6.014 0 0 1-8.5.02L64.85 95.97a6.03 6.03 0 0 1 0-8.52l.29-.28zm200.98 71.28c-8.49 8.5-22.27 8.5-30.76 0-8.5-8.49-8.5-22.26 0-30.76l59.26-59.26 1.38-1.27c20.23-19.51 46.43-29.26 72.56-29.26 26.78 0 53.58 10.18 73.93 30.53 20.35 20.35 30.53 47.16 30.53 73.94 0 26.79-10.18 53.59-30.52 73.94l-59.26 59.26c-8.5 8.49-22.27 8.49-30.77 0-8.49-8.49-8.49-22.27 0-30.76l59.27-59.27c11.84-11.84 17.77-27.5 17.77-43.17 0-15.67-5.93-31.33-17.77-43.17-11.86-11.86-27.52-17.79-43.18-17.79-15.3 0-30.55 5.59-42.22 16.76l-60.22 60.28z" />
  </svg>
`;

const folderSVG = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="16"
    fill="currentColor"
    class="bi bi-folder type-icon"
    viewBox="0 0 16 16">
    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z" />
  </svg>
`;

// const fileSVG = `
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     height="16"
//     fill="currentColor"
//     class="bi bi-file-earmark-text type-icon"
//     viewBox="0 0 16 16">
//     <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
//     <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
//   </svg>
// `;

const fileSVG = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="16"
    fill="currentColor"
    class="bi bi-files type-icon"
    viewBox="0 0 16 16">
    <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z" />
  </svg>
`;

//show usage
const usageRes = await axios.get("/usage");
console.log(usageRes);
const usedNum = parseInt(usageRes.data.used);
const allocatedNum = parseInt(usageRes.data.allocated);
const percent = (usedNum / allocatedNum) * 100;
$(".usage-progress").css("width", percent + "%");
$(".usage-progress").attr("aria-valuenow", percent);
if (percent > 50 && percent < 90) {
	$(".progress-bar").css("background-color", "#d69f65");
} else if (percent >= 90) {
	$(".progress-bar").css("background-color", "#c22f2f");
}
const numerator = Math.round((usedNum / (1024 * 1024)) * 100) / 100;
const denominator = allocatedNum / (1024 * 1024);
$("#progress-des").text(`${numerator} MB / ${denominator} MB`);

// =====================================================================================
// showList function
let table;
function showList(obj) {
	console.log("showList: ", obj);
	// if (obj.data.length === 0) {
	// 	console.log("obj.data.length === 0");
	// 	$("#list-table").hide();
	//   $("#no-data").text("Blank folder");
	// 	return;
	// } else {
	// 	console.log("obj.data.length !== 0");
	// 	$("#list-table").show();
	//   $("#no-data").text("");
	// }
	const path = window.location.pathname.split("/").slice(2).join("/");
	// console.log(path);
	table = $("#list-table").DataTable({
		data: obj.data,
		columns: [
			{
				data: "name",
				render: function (data, type, row, meta) {
					const tickboxValue =
						row.type === "folder" ? row.name + "/" : row.name;
					// console.log("tickboxValue: ", tickboxValue);
					const tickbox = `<input type="checkbox" name="list-checkbox" value="${tickboxValue}">`;
					return tickbox;
				},
			},
			{
				data: "name",
				render: function (data, type, row, meta) {
          let icon;
          let ffSpan;
					if (row.type === "folder") {
            icon = folderSVG;
						ffSpan = `<span class="${row.type} ff_name" data-id="${row.id}">${data}</span>`;
					} else {
            icon = fileSVG;
						const uri = path === "" ? data : `${path}/${data}`;
						ffSpan = `<a class="file-link" href="/history/${uri}">
                      <span class="${row.type} ff_name" data-id="${row.id}">${data}</span>
                      </a>
                    `;
					}
          return `
            <div class="d-flex align-items-center">
              <div>${icon}</div>
              <div>${ffSpan}</div>
            </div>
          `;
				},
			},
			{
				data: "updated_at",
				render: function (data, type, row, meta) {
					const time = row.type === "folder" ? "-" : formatTime(data);
					const disabledAttr = row.is_shared === 1 ? "" : "disabled";
          const div = `
            <div class="d-flex justify-content-between">
              <div class="d-flex align-items-center">
                <div>${time}</div>
              </div>
              <div class="link-group">
                <button title="Get Link" type="button" class="btn btn-link links-operation links-item get-link"
                  data-bs-toggle="modal" data-bs-target="#getLinkModal">
                  ${personplusSVG}
                </button>
                <button title="Revoke Link" type="button" class="btn btn-link links-operation links-item revoke-link"
                  data-bs-toggle="modal" data-bs-target="#revokeLinkModal" ${disabledAttr}>
                  ${unlinkSVG}
                </button>
              </div>
            </div>
          `;
					// const div = `
          //   <div class="d-flex justify-content-between">
          //     <div class="d-flex align-items-center">
          //       <div>${time}</div>
          //     </div>
          //     <div class="dropdown">
          //       <button class="btn btn-link links-operation"  type="button" id="linksOperationMenu"
          //         data-bs-toggle="dropdown" data-mdb-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          //         ${threedotsSVG}
          //       </button>
          //       <div class="dropdown-menu" aria-labelledby="linksOperationMenu">
          //         <button type="button" class="dropdown-item links-item get-link"
          //           data-bs-toggle="modal" data-bs-target="#getLinkModal">
          //           Get Link</button>
          //         <button type="button" class="dropdown-item links-item revoke-link"
          //           data-bs-toggle="modal" data-bs-target="#revokeLinkModal" ${disabledAttr}>
          //           Revoke Link</button>
          //       </div>
          //     </div>
          //   </div>
          // `;
					return div;
				},
			},
		],
		searching: false,
		lengthChange: false,
	});
}

// =================================================================================
// show file list on page load (new request)
console.log("window.location.pathname: ", window.location.pathname);
const path = window.location.pathname.split("/").slice(2).join("/");
const list = await getFileList(path === "" ? "Home" : "Home/" + path);
if (!list) {
	$("#list-table").hide();
	$("#upload-dropdown").hide();
	$("#create-folder").hide();
	$("#drag-drop-box").css("color", "grey");
	$("#drag-drop-zone").off("dragenter");
	$("#drag-drop-zone").off("dragover");
	$("#drag-drop-zone").off("dragleave");
	$("#drag-drop-zone").off("dragdrop");
	$("#no-data").append("<h3>Invalid Path</h3>");
}
showList(list);

$("#whole-path").append(`
  <a href="/home">
    <h4><span class="path-text">Home</span></h4>
  </a>
`);

if (path !== "") {
	const pathArray = path.split("/").reduce((prev, curr, i) => {
		const folder = i === 0 ? curr : `${prev[i - 1]}/${curr}`;
		return [...prev, folder];
	}, []);
	// console.log("pathArray: ", pathArray);
	pathArray.forEach((item) => {
		$("#whole-path").append(`
      <span class="slash"> / </span>
      <a href="/home/${decodeURIComponent(item)}">
        <h4>
          <span class="path-text">
            ${decodeURIComponent(item.split("/").pop())}
          </span>
        </h4>
      </a>
    `);
	});
}
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
	console.log("currentPath: ", currentPath);
	console.log("pathTexts: ", pathTexts);

	if (currentPath === data.parentPath) {
		if ($("#list-table").is(":visible")) {
			table.destroy();
		}
		showList(data.list);
	}
});

socket.on("usageupd", (data) => {
	const usedNum = parseInt(data.used);
	const allocatedNum = parseInt(data.allocated);
	const percent = (usedNum / allocatedNum) * 100;

	$(".usage-progress").css("width", percent + "%");
	$(".usage-progress").attr("aria-valuenow", percent);

	if (percent > 50 && percent < 90) {
		$(".progress-bar").css("background-color", "#d69f65");
	} else if (percent >= 90) {
		$(".progress-bar").css("background-color", "#c22f2f");
	}

	const numerator = Math.round((usedNum / (1024 * 1024)) * 100) / 100;
	const denominator = allocatedNum / (1024 * 1024);
	$("#progress-des").text(`${numerator} MB / ${denominator} MB`);
});
// =================================================================================
// click folder --> show lists under that folder
$("#list-table").on("click", ".folder", async function () {
	console.log("#list-table on click");
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

	// clear file list and get file list under current folder
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
	console.log("popstate");
	const path = window.location.pathname.split("/").slice(2).join("/");
	const list = await getFileList(path === "" ? "Home" : "Home/" + path);
	table.destroy();
	showList(list);

	$("#whole-path").empty().append(`
      <a href="/home">
        <h4><span class="path-text">Home</span></h4>
      </a>
    `);

	if (path !== "") {
		const pathArray = path.split("/").reduce((prev, curr, i) => {
			const folder = i === 0 ? curr : `${prev[i - 1]}/${curr}`;
			return [...prev, folder];
		}, []);
		// console.log("pathArray: ", pathArray);

		pathArray.forEach((item) => {
			$("#whole-path").append(`
        <span class="slash"> / </span>
        <a href="/home/${decodeURIComponent(item)}">
          <h4>
            <span class="path-text">
              ${decodeURIComponent(item).split("/").pop()}
            </span>
          </h4>
        </a>
      `);
		});
	}
});
// ==============================================================================
// checkbox
$("#list-table").on("change", "input[name='list-checkbox']", function () {
	const selected = $("input[name='list-checkbox']:checked");
	const selectedVal = selected.toArray().map((item) => item.value);
	// console.log("block: ", selectedVal);
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

$(document).click(function (e) {
	if (!$(e.target).is("input[name='list-checkbox'], #select-all")) {
		$("input[name='list-checkbox']").prop("checked", false);
		$("#select-all").prop("checked", false);
		$("#delete-btn-div").hide();
		$("#download-btn-div").hide();
	}
});
