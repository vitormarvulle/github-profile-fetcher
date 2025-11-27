# Serverless GitHub Profile Fetcher

A minimal serverless AWS application that fetches GitHub user profiles, stores metadata in DynamoDB, and displays them on a static frontend hosted on S3.

## Architecture

- **Frontend**: Static HTML/CSS/JS hosted in an S3 bucket.
- **Backend**: AWS Lambda (Node.js 18) triggered by API Gateway.
- **Storage**:
  - **S3**: Stores downloaded GitHub avatar images.
  - **DynamoDB**: Stores profile metadata.

## Prerequisites

- AWS CLI configured with appropriate credentials.
- Terraform installed (v1.0+).
- Node.js installed (optional, for local testing).

## Deployment Instructions

### 1. Deploy Infrastructure

Navigate to the `infra` directory and initialize Terraform:

```bash
cd infra
terraform init
```

Review the deployment plan:

```bash
terraform plan
```

Apply the configuration:

```bash
terraform apply
```

Type `yes` when prompted.

### 2. Configure Frontend

After `terraform apply` completes, note the `api_url` and `website_url` from the outputs.

1. Open `frontend/config.js`.
2. Replace `REPLACE_WITH_YOUR_API_GATEWAY_URL` with the `api_url` value from Terraform output.

### 3. Upload Frontend

Upload the frontend files to the S3 bucket created by Terraform. You can find the bucket name in the AWS Console or by inspecting the Terraform state (or just use the AWS CLI if you know the bucket name pattern).

Assuming you know the bucket name (e.g., from `terraform state show aws_s3_bucket.frontend` or the console):

```bash
# From the root of the repository
aws s3 sync frontend/ s3://github-profile-fetcher-frontend-58b541c2
```

### 4. Access the Application

Open the `website_url` in your browser.

## Usage

1. Enter a GitHub username (e.g., `octocat`).
2. Click "Search".
3. The application will:
   - Call the Lambda function.
   - Fetch data from GitHub.
   - Save the avatar to S3 and metadata to DynamoDB.
   - Display the profile card with the avatar and details.

## GitHub API Rate Limits

This application uses the public GitHub API, which has a rate limit of 60 requests per hour for unauthenticated requests. If you hit the limit, the application will return an error.

## Cleanup

To destroy all resources:

```bash
cd infra
terraform destroy
```

**Note**: You may need to empty the S3 buckets before destroying them if they contain objects.
