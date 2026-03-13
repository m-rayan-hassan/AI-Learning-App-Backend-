# Cognivio AI Backend

The backend API for **Cognivio AI**, an AI-powered learning platform that converts documents into interactive study experiences.

This service handles authentication, document processing, AI generation, flashcards, quizzes, contextual chat, `Voice Overview`, `Podcast Overview`, `Video Overview`, billing, and progress tracking.

---

## Features

- REST API built with Express 5
- JWT-protected authentication and authorization
- Google OAuth support
- Password reset via email
- Document upload and storage integration
- AI summary generation
- Flashcard generation and review APIs
- Quiz generation, submission, and results APIs
- Contextual AI chat and concept explanation APIs
- `Voice Overview`, `Podcast Overview`, and `Video Overview` generation flows
- Progress dashboard endpoints
- Paddle subscription and webhook handling
- MongoDB persistence with Mongoose
- Security middleware: Helmet, HPP, CORS, and rate limiting

---

## Tech Stack

- Node.js
- Express 5
- MongoDB + Mongoose
- JWT
- Passport + Google OAuth
- Joi
- Nodemailer
- Multer
- Cloudinary
- Google Gemini
- ElevenLabs
- Paddle
- Puppeteer + FFmpeg utilities

---

## Project Structure

```text
server/
├─ config/                   # External service configuration
├─ controllers/             # Route controller logic
├─ database/                # Database connection setup
├─ middlewares/             # Auth and error middleware
├─ models/                  # Mongoose models
├─ routes/                  # API route modules
├─ uploads/                 # Runtime uploads / generated files
├─ utils/                   # AI, payment, email, media helpers
├─ Dockerfile               # Container setup
├─ index.js                 # Server entry point
└─ package.json             # Scripts and dependencies
```

---

## API Modules

This backend exposes modules for:

- `/api/auth`
- `/api/documents`
- `/api/ai`
- `/api/flashcards`
- `/api/quizzes`
- `/api/progress`
- `/api/payments`
- `/webhook` for Paddle events

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB database
- FFmpeg installed and available in PATH

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the `server` directory.

You can start from `.env.example` and update the values.

```env
PORT=8080
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database-name>
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_client_id_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
GAMMA_API_KEY=your_gamma_api_key
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
PADDLE_PRICE_ID_PLUS=pri_xxx
PADDLE_PRICE_ID_PRO=pri_xxx
PADDLE_PRICE_ID_PREMIUM=pri_xxx
MAX_CONCURRENT_RECORDINGS=1
```

### Run in Development

```bash
npm run dev
```

### Run in Production

```bash
npm run start
```

---

## Available Scripts

- `npm run dev` — Start the API with Nodemon
- `npm run start` — Start the API with Node.js

---

## Backend Responsibilities

This repository is responsible for:

- Managing authentication and user access
- Processing document-related requests
- Generating AI-powered study content
- Handling media generation pipelines
- Storing and retrieving user learning data
- Managing subscriptions and payment webhooks
- Enforcing backend security and rate limits

---

## Deployment Notes

- Set `NODE_ENV=production` in production environments
- Use a secure MongoDB connection string
- Configure `CLIENT_URL` correctly for CORS
- Ensure FFmpeg is installed where media generation is used
- Store all API keys and secrets securely

---
