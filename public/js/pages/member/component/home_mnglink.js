import { revokeLink,
  checkShareStatus,
  createLink
} from "../../../api/share.js";

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
	const targetId = $(this).closest("tr").find(".ff_name").data("id");
	console.log("targetId: ", targetId);
	const shareStatus = await checkShareStatus(targetId);
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

	const targetName = $(this)
		.closest("tr")
		.find("input[name='list-checkbox']")
		.val();
	const parentPath = $(".path-text")
		.map(function () {
			return $(this).text().trim();
		})
		.get()
		.join("/");
	console.log(parentPath);
	console.log(targetName);

	$("#recipient").on("input", function () {
		const text = $(this).val().trim();

		if (text) {
			axios
				.get(`/select-user?q=${text}`)
				.then((res) => {
					const emails = res.data.list;
					if (emails.length > 0) {
						$(".email-list").empty();
						emails.forEach((email) => {
							// TODO: if this email has been displayed in $(".email-chips-container"), then no need to add it into list
							const $emailItem = $("<div class='email-item'></div>");
							$emailItem.text(email);
							$emailItem.appendTo($(".email-list"));
						});
						$(".email-list").show();
					} else {
						$(".email-list").hide();
					}
				})
				.catch((e) => {
					console.error("selectableEmail: ", e);
				});
		} else {
			$(".email-list").hide();
		}
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

	$(".email-list")
		.off("click")
		.on("click", ".email-item", function () {
			const email = $(this).text();
			const $emailChip = $(
				`<div class="email-chip">
        <span class="email-text"></span>
        <button class="email-remove">&times;</button>
      </div>`
			);
			$emailChip.find(".email-text").text(email);
			$(".email-chips-container").append($emailChip);
			$(this).remove();
			$(".email-list").hide();
			$("#recipient").val("");
		});

	$(".email-chips-container")
		.off("click")
		.on("click", ".email-remove", function () {
			const $emailChip = $(this).parent(".email-chip");
			const email = $emailChip.find(".email-text").text();
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
			$("#recipient").prop("disabled", true);
		});

	$("#create-link-btn")
		.off("click")
		.on("click", async function () {
			const access = $("input[name='access']:checked").val();
			const selectedEmails = [];
			$(".email-chip")
				.find(".email-text")
				.each(function () {
					selectedEmails.push($(this).text());
				});

			console.log(selectedEmails);

			const getLink = await createLink(
				parentPath,
				targetName,
				access,
				selectedEmails
			);
			console.log("getLink: ", getLink);
			$("#getLinkModal").modal("hide");
			$("#recipient").val("");
			$(".email-list").empty();
			$(".email-chips-container").empty();
			$("input[id='access-anyone']").prop("checked", true);
			$("input[id='access-user']").prop("checked", false);
			$("#recipient").prop("disabled", true);

			let inputForShareLink;
			if (getLink.share_link) {
				if (!inputForShareLink) {
					inputForShareLink = $("<input>");
					$("body").append(inputForShareLink);
				}
				inputForShareLink.val(getLink.share_link);
				inputForShareLink.select();

				const copyToClipboard = (text) => {
					navigator.clipboard
						.writeText(text)
						.then(() => {
							console.log("Text copied to clipboard");
						})
						.catch((err) => {
							console.error("Error copying text to clipboard:", err);
						});

					// // workaround when clipboard cannot be used
					// const input = document.createElement("textarea");
					// input.value = text;
					// document.body.appendChild(input);
					// input.select();
					// document.execCommand("copy");
					// document.body.removeChild(input);
				};

				copyToClipboard(getLink.share_link);
				inputForShareLink.remove();
				// prompt("Here's your link: ", getLink.share_link);
				$("#linkModal").on("show.bs.modal", function (event) {
					const linkInput = $(this).find("#linkInput");
					linkInput.val(getLink.share_link);
				});
				$("#linkModal").modal("show");
				$("#linkModal").on("click", ".copy-link-btn", function () {
					$("#linkModal").modal("hide");
				});
			}
		});
});

// =============================================================================
// revoke link
$("#list-table").on("click", ".revoke-link", async function () {
	const ff_id = $(this).closest("tr").find(".ff_name").data("id");
	console.log(ff_id);

	$("#revoke-link-btn")
		.off("click")
		.on("click", async function () {
			const askRevokeLink = await revokeLink(ff_id);
			console.log("askRevokeLink: ", askRevokeLink);
			// TODO: response from backend
			if (askRevokeLink) {
				$("#revokeAlertModal").modal("show");
				setTimeout(function () {
					$("#revokeAlertModal").modal("hide");
				}, 2000);
			}
			$("#revokeLinkModal").modal("hide");
		});
});