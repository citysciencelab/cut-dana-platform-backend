# Use the official Bun image as a base
FROM oven/bun:1.1

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb to the working directory
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 8000

RUN bunx prisma generate

# Command to run the application
CMD ["bun", "run", "index.ts"]
