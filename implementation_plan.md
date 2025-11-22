# Implementation Plan - Embeddable RAG Chatbot (AWS Bedrock)

## Goal Description
Build an open-source, deployable RAG chatbot application.
- **Core AI**: Amazon Bedrock Knowledge Bases API + Claude 3 Haiku.
- **Deployment Target**: Small VPS (Dockerized, "WordPress-style" setup).
- **Features**: Admin panel for config/uploads, embeddable chat widget, mobile-ready.

## User Review Required
> [!IMPORTANT]
> **Final Decision on AWS Resource Management**:
> 1.  **Manual Infrastructure Setup**: The user **MUST** manually create the S3 Bucket, OpenSearch Serverless Collection, and Bedrock Knowledge Base in the AWS Console.
>     - *Reason*: Programmatic creation is too complex, slow, and costly for this MVP.
>     - *Mitigation*: We will provide a comprehensive **"AWS Setup Guide"** with screenshots.
> 2.  **App Responsibilities**:
>     - **First-Time Setup Wizard**: The app will guide the user to input their `AWS Keys`, `Region`, `Knowledge Base ID`, and `Data Source ID`.
>     - **File Management**: The app **WILL** handle uploading files to the S3 bucket and triggering the `StartIngestionJob` to sync the Knowledge Base.
> 3.  **Prerequisites**: The user needs an active AWS account with permissions to create these resources.

## Proposed Changes

### Architecture
- **Backend**: Python FastAPI
    - Async support for AI streaming.
    - `boto3` for AWS Bedrock and S3 interactions.
    - SQLite database for storing Admin Users, Chatbot Config (Name, Greeting), and Chat Logs.
- **Frontend**: React (Vite + TypeScript)
    - **Admin Panel**: `/admin` route. Dashboard to manage KB and settings.
    - **Chat Widget**: Standalone component that can be built into a single `.js` file for embedding.

### Backend Structure
#### [NEW] `backend/`
- `main.py`: Entry point.
- `api/`: Routes for `auth`, `chat`, `admin`.
- `services/`:
    - `bedrock_service.py`: Wraps `bedrock-agent-runtime` (for chat) and `bedrock-agent` (for triggering `StartIngestionJob`).
    - `s3_service.py`: Handles uploading files to the user's defined S3 bucket.
- `models/`: SQLAlchemy models (User, Config, Message).
- `database.py`: DB connection.

### Frontend Structure
#### [NEW] `frontend/`
- `src/admin/`: Admin Dashboard components.
- `src/wizard/`: **First-Time Setup Wizard**.
    - Step 1: Admin Account Creation.
    - Step 2: AWS Config (Keys, Region, KB ID, Data Source ID).
    - Step 3: Initial File Upload & Sync.
- `src/widget/`: The embeddable chat widget.
- `src/App.tsx`: Routing (checks if setup is complete, redirects to Wizard if not).

### Documentation
#### [NEW] `docs/setup-guide.md`
- **"Idiot-Proof" AWS Guide**: Screenshots/Steps to:
    1. Create S3 Bucket.
    2. Create OpenSearch Serverless Collection (or use the Console Wizard which handles this).
    3. Create Bedrock Knowledge Base pointing to S3.
    4. Get Access Keys and KB ID.

### Deployment
#### [NEW] `docker-compose.yml`
- Services: `backend`, `frontend` (served via Nginx or simple static server).
- Volume for SQLite DB.

## Verification Plan

### Automated Tests
- **Backend**: `pytest` for API endpoints (mocking `boto3`).
- **Frontend**: Basic rendering tests.

### Manual Verification
1. **Setup**: Run `docker-compose up`.
2. **Admin**: Log in, set AWS Keys, set KB ID.
3. **Upload**: Upload a PDF via Admin panel. Verify it appears in S3 (if we implement S3 upload) and trigger a Sync on Bedrock.
4. **Chat**: Use the widget to ask a question based on the PDF. Verify Claude Haiku responds correctly using the context.
5. **Embed**: Create a dummy HTML page, include the widget script, and verify it loads and functions.
