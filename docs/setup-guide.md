# AWS Setup Guide for RAG Chatbot

This guide walks you through setting up the necessary AWS resources for your RAG Chatbot.

## Prerequisites
- An AWS Account.
- Permissions to create S3 Buckets, OpenSearch Serverless Collections, and Bedrock Knowledge Bases.

## Step 1: Create an S3 Bucket
1.  Go to the **Amazon S3** console.
2.  Click **Create bucket**.
3.  Enter a unique **Bucket name** (e.g., `my-rag-chatbot-docs-123`).
4.  Choose the **AWS Region** (e.g., `us-east-1`). **Important**: All resources must be in the same region.
5.  Keep other settings as default and click **Create bucket**.
6.  **Note down the Bucket Name**.

## Step 2: Create a Knowledge Base
1.  Go to the **Amazon Bedrock** console.
2.  In the left navigation, select **Knowledge bases**.
3.  Click **Create knowledge base**.
4.  **Knowledge base details**:
    -   Name: `my-rag-kb`
    -   IAM permissions: Select **Create and use a new service role**.
    -   Click **Next**.
5.  **Set up data source**:
    -   Name: `my-s3-source`
    -   Data source location: Select **Browse S3** and choose the bucket you created in Step 1.
    -   Click **Next**.
6.  **Select embeddings model and configure vector store**:
    -   Embeddings model: Select **Titan Embeddings G1 - Text v1.2** (or similar).
    -   Vector database: Select **Quick create a new vector store** (Recommended).
        -   This will automatically create an OpenSearch Serverless collection for you.
    -   Click **Next**.
7.  **Review and create**:
    -   Review your settings.
    -   Click **Create knowledge base**.
    -   *Wait*: Creation may take a few minutes.
8.  **Get IDs**:
    -   Once created, copy the **Knowledge base ID** (e.g., `ABC123XYZ`).
    -   Scroll down to **Data source** and copy the **Data source ID** (e.g., `DEF456UVW`).

## Step 3: Get AWS Access Keys
1.  Go to the **IAM** console.
2.  Click **Users** -> **Create user**.
3.  Name: `rag-chatbot-user`.
4.  **Permissions**:
    -   Select **Attach policies directly**.
    -   Search for and select:
        -   `AmazonBedrockFullAccess`
        -   `AmazonS3FullAccess` (or restrict to your specific bucket).
    -   Click **Next** -> **Create user**.
5.  Click on the newly created user.
6.  Go to the **Security credentials** tab.
7.  Scroll to **Access keys** and click **Create access key**.
8.  Select **Application running outside AWS**.
9.  Copy the **Access key ID** and **Secret access key**.

## Step 4: Configure the Chatbot
1.  Open your deployed chatbot application.
2.  In the **Setup Wizard**, enter:
    -   **AWS Access Key ID**
    -   **AWS Secret Access Key**
    -   **AWS Region** (e.g., `us-east-1`)
    -   **S3 Bucket Name**
    -   **Knowledge Base ID**
    -   **Data Source ID**
3.  Complete the wizard to start using your chatbot!
