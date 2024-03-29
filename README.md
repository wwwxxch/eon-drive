# EON Drive

<div>
   <img src="https://img.shields.io/badge/license-MIT-7c594e">
   <img src="https://img.shields.io/github/v/release/wwwxxch/eon-drive?color=76bd23">
   <img src="https://img.shields.io/badge/powered%20by-wwwxxch-blue">
</div>
<br>
	
A personal cloud storage service for users to manage their files in the cloud.

You can -

- Upload files to the cloud
- Update, download, delete uploaded files
- Restore any version of files within 30 days
- Restore deleted files within 30 days
- Share files to other EON Drive users through link

## Demo

Website URL - https://www.eondrive.net

_This project is developed and maintained by me as a personal initiative. Due to budget constraints, access to the site may not always be available._

**Test Account** <br>
Account 1 <br>
Email - `test@gmail.com` <br>
Password - `123oooOOO!`

Account 2 <br>
Email - `test@outlook.com` <br>
Password - `123oooOOO!`

\*You can try the share files feature between these two accounts. 🙂

![demo_gif](https://wwwxxch-personal.s3.amazonaws.com/eondrive_demo_gif.gif)

![landing_page](https://wwwxxch-personal.s3.amazonaws.com/eondrive_demo_landing_release_1_0_0.png)

![home_page](https://wwwxxch-personal.s3.amazonaws.com/eondrive_demo_home_release_1_0_0.png)

## Features and Technologies

- **File operations -** Extensively utilized AWS S3 storage functionality through AWS SDK to develop a user interface to manage files
- **Compressed files -** Employed AWS Lambda to generate the .zip files for multiple file downloads
- **Versioning -** Managed metadata and version information with MySQL, enabling file rollback and restoration of deleted files
- **File shared link -** Generated short URLs by base62 encoding scheme, allowing users to easily share files with others
- **Real-time update -** Displayed real-time updates with Socket.IO when new files are uploaded, files deleted, or file shared links created
- **Storage limits -** Checked the storage limits by each user during file upload and restoration processes
- **Scaling -**
  - Web Server - Hosted the Express server on AWS EC2 with Application Load Balancer to ensure scalability. PM2 logs are output to AWS CloudWatch for monitoring
  - Socket.IO Server - Utilized Redis as an adapter for Socket.IO server scaling
- **Email verification -** Used the third-party email delivery service for registration email verification
- **Rate limiting -** Implemented with Redis to control the coming requests in sign-up routes by IP address
- **Authentication -** Implemented session-based authentication
- **Remove expired versions -** Scheduled a cron job to remove expired versions of files & expired deleted files in trash and output the logs to AWS CloudWatch for monitoring
- **Machine monitoring -** Utilized Prometheus to monitor the performance and health of the EC2 machine hosting the application

### Database schema

**Adjacency List** is used here to manage hierarchical data in MySQL.

<a href="https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0_0.png" target="_blank">https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0_0.png</a>

![eondrive mysql db schema](https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0_0.png)

### System Architecture

<a href="https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0_0.png" target="_blank">https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0_0.png</a>

![eondrive architecture](https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0_0.png)

## Deployment

### Node Server

```
git clone https://github.com/wwwxxch/eon-drive.git
cd eon-drive
npm i
```

### AWS services

#### S3

1. Create two buckets
   - MAIN - storing files
   - DOWNLOAD - storing compressed files
2. IAM setup
   - EC2 server to S3
     - Create IAM policy for **MAIN** bucket, allowing below actions - _GetObject, DeleteObject, PutObject, ListBucket_
     - Create IAM user and attach above policy to the user
   - Lambda function to S3
     - Create IAM policy for **MAIN** bucket, allowing _GetObject_ action
     - Create IAM policy for **DOWNLOAD** bucket, allowing _PutObject, GetObject_ actions
     - Attach the above policies to the lambda function role
3. Setup Bucket policy
   - MAIN bucket
     - Allow **IAM user** to access the bucket with Actions - _GetObject, DeleteObject, PutObject, ListBucket_
     - Allow **lambda service** to access the bucket with Actions - _GetObject_
   - DOWNLOAD bucket
     - Allow **lambda service** to access the bucket with Actions - _PutObject, GetObject_
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
   - General configuration - setup memory to be allocated (better to be 256 MB or more) and ephemeral storage
   - Environment variables - setup variables used in lambda function

## Release

- 1.1.0
  - Adding Prometheus configuration and enabling monitoring through Grafana
- 1.0.0
  - Initial release

## Roadmap

Here are planned features or optimization for future release -

- **Rename** files / folders
- **Move** files / folders
- **Search** files / folders
- Preview content of files
- Show file size of deleted file & childrens in deleted folder
- Show hierarchy folder structure for better user experience
- Suggest related users from past interactions when a user is entering emails to share files
- **Caching** for better performance
- Implement another model to manage hierarchical data in MySQL
- Logrotate for crontab jobs

## Contact

Linkedin - https://www.linkedin.com/in/chihhui-wang

Email - chihhui.x@gmail.com

## License

EON Drive is licensed under the [MIT](https://github.com/wwwxxch/eon-drive/blob/main/LICENSE).
