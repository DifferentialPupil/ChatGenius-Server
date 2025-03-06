const { s3, bucketName } = require('../config/s3');

/**
 * Delete a file from S3 bucket
 * @param {string} fileUrl - The URL of the file to delete
 * @returns {Promise} - Promise resolving to the deletion result
 */
const deleteFileFromS3 = async (fileUrl) => {
  try {
    // Extract the key from the fileUrl
    const urlParts = new URL(fileUrl);
    const key = urlParts.pathname.startsWith('/') 
      ? urlParts.pathname.substring(1) 
      : urlParts.pathname;

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    return await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

/**
 * Get the file metadata from S3
 * @param {string} fileUrl - The URL of the file to get metadata for
 * @returns {Promise} - Promise resolving to the file metadata
 */
const getFileMetadata = async (fileUrl) => {
  try {
    // Extract the key from the fileUrl
    const urlParts = new URL(fileUrl);
    const key = urlParts.pathname.startsWith('/') 
      ? urlParts.pathname.substring(1) 
      : urlParts.pathname;

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    return await s3.headObject(params).promise();
  } catch (error) {
    console.error('Error getting file metadata from S3:', error);
    throw error;
  }
};

module.exports = {
  deleteFileFromS3,
  getFileMetadata,
}; 