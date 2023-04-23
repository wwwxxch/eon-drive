import { askSharedWithList } from "../../api/share.js";
// ===================================================
function showSharedWithList(obj) {
  // if (obj.data.length === 0) {

  // }
  obj.data.forEach(item => {
    const cellFF = `
      <td>
        <div class="ff">
          ${item.ff_name}
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
    tr.append(cellFF, cellOwner, cellLink);
    $("#shared-with-list-tbody").append(tr);
  });

}

const list = await askSharedWithList();
console.log(list);
showSharedWithList(list);

