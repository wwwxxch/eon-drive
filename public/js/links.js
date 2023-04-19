import { revokeLink, askYouSharedList } from "./api/share.js";
// ===================================================
// logout button
$("#logout-btn").on("click", async function (e) {
	e.preventDefault();
	const logoutReq = await axios.get("/logout");
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

function showYouSharedList(obj) {
	// if (obj.data.length === 0) {

	// }
	obj.data.forEach((item) => {
    const revokeDiv = `
      <button class="revoke-btn btn btn-outline-secondary">
        Revoke Link
      </button>
    `;
		const cellFF = `
      <td style="width: 25%">
        <div class="ff">
          ${item.ff_name}
        </div>
      </td>
    `;
		const cellLink = `
      <td style="width: 40%">
        <div class="link">
          <a class="link-atag" href="/${item.link}" target="_blank">
            ${window.location.origin}/${item.link}
          </a>
        </div>
      </td>
    `;
		let cellAccess;
		if (item.access.is_public === 1) {
			cellAccess = `
        <td>
          <div class="access d-flex justify-content-between align-items-center">
            <div class="user-list" >
              <div class="public">Anyone knows the link</div>
            </div>
            <div class="revoke">
              ${revokeDiv}
            </div>
          </div>
        </td>
      `;
		} else if (item.access.is_public === 0) {
			const userList = item.access.user;
			const userDiv = userList
				.map((item) => {
					return `
          <div class="user-list">
            <div class="private user-name">${item.name}</div>
            <div class="private user-email">${item.email}</div>
          </div>
        `;
				})
				.join("");
        
      cellAccess = $("<td>").append(
        $("<div>")
          .addClass("access d-flex justify-content-between align-items-start")
          .append($("<div>").append($(userDiv)))
          .append($(revokeDiv))
      );
		}
		const tr = $("<tr>").addClass("you-shared-row");
    tr.attr("data-id", item.ff_id);
		tr.append(cellFF, cellLink, cellAccess);
    
		$("#links-you-shared-tbody").append(tr);
	});
}

const list = await askYouSharedList();
console.log(list);
showYouSharedList(list);

// revoke link
$(".you-shared-row").on("click", ".revoke-btn", async function () {
  const ff_id = $(this).closest("tr").data("id");
  console.log(ff_id);

  const askRevokeLink = await revokeLink(ff_id);
  console.log("askRevokeLink: ", askRevokeLink);
});
