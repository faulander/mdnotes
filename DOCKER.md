# Docker Setup for Markdown Notes

This document explains how to run Markdown Notes using Docker for easy deployment and consistent environments.

## Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mdnotes
   ```

2. **Run the setup script**

   ```bash
   ./docker-setup.sh
   ```

3. **Access the application**
   Open your browser to `http://localhost:3000`

## Manual Setup

### Prerequisites

- Docker
- Docker Compose

### Steps

1. **Build the Docker image**

   ```bash
   docker-compose build
   ```

2. **Start the application**

   ```bash
   docker-compose up -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

| Variable             | Description                  | Default              |
| -------------------- | ---------------------------- | -------------------- |
| `NODE_ENV`           | Application environment      | `production`         |
| `PORT`               | Port to run the application  | `3000`               |
| `NOTES_DIR`          | Directory for markdown files | `/app/notes`         |
| `DATA_DIR`           | Directory for app data       | `/app/data`          |
| `DEBUG`              | Enable debug logging         | `false`              |
| `MAX_FILE_SIZE`      | Maximum file size (bytes)    | `10485760`           |
| `ALLOWED_EXTENSIONS` | Allowed file extensions      | `.md,.txt,.markdown` |

### Volumes

The Docker setup uses two types of persistent storage:

1. **Notes Directory** (`./notes:/app/notes`)
   - Your markdown files
   - Bind mount to local `./notes` directory
   - Easily accessible from host system

2. **Application Data** (`mdnotes-data:/app/data`)
   - Settings and configuration
   - Pinned files state
   - Docker named volume for persistence

## File Structure

```
mdnotes/
├── Dockerfile              # Container definition
├── docker-compose.yml      # Service orchestration
├── .env.example            # Environment template
├── .env.docker            # Docker-specific config
├── docker-setup.sh        # Quick setup script
├── DOCKER.md              # This documentation
└── notes/                 # Your markdown files (created on first run)
```

## Commands

### Basic Operations

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose stop

# Restart the application
docker-compose restart

# View logs
docker-compose logs -f

# Remove containers and volumes
docker-compose down -v
```

### Development

```bash
# Build with no cache
docker-compose build --no-cache

# Run in foreground (see logs immediately)
docker-compose up

# Access container shell
docker-compose exec mdnotes sh
```

### Backup and Restore

```bash
# Backup notes directory
tar -czf notes-backup.tar.gz notes/

# Backup Docker volume (settings/pinned files)
docker run --rm -v mdnotes-data:/data -v $(pwd):/backup alpine tar -czf /backup/data-backup.tar.gz -C /data .

# Restore Docker volume
docker run --rm -v mdnotes-data:/data -v $(pwd):/backup alpine tar -xzf /backup/data-backup.tar.gz -C /data
```

## Security

- Application runs as non-root user (`mdnotes:nodejs`)
- Health checks ensure container reliability
- Environment variables for sensitive configuration
- Proper file permissions and ownership

## Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Change port in docker-compose.yml
   ports:
     - "3001:3000"  # Use port 3001 instead
   ```

2. **Permission issues**

   ```bash
   # Fix ownership of notes directory
   sudo chown -R $(id -u):$(id -g) notes/
   ```

3. **Container won't start**

   ```bash
   # Check logs
   docker-compose logs mdnotes

   # Rebuild image
   docker-compose build --no-cache
   ```

4. **Lost data**

   ```bash
   # Check if volume exists
   docker volume ls | grep mdnotes-data

   # Inspect volume
   docker volume inspect mdnotes-data
   ```

### Health Check

The application includes a built-in health check:

```bash
# Check container health
docker-compose ps

# Manual health check
curl -f http://localhost:3000/api/health
```

## Production Deployment

For production deployments:

1. **Use proper secrets management**
2. **Configure reverse proxy (nginx)**
3. **Set up SSL/TLS certificates**
4. **Configure backup strategy**
5. **Monitor logs and health**

### Example nginx configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Support

For issues related to Docker setup, please check:

1. Docker and Docker Compose versions
2. Available disk space
3. Port conflicts
4. File permissions
5. Environment configuration
