import { getTrash } from "../../api/list.js";
import { restoreDelete } from "../../api/restore.js";
import { formatTime } from "../../util/util.js";
import { permDeleteFile } from "../../api/delete.js";
import { socket } from "../../util/socket.js";
// ==========================================================================
// show trash list
let table;
function showTrashList(input) {
	table = $("#trash-table").DataTable({
		data: input,
		columns: [
			{
				data: "name",
				// render: function - parameters: data, type, row, meta
				render: function (data, type, row, meta) {
					const tickboxValue = `${row.parentPath.replace(/^Home\//, "")}${row.name}${
						row.type === "file" ? "" : "/"
					}`;
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
					const time = formatTime(data);
					return time;
				},
			},
		],
		searching: false,
		lengthChange: false,
	});
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
socket.on("trashUpdate", (data) => {
	console.log("socket.on trashUpdate: ", data);
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
	const selected = $("input[name='trash-checkbox']:checked");
	const toRestore = selected.toArray().map((item) => item.value);
	// console.log("toRestore: ", toRestore);
	let targetName;
	if (toRestore.length > 1) {
		$("#confirm-restore-msg").html(
			`Are you sure you want to restore <b>these ${toRestore.length} items</b>?`
		);
	} else if (toRestore.length === 1) {
		const arr = toRestore[0].split("/");

		if (toRestore[0].endsWith("/")) {
			targetName = arr[arr.length - 2];
		} else {
			targetName = arr.pop();
		}
		$("#confirm-restore-msg").html(`Are you sure you want to restore <b>${targetName}</b>?`);
	}

	$("#confirm-restore-btn")
		.off("click")
		.on("click", async function () {
			$("#confirmRestoreModal").modal("hide");
			selected.prop("checked", false);

			let text;
			if (toRestore.length > 1) {
				text = `Restored <b>${toRestore.length} items</b>`;
			} else if (toRestore.length === 1) {
				text = `Restored <b>${targetName}</b>`;
			}
			// console.log("text.length: ", text.length);
			const widthPerChar = 7;
			const minWidth = 200;
			const additionalWidth = Math.max(text.length - 30, 0) * widthPerChar;
			const width = Math.max(minWidth + additionalWidth, minWidth);
			// console.log(width);

			const restoreNoti = new Noty({
				text: text,
				layout: "bottomLeft",
				closeWith: ["click"],
				// timeout: 5000,
				theme: "custom-theme",
				progressBar: false,
				callbacks: {
					onTemplate: function () {
						this.barDom.style.width = `${width}px`;
					},
				},
			});
			restoreNoti.show();

			const askRestoreDelete = await restoreDelete(toRestore);

			if (askRestoreDelete.status === 200) {
				setTimeout(() => restoreNoti.close(), 2000);
			} else if (askRestoreDelete.status >= 400 && askRestoreDelete.status < 500) {
				restoreNoti.close();
				let errorHTML;
				if (typeof askRestoreDelete.data.error === "string") {
					errorHTML = `<span>${askRestoreDelete.data.error}</span>`;
				} else {
					errorHTML = askRestoreDelete.data.error.map((err) => `<span>${err}</span>`).join("");
				}
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
			} else {
				restoreNoti.close();
				const errorHTML =
					"<span>Opps! Something went wrong. Please try later or contact us.</span>";
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
			}

		});
});

// ==========================================================================
// perm delete
$("#perm-delete-btn").on("click", function () {
	const selected = $("input[name='trash-checkbox']:checked");
	const toPermDelete = selected.toArray().map((item) => item.value);
	console.log("toPermDelete: ", toPermDelete);
	let targetName;
	if (toPermDelete.length > 1) {
		$("#confirm-perm-delete-msg").html(
			`Are you sure you want to permanently delete <b>these ${toPermDelete.length} items</b>?`
		);
	} else if (toPermDelete.length === 1) {
		const arr = toPermDelete[0].split("/");

		if (toPermDelete[0].endsWith("/")) {
			targetName = arr[arr.length - 2];
		} else {
			targetName = arr.pop();
		}
		$("#confirm-perm-delete-msg").html(
			`Are you sure you want to permanently delete <b>${targetName}</b>?`
		);
	}

	$("#confirm-perm-delete-btn")
		.off("click")
		.on("click", async function () {
			selected.prop("checked", false);
			$("#confirmPermDeleteModal").modal("hide");

			let text;
			if (toPermDelete.length > 1) {
				text = `Permanently delete <b>${toPermDelete.length} items</b>`;
			} else if (toPermDelete.length === 1) {
				text = `Permanently delete <b>${targetName}</b>`;
			}

			const widthPerChar = 7;
			const minWidth = 250;
			const additionalWidth = Math.max(text.length - 30, 0) * widthPerChar;
			const width = Math.max(minWidth + additionalWidth, minWidth);

			const permDeleteNoti = new Noty({
				text: text,
				layout: "bottomLeft",
				closeWith: ["click"],
				// timeout: 5000,
				theme: "custom-theme",
				progressBar: false,
				callbacks: {
					onTemplate: function () {
						this.barDom.style.width = `${width}px`;
					},
				},
			});
			permDeleteNoti.show();

			const askPermDelete = await permDeleteFile(toPermDelete);

			if (askPermDelete.status === 200) {
				setTimeout(() => permDeleteNoti.close(), 2000);
			} else if (askPermDelete.status >= 400 && askPermDelete.status < 500) {
				permDeleteNoti.close();
				let errorHTML;
				if (typeof askPermDelete.data.error === "string") {
					errorHTML = `<span>${askPermDelete.data.error}</span>`;
				} else {
					errorHTML = askPermDelete.data.error.map((err) => `<span>${err}</span>`).join("");
				}
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
			} else {
				permDeleteNoti.close();
				const errorHTML =
					"<span>Opps! Something went wrong. Please try later or contact us.</span>";
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
			}

		});
});
