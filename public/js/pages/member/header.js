import { askNoti, changeUnreadStatus } from "../../api/notification.js";
import { askProfile } from "../../api/list.js";
import { formatTime } from "../../util/util.js";
// =============================================================================

// logout button
$("#logout-btn").on("click", async function (e) {
	e.preventDefault();
	const logoutReq = await axios.get("/logout");
	window.location.href = "/";
});

// profile button
$("#profile-btn").on("click", async function (e) {
	e.preventDefault();
	// window.location.href = "/profile";
	const profile = await askProfile();
	console.log("profile: ", profile);

	$(".user-name").text(profile.name);
	$(".user-email").text(profile.email);

  const accountCreateDate = formatTime(profile.created_at, "yyyy-MM-dd");
	$(".user-created").text(accountCreateDate);

	const planText = profile.plan === 1 ? "Free" : "";
	$(".user-plan").text(planText);

	const usedNum = parseInt(profile.used);
	const allocatedNum = parseInt(profile.allocated);
	const percent = (usedNum / allocatedNum) * 100;
	const numerator = Math.round((usedNum / (1024 * 1024)) * 100) / 100;
	const denominator = allocatedNum / (1024 * 1024);
	const currentUse = `
    ${numerator} MB / ${denominator} MB (${percent.toFixed(2)}%)
  `;
	$(".user-usage").text(currentUse);
});

// show notification list
function notiList(input) {
	if (input.unreadNum === 0) {
		$(".badge-notification").addClass("d-none");
	} else {
		$(".badge-notification").removeClass("d-none");
	}

	if (input.data.length > 0) {
		// $("#no-noti").hide();
		$("#noti-ul").empty();
		input.data.sort((a, b) => {
			return (
				new Date(b.time_shared).getTime() - new Date(a.time_shared).getTime()
			);
		});

		let feeds = input.data
			.map((item) => {
				// console.log("time_shared: ", item.time_shared);
        const dt = formatTime(item.time_shared);
				const isReadClass = item.is_read === 0 ? "new-noti" : "";
				return `
          <div class="dropdown-item noti-item ${isReadClass}" data-shared-id="${item.share_id}" data-read=${item.is_read} >
            <div class="text-wrap">
              <div class="noti-text">
                <span class="noti-owner">${item.owner}</span>
                <span>shared</span>
                <span class="noti-ff">
                  <a class="share-link" href="/${item.link}" target="_blank">
                    ${item.ff_name}
                  </a>
                </span>
                <span>with you.</span>
              </div>
              <div class="noti-time text-start">${dt}</div>
            </div>
          </div>
        `;
			})
			.join("");

		$("#noti-ul").append(feeds);
	}
}

// notification - sb share link with you
const notis = await askNoti();
console.log("notis: ", notis);
notiList(notis);

$("#noti-ul").on("mouseenter", ".noti-item.new-noti", async function () {
	if ($(this).hasClass("new-noti")) {
		const shareId = $(this).data("shared-id");
		console.log("shareId: ", shareId);
		const res = await changeUnreadStatus(shareId);
		$(".badge-notification").addClass("d-none");
		$(this).attr("data-read", 1);
		$(this).removeClass("new-noti");
	}
});

const socket = io();
socket.on("sharenoti", (data) => {
	console.log("sharenoti: ", data);
	$("#noti-ul").empty();
	notiList(data);
});
