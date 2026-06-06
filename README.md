# Cognivio AI — Backend

The API server for **Cognivio AI**, an AI-powered SaaS learning platform that transforms documents into interactive study experiences.

---

## Overview

This backend powers all of Cognivio AI's core capabilities — from user authentication and document processing to AI content generation, media pipelines, and subscription billing. Built as a modular Express.js API with a focus on security, scalability, and clean separation of concerns.

---

## ⚙️ Core Capabilities

- **Authentication & Authorization** — Email/password with OTP verification, Google OAuth, JWT-based session management
- **Document Processing** — Upload, storage, retrieval, and management of user study materials
- **AI Content Generation** — Summaries, flashcards, quizzes, concept explanations, and contextual chat powered by Google Gemini
- **Voice & Audio Pipeline** — Voice overview and podcast generation using ElevenLabs text-to-speech synthesis
- **Video Generation Pipeline** — Automated video creation using server-side rendering with Puppeteer and FFmpeg
- **Subscription Billing** — Full LemonSqueezy integration with checkout, plan management, and webhook lifecycle handling
- **Progress Tracking** — User activity analytics, study metrics, and performance data aggregation

---

## 🏗️ Technical Architecture

### Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express 5** | HTTP framework with async middleware support |
| **MongoDB + Mongoose** | NoSQL database with schema-driven ODM |
| **JWT + Passport** | Token-based auth with Google OAuth strategy |
| **Joi** | Request validation and schema enforcement |
| **Multer + Cloudinary** | File upload handling and CDN-backed media storage |
| **Google Gemini** | AI content generation (summaries, quizzes, chat, etc.) |
| **ElevenLabs** | AI voice synthesis for audio overviews and podcasts |
| **Puppeteer + FFmpeg** | Server-side browser rendering and video encoding |
| **LemonSqueezy SDK** | Subscription billing and webhook processing |
| **Nodemailer** | Transactional email (OTP, password reset) |

### Architecture Patterns

- **MVC-Inspired** — Controllers handle request logic, models define data schemas, routes declare API surface
- **Middleware Pipeline** — Layered security (Helmet, HPP, CORS, rate limiting) and auth middleware
- **Service Utilities** — Dedicated helper modules for AI generation, media processing, email, and payments
- **Webhook-Driven Billing** — LemonSqueezy events processed via cryptographically verified webhook handlers

### Key Design Decisions

- **Modular Controllers**: Each domain (auth, documents, AI, flashcards, quizzes, payments, progress) has its own controller — clean boundaries, easy to extend
- **AI Pipeline Isolation**: All AI interactions are centralized in utility modules, allowing provider swaps without touching business logic
- **Media Generation as Background Jobs**: Voice and video generation runs asynchronously with progress tracking, handling long-running FFmpeg operations gracefully
- **Security-First Middleware Stack**: Every request passes through Helmet (HTTP headers), HPP (parameter pollution), CORS (origin whitelisting), and rate limiting before reaching any controller

---

## 🔐 Security Posture

| Layer | Implementation |
|---|---|
| **Authentication** | JWT tokens with secure cookie-based refresh flow |
| **OAuth** | Google sign-in via Passport strategy |
| **Input Validation** | Joi schemas on all request payloads |
| **HTTP Security** | Helmet headers, HPP protection |
| **Rate Limiting** | Configurable per-route request throttling |
| **CORS** | Strict origin whitelisting |
| **Webhook Verification** | HMAC signature validation on payment events |
| **File Uploads** | Type/size restrictions with Multer middleware |

---

## 🧠 AI & Media Pipeline

```
Document Upload
       │
       ▼
┌──────────────────┐
│  Google Gemini    │ ──► Summaries, Flashcards, Quizzes, Chat, Concepts
└──────────────────┘
       │
       ▼
┌──────────────────┐
│   ElevenLabs     │ ──► Voice Overview, Podcast Overview (audio files)
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Puppeteer+FFmpeg │ ──► Video Overview (rendered slides → video encoding)
└──────────────────┘
       │
       ▼
┌──────────────────┐
│   Cloudinary     │ ──► CDN storage and delivery of generated media
└──────────────────┘
```

---

## 📂 Codebase Organization

```
server/
├── config/             # External service configuration
├── controllers/        # Request handlers (one per domain)
├── database/           # MongoDB connection setup
├── middlewares/         # Auth guards, error handling, security
├── models/             # Mongoose schemas and data models
├── routes/             # API route definitions
├── utils/              # AI, media, payment, and email utilities
├── index.js            # Application entry point
└── package.json
```

---

## License

Proprietary software. See the [root README](../README.md#license) for details.
