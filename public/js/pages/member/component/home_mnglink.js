import {
	revokeLink,
	checkShareStatus,
	createLink,
	showCandidatesByInput,
} from "../../../api/share.js";

import { copyToClipboard } from "../../../util/util.js";

// get link - To public or To private
$("input[name='access']").change(function () {
	if ($(this).attr("id") == "access-user") {
		$("#recipient").prop("disabled", false);
	} else {
		$("#recipient").prop("disabled", true);
		$("#recipient").val("");
		$(".email-list").empty();
		$(".email-chips-container").empty();
	}
});

// get link
$("#list-table").on("click", ".get-link", async function () {
	const revokeLinkBtn = $(this).closest("div").find(".revoke-link");

	const targetId = $(this).closest("tr").find(".ff_name").data("id");
	console.log("targetId: ", targetId);

	const targetName = $(this)
		.closest("tr")
		.find("input[name='list-checkbox']")
		.val()
		.replace(/\//g, "");

	$("#getLinkModalLabel").html(`Share &nbsp${targetName}&nbsp with`);

	const checkRes = await checkShareStatus(targetId);

	let shareStatus;
	if (checkRes.status !== 200) {
		const errorHTML = `<span>${checkRes.data.error}</span>`;
		$("#errorModal").modal("show");
		$("#error-msg").html(errorHTML);
		return;
	} else if (checkRes.status === 200) {
		shareStatus = checkRes.data;
	}

	// show current access list
	console.log(shareStatus);
	$("#current-access-list").empty();
	if (!shareStatus.share_link) {
		$("#current-access-list").append(`
      <div>Only you</div>
    `);
	} else if (shareStatus.is_public === 1) {
		$("#current-access-list").append(`
      <div>Anyone knows the link</div>
      <div>
        <a href="${shareStatus.share_link}">
          ${window.location.origin}${shareStatus.share_link}      
        </a>
      </div>
    `);
	} else if (shareStatus.acl.length > 0) {
		$("label[for='access-user']").text("More Users");
		const userDiv = shareStatus.acl
			.map((item) => {
				return `
          <div class="d-flex align-items-center">
            <div>${item.name}&ensp;&ensp;</div>
            <div style="font-size: smaller; color: rgb(86, 86, 86);">
              ${item.email}
            </div>
          </div>
        `;
			})
			.join("");
		$("#current-access-list").append(`
        <div>${userDiv}</div>
        <div>
          <a href="${shareStatus.share_link}">
            ${window.location.origin}${shareStatus.share_link}      
          </a>
        </div>
      `);
	}

	// input user email
	$("#recipient").on("input", async function () {
		const text = $(this).val().trim();
		if (!text) {
			$(".email-list").hide();
			return;
		}
		const askPossibleEmails = await showCandidatesByInput(text);
		if (askPossibleEmails.status !== 200) {
			$(".email-list").hide();
			return;
		}
		const emails = askPossibleEmails.data.list;
		if (emails.length === 0) {
			$(".email-list").hide();
			return;
		}
		$(".email-list").empty();
		const displayedEmails = $(".email-chip .email-text")
			.map(function () {
				return $(this).text().trim();
			})
			.get();
		const filteredEmails = emails.filter(function (email) {
			return !displayedEmails.includes(email);
		});

		filteredEmails.forEach((email) => {
			const $emailItem = $("<div class='email-item'></div>");
			$emailItem.text(email);
			$emailItem.appendTo($(".email-list"));
		});
		$(".email-list").show();
	});

	// Hide email list when user clicks outside of it
	$(document).on("click", function (e) {
		if (
			!$(".email-list").is(e.target) &&
			!$("#recipient").is(e.target) &&
			$(".email-list").has(e.target).length === 0
		) {
			$("#recipient").val("");
			$(".email-list").hide();
		}
	});

	const selectedEmailsSet = new Set();

	$(".email-list")
		.off("click")
		.on("click", ".email-item", function () {
			const email = $(this).text();
			selectedEmailsSet.add(email);
			const $emailChip = $(`
        <div class="email-chip">
          <span class="email-text"></span>
          <button class="email-remove">&times;</button>
        </div>
      `);
			$emailChip.find(".email-text").text(email);
			$(".email-chips-container").append($emailChip);
			$(this).remove();
			$(".email-list").hide();
			$("#recipient").val("");
		});

	$(".email-chips-container")
		.off("click")
		.on("click", ".email-remove", function () {
			const email = $(this).siblings(".email-text").text();
			selectedEmailsSet.delete(email);

			// const $emailChip = $(this).parent(".email-chip");
			// const email = $emailChip.find(".email-text").text();
			const $emailItem = $("<div class='email-item'></div>");
			$emailItem.text(email);
			$(".email-list").append($emailItem);
			$(this).parent().remove();
		});

	// back to init state
	$("#create-link-cancel-btn")
		.off("click")
		.on("click", function () {
			$("#recipient").val("");
			$(".email-list").empty();
			$(".email-chips-container").empty();
			$("input[id='access-anyone']").prop("checked", true);
			$("input[id='access-user']").prop("checked", false);
			$("label[for='access-user']").text("Users");
			$("#recipient").prop("disabled", true);
		});

	// create link
	$("#create-link-btn")
		.off("click")
		.on("click", async function () {
			const access = $("input[name='access']:checked").val();
			console.log("access: ", access);
			const selectedEmails = [...selectedEmailsSet];
			console.log(selectedEmails);

			const getLinkRes = await createLink(targetId, access, selectedEmails);
			console.log("getLinkRes: ", getLinkRes);

			let share_link;
			if (getLinkRes.status === 200) {
				share_link = getLinkRes.share_link;
			} else if (getLinkRes.status >= 400 && getLinkRes.status < 500) {
				setTimeout(() => $("#getLinkModal").modal("hide"), 100);
				$("#recipient").val("");
				$(".email-list").empty();
				$(".email-chips-container").empty();
				$("input[id='access-anyone']").prop("checked", true);
				$("input[id='access-user']").prop("checked", false);
				$("label[for='access-user']").text("Users");
				$("#recipient").prop("disabled", true);

				let errorHTML;
				if (typeof getLinkRes.data.error === "string") {
					errorHTML = `<span>${getLinkRes.data.error}</span>`;
				} else {
					errorHTML = getLinkRes.data.error
						.map((err) => `<span>${err}</span>`)
						.join("");
				}
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
				return;
			} else if (getLinkRes.status === 500) {
				setTimeout(() => $("#getLinkModal").modal("hide"), 100);
				$("#recipient").val("");
				$(".email-list").empty();
				$(".email-chips-container").empty();
				$("input[id='access-anyone']").prop("checked", true);
				$("input[id='access-user']").prop("checked", false);
				$("label[for='access-user']").text("Users");
				$("#recipient").prop("disabled", true);

				const errorHTML =
					"<span>Opps! Something went wrong. Please try later or contact us.</span>";
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
				return;
			}

			$("#linkModal").on("show.bs.modal", function (e) {
				const linkInput = $(this).find("#linkInput");
				linkInput.val(share_link);
			});
			$("#linkModal").modal("show");
			$("#linkModal").on("click", ".copy-link-btn", function () {
				copyToClipboard(share_link);
				$("#linkModal").modal("hide");
			});

			revokeLinkBtn.prop("disabled", false);
			$("#getLinkModal").modal("hide");
			$("#recipient").val("");
			$(".email-list").empty();
			$(".email-chips-container").empty();
			$("input[id='access-anyone']").prop("checked", true);
			$("input[id='access-user']").prop("checked", false);
			$("label[for='access-user']").text("Users");
			$("#recipient").prop("disabled", true);
		});
});

// =============================================================================
// revoke link
$("#list-table").on("click", ".revoke-link", async function () {
	const revokeLinkBtn = $(this);
	const ff_id = $(this).closest("tr").find(".ff_name").data("id");
	console.log(ff_id);
	const ff_name = $(this).closest("tr").find(".ff_name").text();
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
				revokeLinkBtn.prop("disabled", true);
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
