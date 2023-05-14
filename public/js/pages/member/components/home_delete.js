import { deleteFile } from "../../../api/delete.js";

// delete
$("#delete-btn").on("click", async function () {
  const currentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
  const selected = $("input[name='list-checkbox']:checked");
  const toDelete = selected.toArray().map(item => item.value);
  console.log("toDelete: ", toDelete);
  let targetName;
  
  if (toDelete.length > 1) {
    $("#confirm-delete-msg").html(`Are you sure you want to delete <b> ${toDelete.length} items</b>?`);
  } else if (toDelete.length === 1) {
    const arr = toDelete[0].split("/");
    
    if (toDelete[0].endsWith("/")) {
      targetName = arr[arr.length-2];
    } else {
      targetName = arr.pop();
    }
    $("#confirm-delete-msg").html(`Are you sure you want to delete <b>${targetName}</b>?`);
  }

  $("#confirm-delete-btn").off("click").on("click", async function () {
    $("#confirmDeleteModal").modal("hide");
    selected.prop("checked", false);
    $("#delete-btn-div").hide();
    $("#download-btn-div").hide();

    let text;
    if (toDelete.length > 1) {
      text = `Delete <b>${toDelete.length} items</b>`;
    } else if (toDelete.length === 1) {
      text = `Delete <b>${targetName}</b>`;
    }

    const widthPerChar = 7;
    const minWidth = 250;
    const additionalWidth = Math.max(text.length - 30, 0) * widthPerChar;
    const width = Math.max(minWidth + additionalWidth, minWidth);

    const deleteNoti = new Noty({
      text: text,
      layout: "bottomLeft",
      closeWith: ["click"],
      timeout: 5000,
      theme: "custom-theme",
      progressBar: false,
      callbacks: {
        onTemplate: function () {
          this.barDom.style.width = `${width}px`;
        },
      },
    });

    deleteNoti.show();
    
    const deleteFileRes = await deleteFile(currentPath, toDelete);

    if (deleteFileRes.status === 200) {
      setTimeout(() => deleteNoti.close(), 2000);
    } else if (deleteFileRes.status >= 400 && deleteFileRes.status < 500) {
      deleteNoti.close();
      let errorHTML;
      if (typeof deleteFileRes.data.error === "string") {
        errorHTML = `<span>${deleteFileRes.data.error}</span>`;
      } else {
        errorHTML = deleteFileRes.data.error
          .map((err) => `<span>${err}</span>`)
          .join("");
      }
      $("#errorModal").modal("show");
      $("#error-msg").html(errorHTML);
    } else {
      deleteNoti.close();
      const errorHTML =
        "<span>Opps! Something went wrong. Please try later or contact us.</span>";
      $("#errorModal").modal("show");
      $("#error-msg").html(errorHTML);
    }
  });	
});