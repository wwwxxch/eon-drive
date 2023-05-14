import { revokeLink, checkShareStatus, createLink } from "../../../api/share.js";
import { notiCard, isValidEmail, copyToClipboard } from "../../../utils/utils.js";

// back to initial state
function backToInitState() {
	$("#recipient").val("");
	$(".email-chips-container").empty();

	$("input[id='access-anyone']").prop("checked", true);
	$("input[id='access-user']").prop("checked", false);

	$("label[for='access-user']").text("Eon Drive Users");

	$("#recipient").prop("disabled", true);
	$("#add-email-btn").prop("disabled", true);
}

// get link - To public or To private
$("input[name='access']").change(function () {
	if ($(this).attr("id") === "access-user") {
		$("#recipient").prop("disabled", false);
		$("#add-email-btn").prop("disabled", false);
	} else {
		$("#recipient").prop("disabled", true);
		$("#add-email-btn").prop("disabled", true);
		$("#recipient").val("");
		$(".email-list").empty();
		$(".email-chips-container").empty();
	}
});

// get link
$("#list-table").on("click", ".get-link", async function () {
	const revokeLinkBtn = $(this).closest("div").find(".revoke-link");

	const targetId = $(this).closest("tr").find(".files-name").data("id");
	console.log("targetId: ", targetId);

	const targetName = $(this)
		.closest("tr")
		.find("input[name='list-checkbox']")
		.val()
		.replace(/\//g, "");

	$("#getLinkModalLabel").html(`Share <b>${targetName}</b> with`);

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
		$("label[for='access-user']").text("Eon Drive Users");
	} else if (shareStatus.is_public === 1) {
		$("#current-access-list").append(`
      <div>Anyone knows the link</div>
      <div>
        <a href="${shareStatus.share_link}">
          ${window.location.origin}${shareStatus.share_link}      
        </a>
      </div>
    `);
		$("label[for='access-user']").text("Eon Drive Users");
	} else if (shareStatus.acl.length > 0) {
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
		$("label[for='access-user']").text("More Eon Drive Users");
	}

	// input user email
	const selectedEmailsSet = new Set();
	// click add mail button
	$("#add-email-btn")
		.off("click")
		.on("click", function (e) {
			e.preventDefault();
			const emailInput = $("#recipient");
			const email = emailInput.val().trim();
			if (isValidEmail(email) && !selectedEmailsSet.has(email)) {
				selectedEmailsSet.add(email);
				const $emailChip = $(`
          <div class="email-chip">
            <span class="email-text">${email}</span>
            <button class="email-remove">&times;</button>
          </div>
        `);
				$(".email-chips-container").append($emailChip);
				emailInput.val("");
				emailInput.blur();
				$(this).blur();
			} else if (selectedEmailsSet.has(email)) {
				const emailDuplicated = notiCard("Email is duplicated", 160, "topCenter");
				emailDuplicated.show();
				emailInput.val("");
				emailInput.blur();
				$(this).blur();
			} else {
				const emailInvalid = notiCard("Email is invalid", 130, "topCenter");
				emailInvalid.show();
				emailInput.val("");
				emailInput.blur();
				$(this).blur();
			}
		});

	// receipient input box enter
	$("#recipient")
		.off("keydown")
		.on("keydown", async function (e) {
			if (e.keyCode === 13) {
				e.preventDefault();
				const email = $(this).val().trim();
				if (isValidEmail(email) && !selectedEmailsSet.has(email)) {
					selectedEmailsSet.add(email);
					const $emailChip = $(`
          <div class="email-chip">
            <span class="email-text">${email}</span>
            <button class="email-remove">&times;</button>
          </div>
        `);
					$(".email-chips-container").append($emailChip);
					$(this).val("");
					$(this).blur();
				} else if (selectedEmailsSet.has(email)) {
					const emailDuplicated = notiCard("Email is duplicated", 160, "topCenter");
					emailDuplicated.show();
					$(this).val("");
					$(this).blur();
				} else {
					const emailInvalid = notiCard("Email is invalid", 130, "topCenter");
					emailInvalid.show();
					$(this).val("");
					$(this).blur();
				}
			}
		});

	// remove email chip by clicking x
	$(".email-chips-container")
		.off("click")
		.on("click", ".email-remove", function () {
			const email = $(this).siblings(".email-text").text();
			selectedEmailsSet.delete(email);
			$(this).parent().remove();
		});

	// back to init state
	$("#create-link-cancel-btn")
		.off("click")
		.on("click", function () {
			backToInitState();
		});

	// create link
	$("#create-link-btn")
		.off("click")
		.on("click", async function () {
			const access = $("input[name='access']:checked").val();
			console.log("access: ", access);
			const selectedEmails = [...selectedEmailsSet];
			console.log(selectedEmails);
			if (selectedEmails.length === 0 && access === "user") {
				const noEmail = notiCard("Please input email", 170, "topCenter");
				noEmail.show();
				return;
			}
			const getLinkRes = await createLink(targetId, access, selectedEmails);
			console.log("getLinkRes: ", getLinkRes);

			let share_link;
			if (getLinkRes.status === 200) {
				share_link = getLinkRes.share_link;
			} else if (getLinkRes.status >= 400 && getLinkRes.status < 500) {
				setTimeout(() => $("#getLinkModal").modal("hide"), 100);
				backToInitState();

				let errorHTML;
				if (typeof getLinkRes.data.error === "string") {
					errorHTML = `<span>${getLinkRes.data.error}</span>`;
				} else {
					errorHTML = getLinkRes.data.error.map((err) => `<span>${err}</span>`).join("");
				}
				$("#errorModal").modal("show");
				$("#error-msg").html(errorHTML);
				return;
			} else if (getLinkRes.status === 500) {
				setTimeout(() => $("#getLinkModal").modal("hide"), 100);
				backToInitState();

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
			backToInitState();
		});
});

// =============================================================================
// revoke link
$("#list-table").on("click", ".revoke-link", async function () {
	const revokeLinkBtn = $(this);
	const filesId = $(this).closest("tr").find(".files-name").data("id");
	console.log(filesId);
	const filesName = $(this).closest("tr").find(".files-name").text();
	console.log(filesName);

	$("#revoke-confirm-q").html(
		`Are you sure you want to revoke the link for <b>${filesName}</b>?`
	);

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
