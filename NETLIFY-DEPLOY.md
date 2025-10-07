# Netlify Deployment Guide

## Required Environment Variables

### GEMINI_API_KEY
- **Description**: Google Gemini AI API key for feed optimization features
- **How to get**: Visit https://aistudio.google.com/app/apikey
- **Where to set**: Netlify Dashboard > Site Settings > Environment Variables

## Build Configuration

The project includes a `netlify.toml` file with optimized settings:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18+
- **SPA Redirects**: Configured for React Router
- **Asset Optimization**: Enabled

## Deployment Steps

1. **Connect Repository**:
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect to GitHub: `https://github.com/MetaSitesStudio/farm-feed-care-ai`

2. **Configure Build Settings**:
   - Build command: `npm run build` (auto-detected)
   - Publish directory: `dist` (auto-detected)
   - Node version: 18+ (configured in netlify.toml)

3. **Set Environment Variables**:
   - Go to Site Settings > Environment Variables
   - Add: `GEMINI_API_KEY` = [Your Gemini API Key]

4. **Deploy**:
   - Click "Deploy site"
   - Wait for build to complete
   - Your app will be live at your Netlify URL

## Features After Deployment

✅ **Fully Functional Features**:
- Animal selection and feed parameters
- Natural ingredient mixing interface
- Commercial feed cost analysis
- Nutritional tracking and targets
- Multi-language support (EN/TL/CEB)
- Responsive design

🔑 **AI Features (Requires API Key)**:
- Feed optimization with Gemini AI
- Vaccination schedule recommendations
- Alternative therapy suggestions

## Troubleshooting

- **Build fails**: Check Node version is 18+
- **AI features don't work**: Verify GEMINI_API_KEY is set correctly
- **Routing issues**: netlify.toml includes SPA redirect rules

## Security Notes

- API key is securely handled by Netlify
- Frontend-only application (no backend required)
- Environment variables are build-time only (not exposed to client)