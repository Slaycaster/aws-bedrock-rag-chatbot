#!/bin/bash

echo "========================================="
echo "  AWS Bedrock RAG Chatbot Setup"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker could not be found. Please install Docker and Docker Compose."
    exit 1
fi

# Parse flags
DEV_MODE=false
CLEAN_MODE=false
INTERACTIVE=true

for arg in "$@"; do
    case $arg in
        --dev)
            DEV_MODE=true
            ;;
        --clean)
            CLEAN_MODE=true
            INTERACTIVE=false
            ;;
        --no-clean)
            CLEAN_MODE=false
            INTERACTIVE=false
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: ./setup.sh [--dev] [--clean|--no-clean]"
            echo "  --dev        Run in development mode with hot reload"
            echo "  --clean      Remove database and volumes before starting"
            echo "  --no-clean   Keep existing database (skip prompt)"
            exit 1
            ;;
    esac
done

# Interactive prompt for database reset (only if no flags provided)
if [ "$INTERACTIVE" = true ]; then
    echo "Do you want to reset the database? This will delete all existing data."
    echo -n "Reset database? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        CLEAN_MODE=true
        echo "✅ Database will be reset."
    else
        echo "✅ Keeping existing database."
    fi
    echo ""
fi

# Clean up if requested
if [ "$CLEAN_MODE" = true ]; then
    echo "🗑️  Cleaning up database and volumes..."
    if [ "$DEV_MODE" = true ]; then
        docker-compose -f docker-compose.dev.yml down -v
    else
        docker-compose down -v
    fi
    echo "✅ Database and volumes removed."
    echo ""
fi

# Start containers
if [ "$DEV_MODE" = true ]; then
    echo "Starting in DEVELOPMENT mode with hot reload..."
    docker-compose -f docker-compose.dev.yml up -d --build
    echo ""
    echo "========================================="
    echo "  App is running in DEVELOPMENT mode!"
    echo "========================================="
    echo "Frontend: http://localhost (with hot reload)"
    echo "Backend:  http://localhost:8000 (with auto-reload)"
    echo "API Docs: http://localhost:8000/docs"
    echo "========================================="
else
    echo "Building and starting containers in PRODUCTION mode..."
    docker-compose up -d --build
    echo ""
    echo "========================================="
    echo "  App is running in PRODUCTION mode!"
    echo "========================================="
    echo "Frontend: http://localhost"
    echo "Backend:  http://localhost:8000"
    echo "API Docs: http://localhost:8000/docs"
    echo ""
    echo "External Access (VPS/Server):"
    echo "   Replace 'localhost' with your server IP"
    echo "   Example: http://YOUR_SERVER_IP"
    echo "========================================="
fi

echo ""
if [ "$CLEAN_MODE" = true ]; then
    echo "⚠️  Database was reset."
    echo "Visit http://localhost/wizard to complete setup."
else
    echo "Visit http://localhost (or /wizard if first time)."
fi
echo ""
