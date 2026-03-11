# Praxis Deployment Guide

This guide covers three different methods to deploy your Praxis React/Vite application: Vercel (Cloud Hosting), Docker (Self-Hosting), and Capacitor (Native Mobile App).

If you are just looking to get your app online quickly and easily, Vercel is the recommended path. If you are comfortable managing your own server infrastructure, Docker is a powerful option. If you want a mobile app version, use Capacitor.

---

## 🚀 Path 1: Vercel (Easiest & Free Cloud Hosting)

Vercel is built specifically for frontend frameworks like React and Vite. It handles builds, scaling, and SSL certificates automatically.

### Prerequisites:
- A GitHub/GitLab/Bitbucket account with your code pushed to a repository.
- A free Vercel account.

### Steps:
1. **Push your code to GitHub.** Ensure your project is pushed to a remote repository.
2. **Go to Vercel (https://vercel.com/)** and log in with your GitHub account.
3. Click on **"Add New..." > "Project"**.
4. **Import your repository**. Vercel will ask for permission to access your GitHub repositories. Grant it and select your Praxis repository.
5. **Configure Project.**
   - Vercel automatically detects that you are using Vite! The Framework Preset should say "Vite".
   - **Environment Variables:** This is the most crucial step. You MUST add your Supabase credentials here so the production app can connect to your database.
     - Add `VITE_SUPABASE_URL` with your Supabase URL.
     - Add `VITE_SUPABASE_ANON_KEY` with your Supabase Anon Key.
6. Click **Deploy**. 

Vercel will build the `dist` folder and provide you with a live `your-project.vercel.app` URL. Any future pushes to your `main` branch will automatically trigger a new deployment.

---

## 🐳 Path 2: Docker (Best for VPS / Self-Hosting)

Docker allows you to package your app and its environment into a standardized unit (a container) for software development. This is ideal if you are hosting on DigitalOcean, AWS EC2, or a home server.

### Prerequisites:
- Docker installed on your host machine.

### Steps:
To dockerize a Vite React app, we use a "multi-stage build". Stage 1 uses Node to build the static `dist` files. Stage 2 uses Nginx (a fast web server) to serve those static files.

**1. Create a `Dockerfile` in your project root:**
```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Note: In a real CI/CD pipeline, pass these as build args.
# For local building, ensure your .env file is present or pass them explicitly.
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine
# Copy the build output from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html
# (Optional) Copy a custom nginx.conf if you need routing rules for React Router
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**2. Build the Docker Image:**
Run this command in your terminal. Note: Because Vite embeds env vars at *build time*, if you are running this build command yourself, make sure your `.env` file with Supabase keys is present in the local directory so the build process can access them.
```bash
docker build -t praxis-app .
```

**3. Run the Docker Container:**
```bash
docker run -d -p 8080:80 praxis-app
```
Your app will now be running locally on `http://localhost:8080`.

---

## 📱 Path 3: Capacitor (Converting to Native Mobile App)

Capacitor bridges your web app with native SDKs, allowing it to run as a compiled app on Android and iOS devices.

### Prerequisites:
- Android Studio (for Android builds)
- Xcode (for iOS builds - Requires a Mac)

### Steps:

**1. Install Capacitor:**
Open your terminal in the project root and run:
```bash
npm install @capacitor/core
npm install @capacitor/cli --save-dev
```

**2. Initialize Capacitor:**
```bash
npx cap init
```
- **App name:** Praxis
- **App Package ID:** `com.yourname.praxis` (e.g., `com.aakash.praxis`)
- **Web asset directory:** `dist` (This is very important! It tells Capacitor where Vite outputs your built app).

**3. Add Platforms:**
Install the specific platform packages:
```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

**4. The Build Cycle (How to test updates):**
Every time you make a change to your React code, you must:
1. Build the web project: `npm run build`
2. Sync the built `dist` folder into your native projects: `npx cap sync`

**5. Open and Run in IDE:**
To test on a simulator or device, you open the respective IDE.
- For Android: `npx cap open android` (Opens Android Studio)
- For iOS: `npx cap open ios` (Opens Xcode)

From the IDE, you just press the "Play/Run" button to deploy the app to your device or emulator!
