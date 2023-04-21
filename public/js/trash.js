import { getTrash } from "./api/list.js";
import { restoreDelete } from "./api/restore.js";
import { formatTime } from "./util/util.js";
import { permDeleteFile } from "./api/delete.js";
// ==========================================================================
const trashListRes = await getTrash();
// console.log(trashListRes);
$("#trash-table").DataTable({
	data: trashListRes,
	columns: [
		{
			data: "name",
			render: function (data, type, row, meta) {
				const tickboxValue =
					row.type === "file"
						? `${row.parentPath.replace(/^Home\//, "")}${row.name}`
						: `${row.parentPath.replace(/^Home\//, "")}${row.name}/`;
				const tickbox = `<input type="checkbox" name="trash-checkbox" value=${tickboxValue}>`;
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
				return formatTime(data);
			},
		},
	],
	searching: false,
	lengthChange: false,
});

$("input[name='trash-checkbox']").on("change", function () {
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

// TODO: socket.io refresh

// ==========================================================================
// restore
$("#restore-delete-btn").click(async function () {
	const selected = $("input[name='trash-checkbox']:checked");
	const toRestore = selected.toArray().map((item) => item.value);
	console.log("toRestore: ", toRestore);
	const askRestoreDelete = await restoreDelete(toRestore);
	console.log("askRestoreDelete: ", askRestoreDelete);

	selected.prop("checked", false);
});
// perm delete
$("#perm-delete-btn").click(async function () {
	const selected = $("input[name='trash-checkbox']:checked");
	const toPermDelete = selected.toArray().map((item) => item.value);
	console.log("toPermDelete: ", toPermDelete);
	const askPermDelete = await permDeleteFile(toPermDelete);
	console.log("askPermDelete: ", askPermDelete);

	selected.prop("checked", false);
});
