import { getTrash } from "../../api/list.js";
import { restoreDelete } from "../../api/restore.js";
import { formatTime } from "../../util/util.js";
import { permDeleteFile } from "../../api/delete.js";
// ==========================================================================
// get User's timezone
const userTimezoneOffset = new Date().getTimezoneOffset();
const timeZone = luxon.DateTime.local().minus({ minutes: userTimezoneOffset }).zoneName;
console.log("timeZone: ", timeZone);

// show trash list
let table;
function showTrashList(input) {
	table = $("#trash-table").DataTable({
		data: input,
		columns: [
			{
				data: "name",
				render: function (data, type, row, meta) {
					const tickboxValue =
						row.type === "file"
							? `${row.parentPath.replace(/^Home\//, "")}${row.name}`
							: `${row.parentPath.replace(/^Home\//, "")}${row.name}/`;
					const tickbox = `<input type="checkbox" name="trash-checkbox" value="${tickboxValue}">`;
					return tickbox;
				},
			},
			{
				data: "name",
				render: function (data, type, row, meta) {
					const content = `
              <div>
                <div class="delete-name">${row.name}</div>
                <div class="delete-parent-path">${row.parentPath}</div>
              </div>
            `;
					return content;
				},
			},
			{
				data: "deleted_at",
				render: function (data) {
          const time = luxon.DateTime.fromISO(data).setZone(timeZone).toFormat("yyyy-MM-dd HH:mm:ss");
					return time;
				},
			},
		],
		searching: false,
		lengthChange: false,
	});
	// $("input[name='trash-checkbox']").on("change", function () {
	// 	const selected = $("input[name='trash-checkbox']:checked");
	// 	if (selected.length > 0) {
	// 		$("#restore-delete-btn").show();
	// 		$("#perm-delete-btn").show();
	// 	} else {
	// 		$("#restore-delete-btn").hide();
	// 		$("#perm-delete-btn").hide();
	// 	}
	// });
}

const trashListRes = await getTrash();
console.log("trashListRes: ", trashListRes);
showTrashList(trashListRes);

$("#trash-table").on("change", "input[name='trash-checkbox']", function () {
  const selected = $("input[name='trash-checkbox']:checked");
  if (selected.length > 0) {
    $("#restore-delete-btn").show();
    $("#perm-delete-btn").show();
  } else {
    $("#restore-delete-btn").hide();
    $("#perm-delete-btn").hide();
  }
});

// ==========================================================================
// socket.io
const socket = io();
socket.on("trashupd", (data) => {
	console.log("socket.on trashupd: ", data);
	table.destroy();
	showTrashList(data.list);
});

// ==========================================================================
// click other place on the page -> cancel checked
$(document).click(function (e) {
	if (!$(e.target).is("input[name='trash-checkbox'], #select-all")) {
		$("input[name='trash-checkbox']").prop("checked", false);
		$("#select-all").prop("checked", false);
		$("#restore-delete-btn").hide();
		$("#perm-delete-btn").hide();
	}
});

// ==========================================================================
// select all & deselect all
$("#select-all").on("change", function () {
	if (this.checked) {
		$("input[name='trash-checkbox']").prop("checked", true);
		$("#restore-delete-btn").show();
		$("#perm-delete-btn").show();
	} else {
		$("input[name='trash-checkbox']").prop("checked", false);
		$("#restore-delete-btn").hide();
		$("#perm-delete-btn").hide();
	}
});

// ==========================================================================
// restore
$("#restore-delete-btn").click(async function () {
  // TODO: confirm dialog for restore
	const selected = $("input[name='trash-checkbox']:checked");
	const toRestore = selected.toArray().map((item) => item.value);
	console.log("toRestore: ", toRestore);
	const askRestoreDelete = await restoreDelete(toRestore);
	console.log("askRestoreDelete: ", askRestoreDelete);

	selected.prop("checked", false);
});

// perm delete
$("#perm-delete-btn").on("click", async function () {
	const selected = $("input[name='trash-checkbox']:checked");
	const toPermDelete = selected.toArray().map((item) => item.value);
	console.log("toPermDelete: ", toPermDelete);
  if (toPermDelete.length > 1) {
    $("#confirm-perm-delete-msg").text("Are you sure you want to permanently delete these items?");
  } else if (toPermDelete.length === 1) {
    $("#confirm-perm-delete-msg").text(`Are you sure you want to permanently delete ${toPermDelete[0]}?`);
  }
  $("#confirm-perm-delete-btn").off("click").on("click", async function () {
    // TODO: maybe a loading page is required - if you permanently delete many items
    const askPermDelete = await permDeleteFile(toPermDelete);
    console.log("askPermDelete: ", askPermDelete);
  
    selected.prop("checked", false);
    $("#confirmPermDeleteModal").modal("hide");
    $("#confirmPermDeleteNotiModal").modal("show");
    setTimeout(() => { $("#confirmPermDeleteNotiModal").modal("hide"); }, 1500);
  });

});
