# Use an official Node.js runtime as a base image
FROM node:18-alpine

# Create and set the working directory
WORKDIR /app

# Copy only files needed for installing dependencies (package.json, package-lock.json)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the remaining project files into the container
COPY . .

# Expose the port defined in your .env (defaults to 4000 here if not specified)
EXPOSE 4000

# Define the command to start your app
CMD ["npm", "run", "start"]