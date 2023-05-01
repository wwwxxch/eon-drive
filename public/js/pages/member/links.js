import { revokeLink, askYouSharedList } from "../../api/share.js";
// ===================================================
function showYouSharedList(obj) {
	console.log("showYouSharedList: ", obj);
	// if (obj.data.length === 0) {

	// }
	obj.data.forEach((item) => {
		const revokeDiv = `
      <button class="revoke-btn btn custom-operation-btn" data-bs-toggle="modal" 
        data-bs-target="#revokeLinkModal">
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
	const ff_name = $(this).closest("tr").find(".ff").text();
	console.log(ff_name);
	$("#revoke-confirm-q").html(
		`Are you sure you want to revoke the link for <b>${ff_name}</b>?`
	);

	$("#revoke-link-btn")
		.off("click")
		.on("click", async function () {
			setTimeout(() => $("#revokeLinkModal").modal("hide"), 100);
			const askRevokeLink = await revokeLink(ff_id);
			console.log("askRevokeLink: ", askRevokeLink);
			$("#revokeAlertModal").modal("show");
			$("#revoke-alert-msg").empty();
			if (askRevokeLink.status === 200) {
				$("#revoke-alert-msg").text("Your link has been revoked.");
			} else if (askRevokeLink.status >= 400 && askRevokeLink.status < 500) {
				let errorHTML;
				if (typeof askRevokeLink.data.error === "string") {
					errorHTML = `<span>${askRevokeLink.data.error}</span>`;
				} else {
					errorHTML = askRevokeLink.data.error
						.map((err) => `<span>${err}</span>`)
						.join("");
				}
				$("#revoke-alert-msg").html(errorHTML);
			} else {
				const errorHTML =
					"<span>Opps! Something went wrong. Please try later or contact us.</span>";
				$("#revoke-alert-msg").html(errorHTML);
			}
			setTimeout(() => $("#revokeAlertModal").modal("hide"), 3000);
		});
});

// ==========================================================================
// socket.io
const socket = io();
socket.on("linksYouSharedUpd", (data) => {
	console.log("socket.on linksYouSharedUpd: ", data);
	$("#links-you-shared-tbody").empty();
	showYouSharedList(data);
});
