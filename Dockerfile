FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package.json ./
RUN npm install --production

# Copy everything
COPY . .

# Install dashboard dependencies
WORKDIR /app/dashboard
RUN npm install --production
RUN npm run build

WORKDIR /app

# Expose dashboard port
EXPOSE 3000

# Default: run the pi_pulse daemon + dashboard
CMD ["sh", "-c", "node setup/pi_pulse_daemon.js start & cd dashboard && npm start"]
