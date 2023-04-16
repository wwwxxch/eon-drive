import { getTrash } from "./api/list.js";
import { restoreDelete } from "./api/restore.js";
// ==========================================================================
// logout button
$(".logout-button").on("click", async function (e) {
	e.preventDefault();
	const logoutReq = await axios.get("/logout");
	// console.log("logoutReq: ", logoutReq);
	window.location.href = "/";
});

// check login status
const chkLoginStatus = async () => {
	try {
		await axios.get("/login-status");
		return true;
	} catch (err) {
		window.location.href = "/login";
		return false;
	}
};

const isLogin = await chkLoginStatus();
if (isLogin) {
	const trashListRes = await getTrash();
	console.log(trashListRes);
	$("#trash-table").DataTable({
		data: trashListRes,
		columns: [
			{
				data: "name",
				render: function (data, type, row, meta) {
					const tickboxValue =
						row.type === "file"
							? `${row.parentPath.replace(/^Home\//, "")}/${row.name}`
							: `${row.parentPath.replace(/^Home\//, "")}/${row.name}/`;
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
					return new Date(data).toLocaleString();
				},
			},
		],
		searching: false,
		lengthChange: false,
	});
}

// restore
$("#restore-button").click(async function () {
	const selected = $("input[name='trash-checkbox']:checked");
	const toRestore = selected.toArray().map((item) => item.value);

	const askRestoreDelete = await restoreDelete(toRestore);
	console.log("askRestoreDelete: ", askRestoreDelete);

	selected.prop("checked", false);
	$("#restore-button").hide();
});
