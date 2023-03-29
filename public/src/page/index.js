$("#form-upload").on("submit", async function(e) {
  e.preventDefault();

  const fileList = $("#file-input")[0].files;

  for (let item of fileList) {
    console.log(item);

    // get signed url from server
    const getURL = await fetch("/s3url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: item.name })
    });
    console.log("getURL: ", getURL);
    const { s3url } = await getURL.json();
    
    // put file to s3
    if (getURL.status === 200) {
      const putFile = await fetch(s3url, {
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        body: item
      });
      console.log("putFile: ", putFile);
    }
  }

  // const fileinfo = new FormData(this);

  // for (let item of fileinfo) {
  //   console.log(item[0]);
  //   console.log(item[1].name);

  //   const fetchURL = await fetch("./presigned", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ filename: item[1].name })
  //   });
  //   console.log(fetchURL.status);
  //   const getURL = await fetchURL.json();
  //   console.log("getURL: ", getURL);

  //   if (fetchURL.status === 200) {
  //     const putFile = await fetch(getURL.data, {
  //       method: "PUT",
  //       headers: { "Content-Type": "multipart/form-data" },
  //       body: fileinfo
  //     });
  //     console.log(putFile);
  //   }

  // }


  // fileinfo.forEach(item => {
  //   console.log(item);
  //   console.log(item.name);
  //   console.log(item.lastModifiedDate);
  // });
});