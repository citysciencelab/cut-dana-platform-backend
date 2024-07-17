FROM node:16-alpine

# Create app directory
WORKDIR /usr/app/story-backend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose ports
EXPOSE 80
EXPOSE 443

# Start the application
CMD ["node", "index.js"]
