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

<html>
  <table>
    <tr>
      <td><b>Test Account</b></td>
      <td></td>
    </tr>
    <tr>
      <td>Email<br>Password</td>
      <td>test@gmail.com<br>123oooOOO!</td>
    </tr>
  </table>
</html>

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
    * MAIN bucket - storing files
    * DOWNLOAD bucket - storing compressed files
2. IAM setup
    * EC2 server to S3
        * Create IAM policy for **MAIN** bucket, allowing below actions - *GetObject, DeleteObject, PutObject, ListBucket*
        * Create IAM user and attach above policy
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
LinkedIn - https://www.linkedin.com/in/chihhui-wang

Email - chihhui.x@gmail.com
