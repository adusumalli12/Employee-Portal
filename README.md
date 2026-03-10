# 🚀 Premium Employee Management Portal

A modern, high-performance Employee Management System built with a robust TypeScript backend and a premium, glassmorphic frontend experience.

## ✨ Key Features

- **Modern TypeScript Architecture**: Fully type-safe backend for improved reliability and developer experience.
- **Premium Auth Suite**: A stunning, glassmorphic authentication flow (Signup, Login, Forgot/Reset Password, and OTP Verification).
- **Responsive Design**: Flawless experience across laptops, tablets, and mobile devices.
- **Micro-animations**: Smooth, interactive transitions used throughout the UI to provide a high-end feel.
- **Secure Identity Verification**: Integrated Email and SMS (Twilio) verification methods.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose.
- **Frontend**: Plain HTML, Vanilla CSS, TypeScript.
- **Security**: JWT Authentication, Bcrypt password hashing, OTP-based identity verification.
- **Integrations**: Twilio (SMS), Nodemailer (Email).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/) (running locally or via Atlas)

### Installation

1. Clone the repository and navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables in `.env`.

### Development

To start the server in development mode with hot-reloading:

```bash
npm run dev
```

The server will be available at `http://localhost:5000`.

### Build

To compile the entire project (Backend & Frontend):

```bash
npm run build
```

## 📚 Documentation

The best way to explore the system is by using the integrated dashboard:

1. **Dashboard**: Navigate to `/dashboard.html` after logging in to access all features.
2. **Setup Guide**: Follow the **Getting Started** section above to set up your environment.

## 🔒 Security Notice

Please ensure that you do not commit your `.env` file to version control and that all sensitive keys are properly managed.

---

*Built with ❤️ for a superior employee management experience.*
