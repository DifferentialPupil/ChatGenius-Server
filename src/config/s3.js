const AWS = require('aws-sdk');

// Initialize AWS S3 with environment variables
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

// Create and export S3 instance
const s3 = new AWS.S3(s3Config);

module.exports = {
  s3,
  bucketName: process.env.AWS_BUCKET_NAME,
}; 