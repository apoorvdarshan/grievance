# Grievance Portal - Dual Environment Setup

## 🏗️ Project Structure

This project supports both **local development** and **Vercel production** deployment:

### Local Development Files:
- `server.js` - Express server for localhost
- `api.js` - API client for localhost
- `script.js` - Frontend JavaScript for localhost
- `lib/mongodb.js` - MongoDB connection for localhost
- `.env` - Local environment variables

### Vercel Production Files:
- `api/` - Serverless functions
- `public/` - Static files served by Vercel
- `lib/mongodb-vercel.js` - MongoDB connection for Vercel
- `vercel.json` - Vercel configuration

## 🚀 Local Development

```bash
npm start
# Runs Express server on http://localhost:3000
```

## 🌐 Vercel Deployment

1. **Connect to Vercel:**
   - Link your GitHub repository to Vercel
   - Vercel will automatically deploy from `/public` folder

2. **Environment Variables:**
   Add in Vercel dashboard:
   ```
   MONGODB_URI=mongodb+srv://apoorv:Apoorv090909@cluster0.mycx7em.mongodb.net/grievance_portal?retryWrites=true&w=majority
   ```

3. **Deployment:**
   - Push to GitHub
   - Vercel auto-deploys using serverless functions

## 📂 File Mapping

| Local Development | Vercel Production |
|------------------|-------------------|
| `server.js` | `api/*.js` (serverless) |
| `index.html` | `public/index.html` |
| `api.js` | `public/api-vercel.js` |
| `script.js` | `public/script-vercel.js` |
| `lib/mongodb.js` | `lib/mongodb-vercel.js` |

## 🔄 Benefits

- ✅ **Local development**: Full Express server with hot reload
- ✅ **Production**: Serverless functions that scale automatically
- ✅ **Same database**: MongoDB Atlas for both environments
- ✅ **No conflicts**: Separate file structures