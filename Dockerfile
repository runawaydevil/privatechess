# Use a Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the project
COPY . .

# Expose the port
EXPOSE 8743

# Start the server
CMD ["node", "server.js"] 