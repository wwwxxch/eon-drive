import { askNoti, changeUnreadStatus } from "../../api/notification.js";

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

// get User's timezone
const userTimezoneOffset = new Date().getTimezoneOffset();
const timeZone = luxon.DateTime.local().minus({ minutes: userTimezoneOffset }).zoneName;
console.log("timeZone: ", timeZone);

// show notification list
function notiList(input) {
  if (input.unreadNum === 0 ) {
    $(".badge-notification").addClass("d-none");
  } else {
    $(".badge-notification").removeClass("d-none");
  }

  if (input.data.length > 0) {
    $("#no-noti").hide();
    input.data.sort((a, b) => {
      return new Date(b.time_shared).getTime() - new Date(a.time_shared).getTime();
    });
  
    let feeds = input.data.map(item => {
      console.log("time_shared: ", item.time_shared);
      const dt = luxon.DateTime.fromISO(item.time_shared).setZone(timeZone).toFormat("yyyy-MM-dd HH:mm:ss");
      console.log("dt: ", dt);
      const isReadClass = item.is_read === 0 ? "new-noti" : "";
      return `
        <div class="dropdown-item noti-item ${isReadClass}" data-shared-id="${item.share_id}" data-read=${item.is_read} >
          <div class="text-wrap">
            <div class="noti-text">
              <span class="noti-owner">${item.owner}</span>
              <span>shared</span>
              <span class="noti-ff">${item.ff_name}</span>
              <span>with you.</span>
            </div>
            <div class="noti-time text-start">${dt}</div>
          </div>
        </div>
      `;
    }).join("");
  
    $("#noti-ul").append(feeds);
    $(".noti-btn").on("click", async function() {
      if ($(".noti-item").hasClass("new-noti")) {
        const res = await changeUnreadStatus();
        $(".badge-notification").removeClass("d-none");
      } else {
        $(".badge-notification").addClass("d-none");
      }
    });
  }
}

// notification - sb share link with you
const notis = await askNoti();
console.log("notis: ", notis);
notiList(notis);

$("#noti-ul").on("mouseenter", ".noti-item.new-noti", function() {
  $(this).removeClass("new-noti");
});

const socket = io();
socket.on("sharenoti", (data) => {
	console.log("sharenoti: ", data);
  notiList(data);
});