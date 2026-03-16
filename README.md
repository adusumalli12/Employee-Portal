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

## 🐳 Docker Setup

You can run the entire stack (App + MongoDB) using Docker:

1. **Build and Start**:
   ```bash
   docker-compose up -d --build
   ```
2. **Access**: The app will be available at `http://localhost:3000`.

## ☁️ Deployment to AWS EC2

To deploy this project to an AWS EC2 instance, follow these steps:

### 1. Launch an EC2 Instance
- Use **Ubuntu 22.04 LTS** (Amazon Machine Image).
- Choose at least a **t3.small** or **t2.medium** (recommended for builds).
- In **Security Groups**, allow:
    - `TCP Port 22` (SSH)
    - `TCP Port 80` (HTTP)
    - `TCP Port 3000` (App Port)

### 2. Install Docker & Docker Compose
Connect to your instance via SSH and run:
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and log back in for changes to take effect
```

### 3. Clone and Deploy
```bash
git clone <your-repo-url>
cd <repo-folder>
# Create and edit your .env file
nano .env
# Start the application
docker-compose up -d --build
```

### 4. Access the App
Navigate to `http://<your-ec2-public-ip>:3000` in your browser.

## 📚 Documentation

The best way to explore the system is by using the integrated dashboard:

1. **Dashboard**: Navigate to `/dashboard.html` after logging in to access all features.
2. **Setup Guide**: Follow the **Getting Started** section above to set up your environment.

## 🔒 Security Notice

Please ensure that you do not commit your `.env` file to version control and that all sensitive keys are properly managed.

---

*Built with ❤️ for a superior employee management experience.*
