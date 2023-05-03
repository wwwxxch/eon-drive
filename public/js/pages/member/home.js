import { getFileList } from "../../api/list.js";
import { formatTime } from "../../util/util.js";

const threedotsSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" fill="currentColor" class="bi bi-three-dots links-operation-svg"
  viewBox="0 0 16 16">
    <path
      d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
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
					if (row.type === "folder") {
						return `<span class="${row.type} ff_name" data-id="${row.id}">${data}</span>`;
					} else {
						const uri = path === "" ? data : `${path}/${data}`;
						return `<a class="file-link" href="/history/${uri}">
                      <span class="${row.type} ff_name" data-id="${row.id}">${data}</span>
                      </a>
                    `;
					}
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
              <div class="dropdown">
                <button class="btn btn-link links-operation"  type="button" id="linksOperationMenu"
                  data-bs-toggle="dropdown" data-mdb-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  ${threedotsSVG}
                </button>
                <div class="dropdown-menu" aria-labelledby="linksOperationMenu">
                  <button type="button" class="dropdown-item links-item get-link"
                    data-bs-toggle="modal" data-bs-target="#getLinkModal">
                    Get Link</button>
                  <button type="button" class="dropdown-item links-item revoke-link"
                    data-bs-toggle="modal" data-bs-target="#revokeLinkModal" ${disabledAttr}>
                    Revoke Link</button>
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
  $("#no-data").append(`<h3>Invalid Path</h3>`);
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

