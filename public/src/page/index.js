async function splitFileIntoChunks(file, chunk_size) {
  const CHUNK_SIZE = chunk_size * 1024 * 1024; // 5MB
  const chunks = [];

  let start = 0;
  let end = CHUNK_SIZE;
  while (start < file.size) {
    const chunk = file.slice(start, end);
    chunks.push(chunk);
    start = end;
    end = start + CHUNK_SIZE;
  }

  return chunks;
}

$("#form-upload").on("submit", async function(e) {
  e.preventDefault();

  const fileList = $("#file-input")[0].files;

  for (let item of fileList) {
    console.log(item);
    if (item.size > 5 * 1024 * 1024) {
      const chunks = await splitFileIntoChunks(item, 5);
      // console.log(chunks);

      const getPartUrls = await fetch(`/multi-upload?filename=${item.name}&count=${chunks.length}`);
      console.log("getPartUrls: ", getPartUrls);
      const getPartUrlsResult = await getPartUrls.json();
      console.log("getPartUrlsResult: ", getPartUrlsResult);

      if (getPartUrls.status === 200) {
        const { completeUrl, partUrlsArr } = getPartUrlsResult;
        const etagArr = Array(chunks.length);
        const putRequests = [];

        for (let i = 0; i < partUrlsArr.length; i++) {
          const putMultiFiles = fetch(partUrlsArr[i], {
						method: "PUT",
						headers: {
							"Content-Type": "application/octet-stream"
						},
						body: chunks[i],
					})
            .then(res => {
              // for (let header of res.headers.entries()) {
              //   console.log(header);
              // }
              // console.log(res.headers.get("etag"));
              etagArr[i] = res.headers.get("etag").replace(/"/g,"");
            });
          putRequests.push(putMultiFiles);
        }

        Promise.all(putRequests).then(async()=>{
          const xmlBody = `
            <CompleteMultipartUpload>
              ${etagArr.map((item, i) => {
                return `
                  <Part>
                    <PartNumber>${i + 1}</PartNumber>
                    <ETag>${item}</ETag>
                  </Part>
                `;
              }).join("")}
            </CompleteMultipartUpload>
          `;
          console.log(xmlBody);
          console.log(completeUrl);
          fetch(completeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/xml" },
            body: xmlBody
          }).then(res => console.log(res));
        });

      }

    } else {
      // get signed url from server
      const getURL = await fetch("/single-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: item.name })
      });
      console.log("getURL: ", getURL);
      const { singleUrl } = await getURL.json();
      
      // put file to s3
      if (getURL.status === 200) {
        const putFile = await fetch(singleUrl, {
          method: "PUT",
          headers: { "Content-Type": "multipart/form-data" },
          body: item
        });
        console.log("putFile: ", putFile);
      }
    }
  }

});


$("#form-chunks").on("submit", async function(e) {
  e.preventDefault();

  const fileList = $("#file-input-chunks")[0].files;

  for (let item of fileList) {
    console.log(item);
    if (item.size > 2 * 1024 * 1024) {
      const chunks = await splitFileIntoChunks(item, 2);
      // console.log(chunks);
      
      for (let i = 0; i < chunks.length; i++) {
        const getURL = await fetch("/single-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: `${item.name}_chunk${i}` })
        });
        const { singleUrl } = await getURL.json();

        if (getURL.status === 200) {
          const putFile = await fetch(singleUrl, {
            method: "PUT",
            headers: { "Content-Type": "multipart/form-data" },
            body: chunks[i]
          });
          console.log("putFile: ", putFile);
        }
      }

    } else {
      // get signed url from server
      const getURL = await fetch("/single-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: item.name })
      });
      console.log("getURL: ", getURL);
      const { singleUrl } = await getURL.json();
      
      // put file to s3
      if (getURL.status === 200) {
        const putFile = await fetch(singleUrl, {
          method: "PUT",
          headers: { "Content-Type": "multipart/form-data" },
          body: item
        });
        console.log("putFile: ", putFile);
      }
    }
  }

});