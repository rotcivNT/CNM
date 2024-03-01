const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: 'AKIA4MTWLLFFOZQUD752',
  secretAccessKey: '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',
  region: 'ap-southeast-1',
});

const s3 = new AWS.S3();

module.exports = s3