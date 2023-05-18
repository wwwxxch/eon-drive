# EON Drive

## Demo

https://www.eondrive.net

```
Test account: test@gmail.com
Password: 123oooOOO!
```

## Installation

## Features and Technologies

* **File operations -** Extensively utilized AWS S3 storage functionality through AWS SDK to develop a user-friendly interface to upload, download, delete, and restore files
* **Compressed files -** Employed AWS Lambda to generate the .zip files for multiple file downloads
* **Versioning -** Managed metadata and version information with MySQL, enabling file rollback and restoration of deleted files
* **File shared link -** Generated short URLs by base62 encoding scheme, allowing users to easily share files with others
*	**Real-time update -** Displayed real-time updates with Socket.IO when new files are uploaded, files deleted, or file shared links created
* **Storage limits -** Checked the storage limits by each user during file upload and restoration processes
*	**Scaling -**
    * Web Server - Hosted the Express server on AWS EC2 with Application Load Balancer to ensure scalability 
    * Socket.IO Server - Utilized Redis as an adapter for Socket.IO server scaling
* **Email verification -** Used the third-party email delivery service for registration email verification. 
* **Rate limiting -** Implemented by Redis to control the coming requests in sign-up routes
*	**Authentication -** Implemented cookie-based authentication and session management with Redis

### Database schema

<a href="https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0.png" target="_blank">https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0.png</a>

![eondrive mysql db schema](https://wwwxxch-personal.s3.amazonaws.com/eondrive_db_release_1_0.png)

### Architecture

<a href="https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0.png" target="_blank">https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0.png</a>

![eondrive architecture](https://wwwxxch-personal.s3.amazonaws.com/eondrive_arch_release_1_0.png)

## Contact
LinkedIn: https://www.linkedin.com/in/chihhui-wang/

Email: chihhui.x@gmail.com
