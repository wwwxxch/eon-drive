// import Dropzone from "dropzone";

$("#form-upload").on("submit", async function(e) {
  e.preventDefault();
  console.log("here");
  const fileinfo = new FormData(this);
  fileinfo.forEach(item => {
    console.log(item);
    console.log(item.lastModifiedDate);
  });

});