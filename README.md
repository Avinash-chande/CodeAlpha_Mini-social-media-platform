# Mini Social Media Platform

A full-stack Mini Social Media Platform built with React, Vite, Tailwind CSS v4, Node.js, Express.js, and MongoDB.

---

## Project Structure

```text
CodeAlpha_Mini-social-media-platform/
├── .gitignore
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── db.js            # MongoDB connection setup
│       ├── models/
│       │   ├── User.js          # User schema & password hashing
│       │   ├── Post.js          # Post schema & references
│       │   ├── Comment.js       # Comment schema & references
│       │   └── index.js         # Model exports
│       ├── routes/
│       │   └── healthRoutes.js  # GET /api/health
│       ├── app.js               # Express application configuration
│       └── server.js            # Server entry point
└── frontend/
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── vite.config.js           # Vite configuration with @tailwindcss/vite
    └── src/
        ├── App.jsx              # React Router setup & base layout
        ├── index.css            # Tailwind CSS v4 entrypoint
        └── main.jsx             # React entry point
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (verified on v24.13.0)
- **MongoDB**: Local MongoDB instance running on port `27017` or MongoDB Atlas URI

### 2. Backend Setup

```bash
cd backend

# Install dependencies (already installed during initial setup)
npm install

# Verify environment variables (.env is preconfigured)
# PORT=5000
# MONGO_URI=mongodb://127.0.0.1:27017/mini_social_media
# CLIENT_URL=http://localhost:5173

# Start development server
npm run dev

# Or start production server
npm start
```

Backend runs on: `http://localhost:5000`
Health check endpoint: `http://localhost:5000/api/health`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (already installed during initial setup)
npm install

# Start Vite development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## Phase 1 Verification

- **Frontend**: React + Vite + Tailwind CSS v4 (`@tailwindcss/vite`) + React Router (`react-router-dom`)
- **Backend**: Express + CORS + JSON middleware + Mongoose
- **Database**: Connected to MongoDB
- **Endpoint**: `GET /api/health` returns status `200` with uptime and database status
- **Mongoose Models**:
  - `User`: Username, email (unique), password (hashed with bcrypt), bio, profilePicture, followers, following, timestamps.
  - `Post`: Author (`User` ref), content, likes (`User` ref array), timestamps.
  - `Comment`: Post (`Post` ref), author (`User` ref), content, timestamps.
