import { getTrash } from "./api/list.js";
import { restoreDelete } from "./api/restore.js";
// ==========================================================================
// logout button
$(".logout-button").on("click", async function(e) {
  e.preventDefault();
  const logoutReq = await axios.get("/logout");
  // console.log("logoutReq: ", logoutReq);
  window.location.href="/";
});

// check login status
const chkLoginStatus = async() => {
  try {
    await axios.get("/login-status");
    return true;
  } catch(err) {
    window.location.href="/login";
    return false;
  }
};

const isLogin = await chkLoginStatus();
if (isLogin) {
  
  const deleteList = $("#delete-list");

  const trashListRes = await getTrash();
  // console.log("trashListRes: ", trashListRes);

  for (const item of trashListRes) {
    const chkBoxVal = item.type === "file" ? 
    `${item.parentPath.replace(/^Home\//,"")}/${item.name}` : 
    `${item.parentPath.replace(/^Home\//,"")}/${item.name}/`;

    const tr = $("<tr>");
    const checkBox = $("<input>").attr({
      type: "checkbox",
      name: "trash-checkbox",
      value: chkBoxVal,
    });
    const nameTd = $("<td>").append(checkBox, `
      <div class="delete-name">${item.name}</div>
      <br>
      <div class="delete-parent-path">${item.parentPath}</div>
    `).addClass("table-cell");
    tr.append(nameTd);

		const deletedAtTd = $("<td>").append(`
      <div class="delete-time">${new Date(item.deleted_at).toLocaleString()}</div>
    `).addClass("table-cell");

		tr.append(deletedAtTd);
		deleteList.append(tr);

    checkBox.change(function () {
			const selected = $("input[name='trash-checkbox']:checked");
			// const selectedVal = selected.toArray().map(item => item.value);
      // console.log(selectedVal);
      if (selected.length > 0) {
				$("#restore-button").show();
			} else {
				$("#restore-button").hide();
			}
		});
  }
}

// restore
$("#restore-button").click(async function () {

	const selected = $("input[name='trash-checkbox']:checked");
  const toRestore = selected.toArray().map(item => item.value);

  const askRestoreDelete = await restoreDelete(toRestore);
  console.log("askRestoreDelete: ", askRestoreDelete);

  
	selected.prop("checked", false);
	$("#restore-button").hide();
});


