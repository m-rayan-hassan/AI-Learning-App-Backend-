FROM node:20-slim

# Install system dependencies:
# - Chromium: for puppeteer-real-browser (headed mode)
# - FFmpeg: for fluent-ffmpeg (audio/video stitching)
# - Xvfb + X11 libs: virtual display for headed Chrome (required by puppeteer-real-browser)
# - Fonts: proper text rendering in recordings
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    xvfb \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer config — use system Chromium, skip bundled download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create required temp directories
RUN mkdir -p uploads temp_audio temp_video public/videos

EXPOSE 3000

CMD ["node", "index.js"]