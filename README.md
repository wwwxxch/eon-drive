# EON Drive

A personal cloud storage service for users to manage their files in the cloud.

You can -
* Upload files to the cloud
* Update, download, delete uploaded files
* Restore any version of files within 30 days
* Restore deleted files within 30 days
* Share files to other EON Drive users through link

## Demo

https://www.eondrive.net

**Test Account** <br>
Email: `test@gmail.com` <br>
Password: `123oooOOO!`

## Features and Technologies

* **File operations -** Extensively utilized AWS S3 storage functionality through AWS SDK to develop a user interface to manage files
* **Compressed files -** Employed AWS Lambda to generate the .zip files for multiple file downloads
* **Versioning -** Managed metadata and version information with MySQL, enabling file rollback and restoration of deleted files
* **File shared link -** Generated short URLs by base62 encoding scheme, allowing users to easily share files with others
*	**Real-time update -** Displayed real-time updates with Socket.IO when new files are uploaded, files deleted, or file shared links created
* **Storage limits -** Checked the storage limits by each user during file upload and restoration processes
*	**Scaling -**
    * Web Server - Hosted the Express server on AWS EC2 with Application Load Balancer to ensure scalability 
    * Socket.IO Server - Utilized Redis as an adapter for Socket.IO server scaling
* **Email verification -** Used the third-party email delivery service for registration email verification
* **Rate limiting -** Implemented with Redis to control the coming requests in sign-up routes
*	**Authentication -** Implemented cookie-based authentication and session management with Redis

### Database schema

<a href="https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0.png" target="_blank">https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0.png</a>

![eondrive mysql db schema](https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0.png)

### System Architecture

<a href="https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0.png" target="_blank">https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0.png</a>

![eondrive architecture](https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0.png)

## Deployment

### Node Server

```
git clone https://github.com/wwwxxch/eon-drive.git
cd eondrive
npm i
```

### AWS services

#### S3
1. Create two buckets
    * MAIN - storing files
    * DOWNLOAD - storing compressed files
2. IAM setup
    * EC2 server to S3
        * Create IAM policy for **MAIN** bucket, allowing below actions - *GetObject, DeleteObject, PutObject, ListBucket*
        * Create IAM user and attach above policy to the user
    * Lambda function to S3
        * Create IAM policy for **MAIN** bucket, allowing *GetObject* action
        * Create IAM policy for **DOWNLOAD** bucket, allowing *PutObject, GetObject* actions
        * Attach the above policies to the lambda function role
    
3. Setup Bucket policy
    * MAIN bucket
        * Allow **IAM user** to access the bucket with Actions - *GetObject, DeleteObject, PutObject, ListBucket*
        * Allow **lambda service** to access the bucket with Actions - *GetObject*
    * DOWNLOAD bucket
        * Allow **lambda service** to access the bucket with Actions - *PutObject, GetObject*
4. Setup CORS
    ```
      [
          {
              "AllowedHeaders": [
                  "*"
              ],
              "AllowedMethods": [
                  "GET",
                  "POST",
                  "PUT",
                  "DELETE",
                  "HEAD"
              ],
              "AllowedOrigins": [
                  "https://yourdomain.com"
              ],
              "ExposeHeaders": [
                  "ETag",
                  "x-amz-id-2",
                  "x-amz-request-id",
                  "x-amz-server-side-encryption"
              ]
          }
      ]
    ```

#### Lambda
1. Create layer with npm packge `archiver` installed. Setup compatible runtimes as `Node.js 18.x`
2. Create lambda function and update the code with programs inside `/eon-drive/lambda` folder
3. Setup runtime as `Node.js 18.x` and layers with the layer created in step 1
4. In configuration tab
    * General configuration - setup memory to be allocated (better to be 256 MB or more) and ephemeral storage
    * Environment variables - setup variables used in lambda function


## Contact

<div>
  <a href="https://www.linkedin.com/in/chihhui-wang">
  <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 48 48" width="30px" height="30px"><path fill="#0078d4" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5	V37z"/><path d="M30,37V26.901c0-1.689-0.819-2.698-2.192-2.698c-0.815,0-1.414,0.459-1.779,1.364	c-0.017,0.064-0.041,0.325-0.031,1.114L26,37h-7V18h7v1.061C27.022,18.356,28.275,18,29.738,18c4.547,0,7.261,3.093,7.261,8.274	L37,37H30z M11,37V18h3.457C12.454,18,11,16.528,11,14.499C11,12.472,12.478,11,14.514,11c2.012,0,3.445,1.431,3.486,3.479	C18,16.523,16.521,18,14.485,18H18v19H11z" opacity=".05"/><path d="M30.5,36.5v-9.599c0-1.973-1.031-3.198-2.692-3.198c-1.295,0-1.935,0.912-2.243,1.677	c-0.082,0.199-0.071,0.989-0.067,1.326L25.5,36.5h-6v-18h6v1.638c0.795-0.823,2.075-1.638,4.238-1.638	c4.233,0,6.761,2.906,6.761,7.774L36.5,36.5H30.5z M11.5,36.5v-18h6v18H11.5z M14.457,17.5c-1.713,0-2.957-1.262-2.957-3.001	c0-1.738,1.268-2.999,3.014-2.999c1.724,0,2.951,1.229,2.986,2.989c0,1.749-1.268,3.011-3.015,3.011H14.457z" opacity=".07"/><path fill="#fff" d="M12,19h5v17h-5V19z M14.485,17h-0.028C12.965,17,12,15.888,12,14.499C12,13.08,12.995,12,14.514,12	c1.521,0,2.458,1.08,2.486,2.499C17,15.887,16.035,17,14.485,17z M36,36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698	c-1.501,0-2.313,1.012-2.707,1.99C24.957,25.543,25,26.511,25,27v9h-5V19h5v2.616C25.721,20.5,26.85,19,29.738,19	c3.578,0,6.261,2.25,6.261,7.274L36,36L36,36z"/></svg></a>

  <a href="chihhui.x@gmail.com">
    <svg width="30px" height="30px" viewBox="0 0 30 30" id="Layer_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style type="text/css">
	.st0{fill:#FD6A7E;}
	.st1{fill:#17B978;}
	.st2{fill:#8797EE;}
	.st3{fill:#41A6F9;}
	.st4{fill:#37E0FF;}
	.st5{fill:#2FD9B9;}
	.st6{fill:#F498BD;}
	.st7{fill:#FFDF1D;}
	.st8{fill:#C6C9CC;}
</style><path class="st7" d="M25,6H5C3.9,6,3,6.9,3,8v14c0,1.1,0.9,2,2,2h20c1.1,0,2-0.9,2-2V8C27,6.9,26.1,6,25,6z M23.8,10l-8.1,6.4  c-0.4,0.3-1,0.3-1.5,0l-8-6.3C5.9,9.9,5.8,9.4,6.1,9c0.3-0.3,0.7-0.4,1.1-0.2L15,14l7.9-5.2c0.4-0.2,0.9-0.1,1.1,0.2  C24.2,9.3,24.1,9.8,23.8,10z"/></svg>
  </a>
</div>

## License
EON Drive is licensed under the MIT