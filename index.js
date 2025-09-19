const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const TABLE_NAME = 'YourDynamoDBTable';       // Replace with your actual DynamoDB table name
const BUCKET_NAME = 'your-private-bucket';    // Replace with your actual S3 bucket name

exports.handler = async (event) => {
  const method = event.httpMethod;

  if (method === 'POST') {
    try {
      const data = JSON.parse(event.body);
      const id = uuidv4();

      const item = {
        id: id,
        ...data,
        timestamp: new Date().toISOString()
      };

      // Save to DynamoDB
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();

      // Save to S3 — ✅ FIXED template literal
      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: `${id}.json`, // ✅ Correct syntax
        Body: JSON.stringify(item),
        ContentType: 'application/json',
        ACL: 'private'
      }).promise();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Data saved successfully', id })
      };
    } catch (error) {
      console.error('POST Error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Error processing POST request', error: error.message })
      };
    }
  }

  if (method === 'GET') {
    try {
      const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Items)
      };
    } catch (error) {
      console.error('GET Error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Error processing GET request', error: error.message })
      };
    }
  }

  // Handle unsupported methods
  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Method Not Allowed' })
  };
};
