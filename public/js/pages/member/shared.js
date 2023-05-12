import { askSharedWithList } from "../../api/share.js";
// ===================================================
function showSharedWithList(obj) {
	// if (obj.data.length === 0) {

	// }
	obj.data.forEach((item) => {
		const cellFiles = `
      <td>
        <div class="files">
          ${item.files_name}
        </div>
      </td>
    `;
		const cellOwner = `
      <td>
        <div class="owner">
          ${item.owner}
        </div>
      </td>
    `;
		const cellLink = `
      <td>
        <div class="link">
          <a class="link-atag" href="/${item.link}" target="_blank">
            ${window.location.origin}/${item.link}
          </a>
        </div>
      </td>
    `;
		const tr = $("<tr>").addClass("shared-with-row");
		tr.append(cellFiles, cellOwner, cellLink);
		$("#shared-with-list-tbody").append(tr);
	});
}

const list = await askSharedWithList();
console.log(list);
showSharedWithList(list);
