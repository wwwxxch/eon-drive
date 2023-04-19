import { askYouSharedList } from "./api/share.js";

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
			// cellAccess = $("<td>").append(
			// 	$("<div>")
			// 		.addClass("access")
			// 		.append($("<div>").append($(userDiv)))
			// );
      cellAccess = $("<td>").append(
        $("<div>")
          .addClass("access d-flex justify-content-between align-items-start")
          .append($("<div>").append($(userDiv)))
          .append($(revokeDiv))
      );
      
		}
		const tr = $("<tr>").addClass("you-shared-row");
		tr.append(cellFF, cellLink, cellAccess);
		$("#links-you-shared-tbody").append(tr);
	});
}

const list = await askYouSharedList();
console.log(list);
showYouSharedList(list);
