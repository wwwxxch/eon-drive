import { askUnreadNoti, changeUnreadStatus } from "../../api/notification.js";

// logout button
$("#logout-btn").on("click", async function (e) {
	e.preventDefault();
	const logoutReq = await axios.get("/logout");
	window.location.href = "/";
});

// profile button
$("#profile-btn").on("click", function(e) {
  e.preventDefault();
  window.location.href = "/profile";
});

// notification - sb share link with you
const unread = await askUnreadNoti();
console.log("unread: ", unread);
if (unread.data.length > 0) {
  $("#no-noti").hide();
  $(".badge-notification").removeClass("d-none");
  unread.data.forEach(item => {
    console.log(item);
    const feed = `
      <div class="dropdown-item text-wrap">
        <p>
          <span class="noti-owner">${item.owner}</span>
          <span>shared</span>
          <span class="noti-ff">${item.ff_name}</span>
          <span>with you.</span>
        </p>
      </div>
    `;
    $("#noti-ul").append(feed);
  });
}

$(".noti-btn").on("click", async function() {
  if (!$("#no-noti").is(":visible")) {
    const res = await changeUnreadStatus();
    console.log("res: ",res);
    $(".badge-notification").addClass("d-none");
    $("#noti-ul").empty();
    $("#noti-ul").append(`
      <div class="dropdown-item" id="no-noti">
        No Notification
      </div>`
    );
  }
});
