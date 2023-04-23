import { downloadShareFi } from "../../api/view.js";

// download file
$(".fi-dl-btn").on("click", async function() {
  const windowPathName = window.location.pathname;
	const shareToken = windowPathName.split("/")[3];
	console.log(shareToken);

  const downloadFileRes = await downloadShareFi(shareToken);
  if (downloadFileRes.status === 200) {
		window.open(downloadFileRes.downloadUrl, "_self");
	}
});