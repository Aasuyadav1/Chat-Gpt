# ChatGPT Clone

A powerful ChatGPT clone featuring advanced AI capabilities:

## Features

- **Image Generation**: Generate images from text prompts using integrated AI models.
- **Web Search**: Augment responses with real-time web search for up-to-date information.
- **Vision Model**: Analyze and interpret images using vision AI models.
- **Code Generation**: Write, explain, and debug code in multiple programming languages.
- **Pin Thread**: Pin important chat threads for quick access and organization.

# Environment Variables

The following environment variables are required for this project. Create a `.env` file in the root directory and add these variables with your own values:

```
# MongoDB connection string
MONGODB_URI=your_mongodb_uri

# Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth secret
NEXTAUTH_SECRET=your_nextauth_secret

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Mem0 API Key
MEM0_API_KEY=your_mem0_api_key

# Tavily API Key
TAVILY_API_KEY=your_tavily_api_key

# Cloudinary (for uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

Be sure to replace the placeholder values with your actual credentials and secrets. Never commit your real `.env` file to version control.