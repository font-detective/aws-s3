// Luke Mitchell
// 2015

var AWS = require("aws-sdk");
var fs = require("fs");
var crypto = require('crypto');

// Set location to Ireland
AWS.config.region = "eu-west-1";
var defaultBucket = "fontdetective";

// Puts a file in specified (bucket, key)
function putFileS3(filename, key, bucket, callback) {
  var body = fs.createReadStream(filename);
  putS3(body, key, bucket, callback);
}

// Puts data in specified (bucket, key)
function putS3(body, key, bucket, callback) {
  var metadata = { uploaded: Date.now().toString() };
  var s3obj = new AWS.S3({params: {Bucket: bucket, Key: key, Metadata: metadata}});
  s3obj.upload({Body: body}).
    on("httpUploadProgress", function(evt) { console.log((evt.loaded / evt.total).toFixed(2) + "%") }).
    send(callback);
}

// Gets a file in specified (bucket, key)
function getFileS3(filename, key, bucket, callback) {
  var params = {Bucket: bucket, Key: key};
  var file = require('fs').createWriteStream(filename);
  new AWS.S3().getObject(params).createReadStream().on("finish", callback).pipe(file);
}

// Gets data from specified (bucket, key)
// returns a callback with err, data
function getS3(callback, key, bucket, callback) {
  var params = {Bucket: bucket, Key: key};
  new AWS.S3().getObject(params, callback).send();
}

// Create checksum of string
function checksum (str, algorithm, encoding) {
  return crypto
    .createHash(algorithm || 'sha256')
    .update(str, 'utf8')
    .digest(encoding || 'hex');
}

// Upload and retrieve file from S3 bucket
// then compare checksum
function test() {
  var testFilename = "test/test.gif";
  var testOutputFilename = "test/test-output.gif";
  var key = "test";
  putFileS3(testFilename, key, defaultBucket, function(err, data) {
    if (err) {
      return;
    }
    getFileS3(testOutputFilename, key, defaultBucket, function (err, data) {
      if (err) {
        return;
      }
      fs.readFile(testFilename, function (err, data) {
        var testChecksum = checksum(data);
        fs.readFile(testOutputFilename, function (err, data) {
          var testOutputChecksum = checksum(data);
          if (testChecksum !== testOutputChecksum) {
            console.error("Test failed, checksums do not match!");
          }
        });
      });
    });
  });
}

/* Main application code */

test();
