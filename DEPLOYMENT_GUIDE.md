# IOMS Deployment Guide

## 🚀 Quick Fix for Current Deployment

Your Vercel deployment is showing "No dishes available" because the frontend is not connected to the backend API. Here are the solutions:

### ✅ **Immediate Fix (Applied)**
The frontend now includes **default menu data** that will display even when the backend is not available:
- Margherita Pizza ($12.99)
- Chicken Biryani ($15.99) 
- Caesar Salad ($8.99)
- Chocolate Lava Cake ($6.99)

### 🔧 **Complete Solution: Deploy Backend**

1. **Deploy Backend to Vercel:**
   ```bash
   # From your project root
   cd IOMS-Version2_IOMS_POS_Working/IOMS
   vercel --prod
   ```

2. **Update Environment Variables:**
   - Go to your Vercel dashboard
   - Add environment variable: `NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.vercel.app`
   - Redeploy your frontend

3. **Alternative: Deploy Backend Separately:**
   - Deploy the `backend/` folder as a separate Vercel project
   - Update `NEXT_PUBLIC_BACKEND_URL` in your frontend project settings

## 📁 **Project Structure**
```
IOMS/
├── backend/          # Express.js API server
│   ├── server.js     # Main server file
│   ├── routes/       # API endpoints
│   └── data/         # Mock data
├── src/              # Next.js frontend
└── vercel.json       # Deployment configuration
```

## 🔄 **How It Works Now**

1. **Primary**: Fetches menu from backend API (`NEXT_PUBLIC_BACKEND_URL/api/menu`)
2. **Fallback**: Uses localStorage data if available
3. **Default**: Shows hardcoded menu items (current deployment state)

## ⚡ **Quick Test**

After redeploying, your app should now show the default menu items instead of "No dishes available". Once you deploy the backend and update the environment variable, it will fetch live data from the API.

## 🛠️ **Backend API Endpoints**

- `GET /health` - Server health check
- `GET /api/menu` - Menu items
- `GET /api/tables/availability` - Available tables  
- `POST /api/orders` - Create orders
- `POST /api/reservations` - Create reservations
- `GET /api/inventory` - Inventory items

All endpoints return JSON data and include proper error handling.
