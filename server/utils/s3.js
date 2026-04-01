const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "typeface-s3-photo-bucket";

function constructS3Url(customId) {
    return `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-west-1"}.amazonaws.com/Font+Census+Data/${customId}`;
}

module.exports = { constructS3Url };
