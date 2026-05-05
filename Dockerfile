# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory
WORKDIR /usr/src/app

# Install system dependencies and Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire project into the container
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r bot/requirements.txt

# Make the start script executable
RUN chmod +x start.sh

# Expose the port the Node server runs on
EXPOSE 3000

# Run the start script
CMD ["./start.sh"]
