# AWS Bedrock RAG Chatbot

![AWS Bedrock RAG Chatbot](docs/images/preview.png)

A drop-in app for your VPS/server, embeddable chatbot powered by AWS Bedrock with Retrieval-Augmented Generation (RAG) capabilities.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- AWS Account with Bedrock access
- AWS credentials (Access Key ID and Secret Access Key)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd aws-bedrock-rag-chatbot
```

2. **Run the setup script**

```bash
./setup.sh
```

The script will:

- Ask if you want to reset the database (interactive prompt)
- Build and start the application in production mode
- Display access URLs

3. **Complete the setup wizard**

- Visit `http://localhost/wizard`
- Create admin account
- Configure AWS credentials and model settings
- Upload your knowledge base documents

## ✨ Features at a Glance

<table>
  <tr>
    <td align="center">
      <img src="docs/images/feature1.png" alt="Setup Wizard" width="100%"/>
      <br />
      <b>🚀 One-Click Setup Wizard</b>
      <br />
      <sub>Get started in minutes with our guided configuration flow</sub>
    </td>
    <td align="center">
      <img src="docs/images/feature2.png" alt="Chat Widget" width="100%"/>
      <br />
      <b>💬 Embeddable Chat Widget</b>
      <br />
      <sub>Copy embed code or use direct link for seamless integration on any website or mobile webview</sub>
    </td>
    <td align="center">
      <img src="docs/images/feature3.png" alt="Knowledge Base" width="100%"/>
      <br />
      <b>🔄 Automatic Vector Store Sync</b>
      <br />
      <sub><strong>Upload files and automatically sync with AWS Bedrock Knowledge Base vector store</strong></sub>
    </td>
  </tr>
</table>

## Deployment Modes

### Production Mode (Default)

For production deployment on VPS/servers:

```bash
./setup.sh
```

**Features:**

- Optimized build with minified assets
- Generic error messages (security)
- Binds to `0.0.0.0` for external access
- Accessible via server IP address

**Access:**

- Local: `http://localhost`
- External: `http://YOUR_SERVER_IP`
- Backend API: `http://YOUR_SERVER_IP:8000`
- API Docs: `http://YOUR_SERVER_IP:8000/docs`

### Development Mode

For local development with hot reload:

```bash
./setup.sh --dev
```

**Features:**

- Frontend hot module replacement (instant updates)
- Backend auto-reload on code changes
- Detailed error messages with tracebacks
- Faster iteration cycle

## Setup Script Options

```bash
./setup.sh [--dev] [--clean|--no-clean]
```

**Options:**

- `--dev` - Run in development mode with hot reload
- `--clean` - Reset database and volumes before starting
- `--no-clean` - Keep existing database (skip interactive prompt)

**Examples:**

```bash
# Interactive setup (prompts for database reset)
./setup.sh

# Production with clean database
./setup.sh --clean

# Development mode with clean database
./setup.sh --dev --clean

# Production keeping existing data
./setup.sh --no-clean
```

## VPS/Server Deployment

### Firewall Configuration

Open required ports:

```bash
# HTTP (Frontend)
sudo ufw allow 80/tcp

# Backend API
sudo ufw allow 8000/tcp

# HTTPS (if using reverse proxy)
sudo ufw allow 443/tcp
```

### Recommended: Use Nginx Reverse Proxy

For production, use Nginx to:

- Serve on port 80/443
- Handle SSL/TLS certificates
- Proxy backend API requests

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Features

- **One-Click Setup Wizard**: Easy first-time setup flow with guided AWS configuration
- **Embeddable Chat Widget**: Copy embed code or use direct link to add the chatbot to any website or mobile webview
- **🔄 Automatic Vector Store Sync**: **Upload files and automatically sync with AWS Bedrock Knowledge Base vector store** - no manual configuration needed
- **Admin Dashboard**: Configure AWS credentials, manage files, and monitor the chatbot
- **AWS Bedrock Integration**: Powered by Claude models (Haiku 4.5, Sonnet 4, Sonnet 4.5)
- **Model Selection**: Choose between different Claude models based on your needs
- **Production Error Handling**: Generic error messages in production, detailed in development

## Architecture

- **Frontend**: React + TypeScript + Vite + shadcn/ui + Tailwind CSS (Node 22)
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + Boto3
- **Database**: SQLite (persistent via Docker volume)
- **Deployment**: Docker + Docker Compose

## Configuration

### AWS Requirements

1. **AWS Bedrock Access**: Enable Claude models in your AWS account
2. **Knowledge Base**: Create a Bedrock Knowledge Base
3. **S3 Bucket**: For document storage
4. **IAM Permissions**: Ensure your AWS credentials have access to:
   - Bedrock Runtime
   - Bedrock Knowledge Bases
   - S3

### Model Selection

Available models (configured in Admin Dashboard):

- **Claude 4.5 Haiku**: Fast & cost-effective (default)
- **Claude 4 Sonnet**: Balanced performance
- **Claude 4.5 Sonnet**: Most capable

## URLs

- **Frontend**: `http://localhost` (or `http://YOUR_SERVER_IP`)
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`
- **Chat Widget**: `http://localhost/widget`
- **Admin Dashboard**: `http://localhost/admin`

## Troubleshooting

### Database Issues

Reset the database:

```bash
./setup.sh --clean
```

### Port Conflicts

If ports 80 or 8000 are in use, modify `docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Change frontend port
  - "8001:8000" # Change backend port
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker logs aws-bedrock-rag-chatbot-rag-chatbot-backend-1 -f

# Frontend only
docker logs aws-bedrock-rag-chatbot-rag-chatbot-frontend-1 -f
```

## Security Notes

- Change the `SECRET_KEY` in `docker-compose.yml` for production
- Use HTTPS with SSL certificates (via reverse proxy)
- Restrict AWS IAM permissions to minimum required
- Keep AWS credentials secure and never commit them to version control

## Future Feature Checklist

### Very Soon

- **Interrogation style chatbot**
- **Customize chatbot colour palette**
- **Request metadata support** - Able to put request metadata on the widget and embed so it can greet the user by its name and some other details needed (useful for mobile apps)

### Plan

- **Region flexibility and dynamic model availability** - Based on available on-demand inference at AWS at selected region
