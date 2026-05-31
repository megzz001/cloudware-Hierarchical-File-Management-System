# cloudware-Hierarchical-File-Management-System
A full-stack cloud storage application that enables users to organize, store, and manage images within nested folders through an intuitive and scalable file management system. A production-ready Google Drive clone built with MongoDB, Express, React, and Node.js.

## 🚀 Live Demo

[![CloudWare Preview](Screenshot/Dashboead.png)](https://full-stack-ai-resume-analyzer-and-coic.onrender.com/)]

---

## Features

- **Authentication** — Register, login, logout with JWT
- **Folder Management** — Create, rename, delete folders with infinite nesting
- **Image Upload** — Drag & drop upload (JPG, PNG, WEBP, max 10MB)
- **Folder Size** — Recursive size calculation across all nested folders
- **Breadcrumb Navigation** — Full path display for nested folders
- **Tree Sidebar** — Expand/collapse folder tree
- **Search** — Search folders and images
- **Storage Analytics** — Doughnut chart of usage per folder
- **Dark Mode** — Full dark theme
- **User Isolation** — Every user sees only their own data

---

## Tech Stack

| Layer      | Technology                              |
|------------|------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, React Query|
| State      | Zustand                                  |
| Forms      | React Hook Form                          |
| HTTP       | Axios                                    |
| Charts     | Chart.js + react-chartjs-2              |
| Upload UX  | react-dropzone                           |
| Notifications | react-toastify                        |
| Backend    | Node.js, Express.js                      |
| Auth       | JWT + bcryptjs                           |
| Database   | MongoDB Atlas + Mongoose                 |
| File Upload| Multer                                   |

---

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- A free [MongoDB Atlas](https://cloud.mongodb.com) account

---

## Installation & Setup

### Step 1 — Clone / Download the project

```
driveclone/
├── backend/
└── frontend/
```

---

### Step 2 — Set up MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Create a database user (username + password)
4. Whitelist your IP (or use `0.0.0.0/0` for development)
5. Click **Connect → Connect your application**
6. Copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/driveclone?retryWrites=true&w=majority
   ```

---

### Step 3 — Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/driveclone?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here
JWT_EXPIRE=7d
NODE_ENV=development
```

---

### Step 4 — Install Backend Dependencies

```bash
cd backend
npm install
```

**Backend packages installed:**

| Package        | Purpose                          |
|----------------|----------------------------------|
| express        | Web framework                    |
| mongoose       | MongoDB ODM                      |
| jsonwebtoken   | JWT auth token generation        |
| bcryptjs       | Password hashing                 |
| multer         | File upload handling             |
| cors           | Cross-origin resource sharing    |
| dotenv         | Environment variable loading     |
| nodemon (dev)  | Auto-restart on file changes     |

---

### Step 5 — Configure Frontend Environment

```bash
cd frontend
cp .env.example .env
```

`.env` content (default works for local dev):

```env
VITE_API_URL=http://localhost:5000
```

---

### Step 6 — Install Frontend Dependencies

```bash
cd frontend
npm install
```

**Frontend packages installed:**

| Package                  | Purpose                          |
|--------------------------|----------------------------------|
| react, react-dom         | Core React library               |
| react-router-dom         | Client-side routing              |
| axios                    | HTTP client                      |
| @tanstack/react-query    | Server state management          |
| react-hook-form          | Form handling & validation       |
| zustand                  | Global state management          |
| react-toastify           | Toast notifications              |
| react-dropzone           | Drag & drop file upload          |
| chart.js                 | Chart rendering engine           |
| react-chartjs-2          | React wrapper for Chart.js       |
| tailwindcss              | Utility-first CSS framework      |
| vite                     | Build tool & dev server          |
| @vitejs/plugin-react     | Vite React plugin                |
| autoprefixer, postcss    | CSS processing                   |

---

### Step 7 — Run the Backend

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

### Step 8 — Run the Frontend

Open a **new terminal**:

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

---

### Step 9 (Optional) — Seed Demo Data

```bash
cd backend
npm run seed
```

This creates:
- **Demo account:** `demo@example.com` / `password123`
- Sample folders: Projects → React → Images/Assets, Node → APIs, Design Assets, Personal

---

## Folder Structure

```
driveclone/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, logout
│   │   ├── folderController.js    # CRUD + recursive size
│   │   └── imageController.js     # Upload, delete, search
│   ├── middleware/
│   │   ├── auth.js                # JWT verifyJWT middleware
│   │   └── multer.js              # File upload config
│   ├── models/
│   │   ├── User.js
│   │   ├── Folder.js
│   │   └── Image.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── folderRoutes.js
│   │   └── imageRoutes.js
│   ├── uploads/                   # Uploaded files (auto-created)
│   ├── seed.js                    # Demo data seeder
│   ├── server.js                  # Express app entry point
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js           # Axios instance + interceptors
    │   │   └── services.js        # All API calls
    │   ├── components/
    │   │   ├── dashboard/
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── Sidebar.jsx    # Folder tree
    │   │   │   └── StorageAnalytics.jsx
    │   │   ├── folder/
    │   │   │   ├── FolderCard.jsx
    │   │   │   └── CreateFolderModal.jsx
    │   │   └── image/
    │   │       ├── ImageCard.jsx
    │   │       └── UploadModal.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── FolderView.jsx
    │   │   └── Profile.jsx
    │   ├── store/
    │   │   └── index.js           # Zustand stores (auth + theme)
    │   ├── utils/
    │   │   └── index.js           # formatBytes, formatDate, etc.
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register    Register new user
POST   /api/auth/login       Login
POST   /api/auth/logout      Logout (JWT required)
GET    /api/auth/me          Get current user (JWT required)
```

### Folders (all require JWT)
```
GET    /api/folders          Get root or child folders (?parentFolder=id)
POST   /api/folders          Create folder {name, parentFolder}
GET    /api/folders/tree     Get full folder tree
GET    /api/folders/search   Search folders (?q=query)
GET    /api/folders/:id      Get folder + breadcrumbs
PUT    /api/folders/:id      Rename folder
DELETE /api/folders/:id      Delete folder + all contents
```

### Images (all require JWT)
```
POST   /api/images/upload          Upload image (multipart/form-data)
GET    /api/images/folder/:id      Get images in folder
GET    /api/images/recent          Recent 10 uploads
GET    /api/images/search          Search images (?q=query)
GET    /api/images/stats           Storage analytics
DELETE /api/images/:id             Delete image
```

---

## Deployment

### Backend → Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, select `backend/` folder
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all environment variables from `.env`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your repo, set Root Directory to `frontend/`
3. Add env variable: `VITE_API_URL=https://your-render-url.onrender.com`
4. Deploy

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on frontend | Make sure backend is running on port 5000 |
| `MongooseError` | Check your MONGODB_URI in `.env` |
| Images not showing | Verify `VITE_API_URL` points to your backend |
| CORS error | Add your frontend URL to `CLIENT_URL` in backend `.env` |
| Upload failing | Check `uploads/` folder exists in backend directory |
