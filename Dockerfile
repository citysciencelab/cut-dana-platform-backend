# Create container for running mobility-backend
FROM node:16-alpine

RUN mkdir -p /usr/app/story-backend/dist
WORKDIR /usr/app/story-backend

# Copy mobility-backend sources
COPY package.json index.js package-lock.json ./
COPY routes ./routes
COPY controllers ./controllers
COPY prisma ./prisma

# Install and run mobility-backend
RUN npm install --no-optional

EXPOSE 80
EXPOSE 443
CMD npm start
