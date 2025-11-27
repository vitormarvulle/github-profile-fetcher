const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client();
const dynamodb = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodb);

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event));

  const username = event.queryStringParameters?.username;

  try {
    // === SCENARIO 1: List all profiles (Gallery) ===
    if (!username) {
      const scanResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
      }));

      const profiles = await Promise.all(scanResult.Items.map(async (item) => {
        // Generate presigned URL for each avatar
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.avatar_s3_key,
        });
        const avatarUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return {
          ...item,
          avatar_url: avatarUrl
        };
      }));

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(profiles),
      };
    }

    // === SCENARIO 2: Fetch specific profile (Search) ===

    // 1. Fetch from GitHub
    const githubResponse = await fetch(`https://api.github.com/users/${username}`);

    if (!githubResponse.ok) {
      return {
        statusCode: githubResponse.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "GitHub user not found or API error" }),
      };
    }

    const githubData = await githubResponse.json();

    // 2. Download Avatar
    const avatarResponse = await fetch(githubData.avatar_url);
    const avatarBuffer = await avatarResponse.arrayBuffer();
    const avatarKey = `avatars/${username}.jpg`;

    // 3. Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: avatarKey,
      Body: Buffer.from(avatarBuffer),
      ContentType: "image/jpeg",
    }));

    // 4. Save to DynamoDB
    const profileItem = {
      username: githubData.login,
      name: githubData.name,
      bio: githubData.bio,
      public_repos: githubData.public_repos,
      followers: githubData.followers,
      avatar_s3_key: avatarKey,
      created_at: new Date().toISOString(),
      github_created_at: githubData.created_at,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: profileItem,
    }));

    // 5. Generate Presigned URL for Avatar
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: avatarKey,
    });
    const avatarUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ...profileItem,
        avatar_url: avatarUrl,
      }),
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
    };
  }
};
