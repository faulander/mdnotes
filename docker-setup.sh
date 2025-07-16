#!/bin/bash

# Docker setup script for Markdown Notes
set -e

echo "🐳 Setting up Markdown Notes with Docker..."

# Create notes directory if it doesn't exist
if [ ! -d "./notes" ]; then
    echo "📁 Creating notes directory..."
    mkdir -p ./notes
    echo "# Welcome to Markdown Notes" > ./notes/README.md
    echo "" >> ./notes/README.md
    echo "This is your notes directory. All your markdown files will be stored here." >> ./notes/README.md
fi

# Copy environment file
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment file..."
    cp .env.docker .env
fi

# Build and start the container
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting Markdown Notes..."
docker-compose up -d

echo "✅ Setup complete!"
echo ""
echo "📖 Markdown Notes is now running at: http://localhost:3000"
echo "📁 Your notes are stored in: ./notes"
echo "⚙️  Settings and data are persisted in Docker volume: mdnotes-data"
echo ""
echo "🛠️  Commands:"
echo "  docker-compose logs -f    # View logs"
echo "  docker-compose stop       # Stop the application"
echo "  docker-compose restart    # Restart the application"
echo "  docker-compose down       # Stop and remove containers"