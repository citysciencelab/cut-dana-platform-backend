# Use the official Bun image as a base
FROM oven/bun:1.1 as build

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb to the working directory
COPY package.json bun.lockb ./

# Copy the rest of the application files
COPY . .

# Command to run the application
RUN bun i && echo "" | bun run build
