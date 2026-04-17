FROM node:18-alpine

WORKDIR /app

# Copy backend package files first to install dependencies
COPY agroinsight/backend/package*.json ./agroinsight/backend/

# Install backend dependencies
RUN npm install --prefix agroinsight/backend

# Copy the full application code
COPY agroinsight ./agroinsight

WORKDIR /app/agroinsight/backend

EXPOSE 3000
CMD ["npm", "start"]
