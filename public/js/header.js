import { askSharedWithList } from "./api/share.js";

// logout button
$("#logout-btn").on("click", async function (e) {
	e.preventDefault();
	const logoutReq = await axios.get("/logout");
	window.location.href = "/";
});

const sharedWith = await askSharedWithList();
console.log("sharedWith: ", sharedWith);
if (sharedWith.data.length > 0) {
  $("#no-noti").hide();
  sharedWith.data.forEach(item => {
    console.log(item);
    const feed = `

        <div class="dropdown-item">
          ${item.owner} shared ${item.ff_name} with you.
        </div>

    `;
    $("#noti-ul").append(feed);
  });
}
