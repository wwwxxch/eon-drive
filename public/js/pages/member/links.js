import { revokeLink, askYouSharedList } from "../../api/share.js";
import { socket } from "../../utils/socket.js";
// ===================================================
const unlinkSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" height="20" fill="currentColor" class="bi" shape-rendering="geometricPrecision" text-rendering="geometricPrecision"
  image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 509.84">
  <path fill-rule="nonzero"
    d="M245.14 352.14c8.49-8.49 22.27-8.49 30.76 0 8.5 8.5 8.5 22.27 0 30.76l-58.53 58.54c-20.35 20.34-47.15 30.51-73.94 30.51s-53.6-10.17-73.94-30.51c-20.34-20.35-30.52-47.15-30.52-73.94 0-26.78 10.18-53.6 30.52-73.94l58.53-58.53c8.5-8.5 22.27-8.5 30.77 0 8.49 8.49 8.49 22.27 0 30.76l-58.54 58.53c-11.84 11.85-17.77 27.51-17.77 43.18 0 15.67 5.93 31.33 17.77 43.17 11.85 11.85 27.51 17.78 43.18 17.78 15.67 0 31.33-5.93 43.17-17.77l58.54-58.54zm46.1-92.68c8.47 8.48 8.47 22.24 0 30.71-8.48 8.47-22.23 8.47-30.71 0l-39.78-39.78c-8.47-8.48-8.47-22.23 0-30.71 8.48-8.47 22.23-8.47 30.71 0l39.78 39.78zm45.28 245.07-25.07 5.19c-3.24.66-6.43-1.44-7.09-4.68l-16.18-78.09a6.006 6.006 0 0 1 4.66-7.11l25.05-5.29c3.27-.65 6.45 1.44 7.11 4.69l16.21 78.2c.66 3.25-1.44 6.43-4.69 7.09zM178.82 6.26 203.39.18c3.22-.8 6.48 1.17 7.28 4.38l19.46 77.29c.8 3.23-1.16 6.5-4.39 7.31l-24.8 6.28c-3.23.8-6.5-1.16-7.31-4.38l-19.46-77.43c-.81-3.23 1.16-6.5 4.38-7.31l.27-.06zm264.17 419.63-17.86 18.43a6.03 6.03 0 0 1-8.52 0l-57.22-55.51a6.015 6.015 0 0 1-.11-8.5l17.8-18.39c2.32-2.38 6.13-2.44 8.51-.12l57.28 55.58a6.027 6.027 0 0 1 .12 8.51zm68.81-112.11-6.62 24.69c-.85 3.21-4.15 5.12-7.37 4.26l-77.08-20.62c-3.22-.86-5.12-4.16-4.27-7.38l6.64-24.72c.86-3.21 4.16-5.12 7.38-4.27l77.05 20.67c3.21.85 5.12 4.16 4.27 7.37zM.38 201.65l6.97-24.15a6.025 6.025 0 0 1 7.42-4.11l76.66 21.79c3.2.91 5.05 4.25 4.15 7.45l-6.96 24.61a6.034 6.034 0 0 1-7.42 4.17L4.38 209.55a6.035 6.035 0 0 1-4.15-7.45l.15-.45zM65.14 87.17l17.84-17.81c2.35-2.34 6.17-2.33 8.51.02l56.38 56.41c2.33 2.35 2.33 6.15 0 8.49l-18.06 18.11a6.014 6.014 0 0 1-8.5.02L64.85 95.97a6.03 6.03 0 0 1 0-8.52l.29-.28zm200.98 71.28c-8.49 8.5-22.27 8.5-30.76 0-8.5-8.49-8.5-22.26 0-30.76l59.26-59.26 1.38-1.27c20.23-19.51 46.43-29.26 72.56-29.26 26.78 0 53.58 10.18 73.93 30.53 20.35 20.35 30.53 47.16 30.53 73.94 0 26.79-10.18 53.59-30.52 73.94l-59.26 59.26c-8.5 8.49-22.27 8.49-30.77 0-8.49-8.49-8.49-22.27 0-30.76l59.27-59.27c11.84-11.84 17.77-27.5 17.77-43.17 0-15.67-5.93-31.33-17.77-43.17-11.86-11.86-27.52-17.79-43.18-17.79-15.3 0-30.55 5.59-42.22 16.76l-60.22 60.28z" />
  </svg>
`;

function showYouSharedList(obj) {
	console.log("showYouSharedList: ", obj);
	// if (obj.data.length === 0) {

	// }
	obj.data.forEach((item) => {
		const revokeDiv = `
      <button class="revoke-btn btn" data-bs-toggle="modal" 
        data-bs-target="#revokeLinkModal">
        ${unlinkSVG}
      </button>
    `;
		const cellFiles = `
      <td style="width: 25%">
        <div class="files">
          ${item.files_name}
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

			// cellAccess = $("<td>").append(
			// 	$("<div>")
			// 		.addClass("access d-flex justify-content-between align-items-start")
			// 		.append($("<div>").append($(userDiv)))
			// 		.append($(revokeDiv))
			// );
			cellAccess = `
        <td>
          <div class="access d-flex justify-content-between align-items-center">
            <div>
              ${userDiv}
            </div>
            <div class="revoke">
              ${revokeDiv}
            </div>
          </div>
        </td>
      `;
		}
		const tr = $("<tr>").addClass("you-shared-row");
		tr.attr("data-id", item.files_id);
		tr.append(cellFiles, cellLink, cellAccess);

		$("#links-you-shared-tbody").append(tr);
	});
}

const list = await askYouSharedList();
console.log(list);
showYouSharedList(list);

// revoke link
$(".you-shared-row").on("click", ".revoke-btn", async function () {
	const filesId = $(this).closest("tr").data("id");
	console.log(filesId);
	const files_name = $(this).closest("tr").find(".files").text();
	console.log(files_name);
	$("#revoke-confirm-q").html(`Are you sure you want to revoke the link for <b>${files_name}</b>?`);

	$("#revoke-link-btn")
		.off("click")
		.on("click", async function () {
			setTimeout(() => $("#revokeLinkModal").modal("hide"), 100);
			const askRevokeLink = await revokeLink(filesId);
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
					errorHTML = askRevokeLink.data.error.map((err) => `<span>${err}</span>`).join("");
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
// const socket = io();
socket.on("linksYouSharedUpdate", (data) => {
	console.log("socket.on linksYouSharedUpdate: ", data);
	$("#links-you-shared-tbody").empty();
	showYouSharedList(data);
});
