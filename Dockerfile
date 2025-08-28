# Deno Docker deployment
FROM denoland/deno:1.40.0

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Cache dependencies
RUN deno cache src/main.ts

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["deno", "task", "start"]
