# 🚀 Loyalty Program System - Setup & Testing Guide

## 📋 System Overview

Your loyalty program consists of:

- **Backend**: Node.js/Express API (Port 3000)
- **Frontend**: React + Vite application (Port 5173)
- **Database**: MongoDB (Local)

## ✅ Current Status

✅ **Backend is running** on http://localhost:3000  
✅ **Frontend is running** on http://localhost:5173  
✅ **MongoDB connected** successfully  
✅ **Dependencies installed** for both frontend and backend

## 🔧 Prerequisites Checklist

Before running the system, ensure you have:

- [ ] **Node.js** (v16+ recommended, you have v20.17.0 ✅)
- [ ] **MongoDB** running locally on default port 27017 ✅
- [ ] **Git** (for version control)
- [ ] **Environment variables** configured

## 🚀 How to Start the System

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd "c:\Users\user\Desktop\Loyality\backend"

# Install dependencies (if not done)
npm install

# Create .env file with required variables (see .env.example)
# Copy .env.example to .env and fill in your values

# Start the backend server
npm run dev
```

**Backend should be accessible at:** http://localhost:3000

### 2. Frontend Setup

```powershell
# Navigate to frontend directory
cd "c:\Users\user\Desktop\Loyality\backend\frontend"

# Install dependencies (if not done)
npm install

# Start the frontend development server
npm run dev
```

**Frontend should be accessible at:** http://localhost:5173

## 🧪 Testing Your System

### Quick Health Check

Run the automated health check script:

```powershell
cd "c:\Users\user\Desktop\Loyality\backend"
node health-check.js
```

### Manual Testing

#### Backend Tests:

1. **Root Endpoint Test**

   - URL: http://localhost:3000
   - Expected: Welcome page with API prefix information

2. **API Endpoints Test**

   - URL: http://localhost:3000/api/v1/merchants
   - Expected: 401 Unauthorized (requires authentication)

3. **Database Connection**
   - Check console logs for "MongoDB Connected: localhost"

#### Frontend Tests:

1. **Development Server**

   - URL: http://localhost:5173
   - Expected: React application loads

2. **API Communication**
   - The frontend should attempt to communicate with backend
   - Check browser developer tools Network tab for API calls

### Using Browser Developer Tools

1. **Open Developer Tools** (F12)
2. **Check Console Tab** for any JavaScript errors
3. **Check Network Tab** to see API requests to backend
4. **Check Elements Tab** to verify React components are rendering

## 🔍 Troubleshooting Common Issues

### Backend Issues

**Issue**: Server won't start

- ✅ **Fixed**: File import typo in loyalityEngine.js (already resolved)
- Check if port 3000 is already in use
- Verify MongoDB is running

**Issue**: Database connection fails

- Ensure MongoDB is running: `mongod` command
- Check MONGO_URI in .env file
- Default: `mongodb://localhost:27017/loyalty_program`

**Issue**: Missing environment variables

- Copy `.env.example` to `.env`
- Fill in required values (see Environment Variables section)

### Frontend Issues

**Issue**: Vite engine warning

- ⚠️ Node.js version warning (non-critical, app still works)
- Consider updating Node.js to v20.19.0+ if needed

**Issue**: API calls failing

- Verify backend is running on port 3000
- Check VITE_API_URL in frontend/.env
- Look for CORS errors in browser console

## 🔐 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/loyalty_program

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password

# Salla Integration
SALLA_CLIENT_ID=your_salla_client_id
SALLA_CLIENT_SECRET=your_salla_client_secret
SALLA_WEBHOOK_SECRET=your_webhook_secret

# API Configuration
API_PREFIX=/api/v1
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Loyalfy Dashboard
```

## 📊 System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│    MongoDB      │
│   React + Vite  │     │  Node.js/Express│     │   Database      │
│   Port: 5173    │     │   Port: 3000    │     │   Port: 27017   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🛠️ Available Scripts

### Backend Scripts

- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not configured yet)

### Frontend Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔗 Key Endpoints

### Backend API Endpoints

- `GET /` - Welcome page
- `GET /api/v1/merchants` - Merchant management
- `GET /api/v1/customers` - Customer management
- `GET /api/v1/rewards` - Reward system
- `GET /api/v1/analytics` - Analytics data
- `POST /webhook` - Salla webhook handler

### Frontend Routes

- `/` - Dashboard
- `/customers` - Customer management
- `/rewards` - Reward configuration
- `/analytics` - Analytics dashboard
- `/settings` - System settings

## 🎯 Next Steps

1. **Configure Environment Variables**

   - Set up proper JWT secrets
   - Configure email settings
   - Add Salla API credentials

2. **Database Setup**

   - Create initial merchant account
   - Set up sample data (use scripts in `/scripts` folder)

3. **Authentication Testing**

   - Test login functionality
   - Verify JWT token handling

4. **API Integration**

   - Test all CRUD operations
   - Verify webhook endpoints

5. **Production Setup**
   - Configure production environment variables
   - Set up proper database
   - Configure production builds

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Run the health check script
3. Check console logs in both frontend and backend
4. Verify all environment variables are set correctly

---

**Current Status**: ✅ System is operational and ready for development!
