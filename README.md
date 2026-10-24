# Mini Social Media Platform

A modern full-stack social media web application built with **React**, **Tailwind CSS v4**, **Node.js**, **Express.js**, and **MongoDB**.

---

## Phase 1: Project Setup & Architecture

This phase establishes the project foundation, directory structure, environment configuration, Express server, MongoDB connection via Mongoose, and data models.

### Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), React Router v7, Lucide Icons
- **Backend**: Node.js, Express.js, Mongoose, CORS, Dotenv, Bcryptjs
- **Database**: MongoDB (Local or MongoDB Atlas)

---

## Project Structure

```text
CodeAlpha_Mini-social-media-platform/
├── package.json              # Root package with helper scripts
├── .gitignore                # Root gitignore (ignores node_modules, .env, dist)
├── README.md                 # Project documentation
│
├── backend/
│   ├── .env                  # Backend environment variables (git-ignored)
│   ├── .env.example          # Environment template
│   ├── .gitignore            # Backend gitignore
│   ├── package.json          # Backend dependencies & scripts
│   └── src/
│       ├── config/
│       │   └── db.js         # Mongoose connection logic
│       ├── models/
│       │   ├── User.js       # User schema with bcrypt hashing & validation
│       │   ├── Post.js       # Post schema with User reference & likes
│       │   ├── Comment.js    # Comment schema referencing Post & User
│       │   └── index.js      # Barrel export for models
│       ├── routes/
│       │   └── healthRoutes.js # GET /api/health endpoint
│       ├── app.js            # Express app with CORS & JSON middlewares
│       └── server.js         # Server bootstrap & graceful shutdown
│
└── frontend/
    ├── .env                  # Frontend environment variables (git-ignored)
    ├── .env.example          # Frontend environment template
    ├── .gitignore            # Frontend gitignore
    ├── index.html            # HTML entry point with Plus Jakarta Sans typography
    ├── package.json          # Frontend dependencies & scripts
    ├── vite.config.js        # Vite config with @tailwindcss/vite plugin
    └── src/
        ├── components/
        │   ├── Navbar.jsx    # Sticky navigation bar
        │   └── Footer.jsx    # Footer with stack indicators
        ├── pages/
        │   ├── Home.jsx      # Phase 1 dashboard & live connectivity tester
        │   ├── HealthStatus.jsx # Detailed health payload inspector
        │   └── NotFound.jsx  # 404 handler
        ├── App.jsx           # React Router route definitions
        ├── index.css         # Tailwind CSS v4 import (@import "tailwindcss")
        └── main.jsx          # React DOM entry point
```

---

## Data Models Specification

### 1. User (`backend/src/models/User.js`)
- `username`: String (required, unique, trimmed, 3-30 chars, alphanumeric/underscore)
- `email`: String (required, unique, trimmed, lowercase, valid email regex format)
- `password`: String (required, minlength 6, hashed with bcrypt via pre-save hook, stripped in JSON output)
- `bio`: String (trimmed, max 200 chars, default: `""`)
- `profilePicture`: String (default: `""`)
- `followers`: Array of `ObjectId` referencing `User`
- `following`: Array of `ObjectId` referencing `User`
- `timestamps`: Automatic `createdAt` and `updatedAt`

### 2. Post (`backend/src/models/Post.js`)
- `author`: `ObjectId` referencing `User` (required, indexed)
- `content`: String (required, trimmed, max 1000 chars)
- `likes`: Array of `ObjectId` referencing `User`
- `timestamps`: Automatic `createdAt` and `updatedAt`

### 3. Comment (`backend/src/models/Comment.js`)
- `post`: `ObjectId` referencing `Post` (required, indexed)
- `author`: `ObjectId` referencing `User` (required, indexed)
- `content`: String (required, trimmed, max 500 chars)
- `timestamps`: Automatic `createdAt` and `updatedAt`

---

## Environment Setup

### Backend (`backend/.env`)
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/mini_social_media
CLIENT_URL=http://localhost:5174
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5001/api
```

---

## Running the Applications

### 1. Backend Server
In a terminal:
```bash
cd backend
npm install
npm run dev
```
Backend will start on `http://localhost:5001`.
- Health Check: `http://localhost:5001/api/health`

### 2. Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5174`.

### 3. Or from Root directory
```bash
npm run dev:backend    # Starts backend with nodemon
npm run dev:frontend   # Starts frontend with vite
```

---

## Verification

1. **Verify Backend Health Endpoint**:
   ```bash
   curl http://localhost:5001/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "Mini Social Media Platform API is healthy",
     "timestamp": "2026-10-24T...",
     "uptime": "...",
     "environment": "development",
     "database": {
       "status": "connected",
       "host": "127.0.0.1",
       "name": "mini_social_media"
     }
   }
   ```

2. **Verify Frontend**:
   Open `http://localhost:5174` in your browser. The Phase 1 Overview dashboard will query the health endpoint and show the live connectivity status and data model architecture.
