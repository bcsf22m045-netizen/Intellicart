<div align="center">

# �� NOVA — AI-Powered E-Commerce Platform

### *Smart Shopping, Reimagined*

[![Team](https://img.shields.io/badge/Team-Sigma%20Codes-blueviolet?style=for-the-badge)](https://github.com/UzayrSajjad/UTS-Web-Hackathon)
[![Stack](https://img.shields.io/badge/Stack-MERN-green?style=for-the-badge)](https://github.com/UzayrSajjad/UTS-Web-Hackathon)
[![AI](https://img.shields.io/badge/AI-Pollinations%20API-orange?style=for-the-badge)](https://pollinations.ai)

</div>

---

## 👥 Team — Sigma Codes

| Member | Role |
| --- | --- |
| **Uzair Sajjad** | Full-Stack Developer |

---

## 📖 About

**NOVA** is a full-featured, AI-powered e-commerce platform built with the **MERN stack**. What sets NOVA apart is its intelligent **AI Shopping Assistant** — a conversational chatbot that can browse products, manage your cart, negotiate discounts, and even place orders, all through natural language. The platform includes a customer-facing storefront, a dedicated admin panel, and a robust backend API.

---

## ✨ Features

### 🤖 AI Shopping Assistant (Chatbot)
- **Conversational Shopping** — Browse products, ask questions, and get recommendations via natural language.
- **AI Cart Management** — Add/remove items from cart through chat commands.
- **AI-Driven Checkout** — Place orders entirely through the chatbot with shipping address parsing.
- **Smart Discount Negotiation** — The AI can apply discounts within allowed price ranges (basePrice → minPrice).
- **Voice Assistant** — Speak to the chatbot with voice input support.
- **3D Spline Robot Avatar** — Interactive animated assistant powered by Spline.
- **Session Memory** — Maintains conversational context across messages.
- **Rate Limiting** — Prevents abuse with per-IP rate limiting.
- **Rich UI Cards** — Product cards, cart cards, order cards, discount cards, category cards rendered inline in chat.

### 🛍️ Customer Frontend
- Responsive, modern UI built with **React** and **Tailwind CSS**.
- Product browsing with search, filter, and sorting.
- Detailed product pages with variant selection (size, color, stock tracking).
- Shopping cart with real-time updates.
- Seamless checkout experience.
- Order tracking and order history.
- Product reviews and ratings.
- **Google OAuth** login and email/password authentication.
- Email verification with transactional emails via **Nodemailer**.
- Protected routes for authenticated users.
- Animated UI with **Framer Motion**.

### 🛠️ Admin Panel
- Manage products — add, edit, delete with image uploads.
- Category management.
- Order management — view and update order statuses.
- Customer reviews moderation.
- State management with **Redux Toolkit**.

### ⚙️ Backend API
- RESTful API built with **Express.js**.
- **JWT** + **Cookie-based** authentication with refresh tokens.
- **Google OAuth** integration via `google-auth-library`.
- Role-based access control (Admin vs User).
- Image uploads with **Cloudinary** + **Multer**.
- Input validation with **express-validator**.
- **MongoDB** with **Mongoose** ODM.
- AI services architecture: `geminiService`, `aiCartService`, `aiCheckoutService`, `discountService`.
- Product caching with TTL for AI chatbot performance.

---

## 🏗️ Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, React Router v6, Redux Toolkit, Tailwind CSS, Framer Motion, Axios, React Toastify, Spline 3D |
| **Admin Panel** | React 18, React Router v6, Redux Toolkit, Tailwind CSS, Axios |
| **Backend** | Node.js, Express.js, Mongoose, JWT, bcrypt, Multer, Nodemailer |
| **AI / Chatbot** | Pollinations API (OpenAI-compatible), Custom NLP Intent Parsing |
| **Database** | MongoDB Atlas |
| **Image Storage** | Cloudinary |
| **Auth** | JWT, Google OAuth 2.0, Email Verification |
| **Build Tools** | Vite, PostCSS, Autoprefixer, ESLint |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
NOVA/
├── frontend/          # Customer-facing React app
│   └── src/
│       ├── components/
│       │   ├── ChatBot/       # AI Shopping Assistant (14 components)
│       │   ├── Navbar.jsx
│       │   ├── Hero.jsx
│       │   ├── ProductItem.jsx
│       │   └── ...
│       ├── pages/
│       │   ├── auth/          # Login, Signup, Email Verification
│       │   ├── Collection.jsx
│       │   ├── Product.jsx
│       │   ├── Cart.jsx
│       │   ├── PlaceOrder.jsx
│       │   └── ...
│       ├── store/slices/      # Redux slices (auth, cart, chatbot, orders, reviews)
│       ├── services/          # Auth service layer
│       └── hooks/             # Custom React hooks
│
├── admin/             # Admin panel React app
│   └── src/
│       ├── components/
│       ├── pages/             # Add, Edit, List, Orders, Categories, Reviews
│       └── store/slices/      # Redux slices
│
├── backend/           # Express.js API server
│   ├── controllers/           # Route handlers (8 controllers)
│   ├── models/                # Mongoose schemas (5 models)
│   ├── routes/                # API route definitions (8 routers)
│   ├── services/              # AI services (gemini, cart, checkout, discount)
│   ├── middleware/             # Auth, validation, multer, admin
│   └── config/                # MongoDB, Cloudinary, Email config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**
- **MongoDB** Atlas account (or local MongoDB)
- **Cloudinary** account (for image uploads)
- **Google Cloud** project (for OAuth — optional)
- **SMTP credentials** (Gmail or any provider — for email verification)

### 1. Clone the Repository

```bash
git clone https://github.com/UzayrSajjad/UTS-Web-Hackathon.git
cd UTS-Web-Hackathon
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Admin Panel
cd ../admin
npm install
```

### 3. Environment Variables

Create a `.env` file in each directory:

#### `backend/.env`

```env
# Server
PORT=4000

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

# AI Chatbot (Pollinations API)
POLLINATIONS_API_KEY=your_pollinations_api_key
POLLINATIONS_MODEL=openai

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

#### `frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

#### `admin/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
```

### 4. Run the Application

Open **three separate terminals** and run each service:

```bash
# Terminal 1 — Backend (runs on port 4000)
cd backend
npm run server

# Terminal 2 — Frontend (runs on port 5173)
cd frontend
npm run dev

# Terminal 3 — Admin Panel (runs on port 5174)
cd admin
npm run dev
```

### 5. Access the App

| Service | URL |
| --- | --- |
| 🛍️ Frontend | [http://localhost:5173](http://localhost:5173) |
| 🛠️ Admin Panel | [http://localhost:5174](http://localhost:5174) |
| ⚙️ Backend API | [http://localhost:4000](http://localhost:4000) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/product/*` | Product CRUD operations |
| `POST` | `/api/cart/*` | Cart management |
| `POST` | `/api/order/*` | Order management |
| `GET` | `/api/category/*` | Category operations |
| `POST` | `/api/reviews/*` | Review CRUD |
| `POST` | `/api/chatbot/message` | AI Chatbot interaction |

---

## 🤖 AI Architecture

```
User Message
    │
    ▼
┌─────────────────────┐
│  Chatbot Controller  │  ← Session memory, rate limiting, context enrichment
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────────┐
│ Gemini │  │  Product &    │
│Service │  │ Category Cache│
└───┬────┘  └──────────────┘
    │
    ▼  (AI Response with Action Intents)
┌────────────────────────────┐
│     Action Router          │
├────────────────────────────┤
│ • aiCartService            │  ← Add/remove cart items
│ • aiCheckoutService        │  ← Place orders from cart
│ • discountService          │  ← Apply AI-negotiated discounts
└────────────────────────────┘
```

---

## 📜 License

This project is open source and available under the [ISC License](LICENSE).

---

<div align="center">

**Built with ❤️ by Sigma Codes**

</div>
