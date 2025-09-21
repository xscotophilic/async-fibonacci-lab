# Async Fibonacci Lab: Client

This directory contains the web application that provides a user interface for the Async Fibonacci Lab system.

Features:
- Submit Fibonacci index calculation requests
- View real-time calculation status and results
- Display the most requested Fibonacci index
- Poll for computation results with live updates

## Getting Started

- Navigate to the client directory

### Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) (which includes `npm`) installed on your system.

### Step 1 - Install Dependencies

```bash
npm install
```

### Step 2 - Configure Environment Variables

Copy the example file and fill in all values:

```bash
cp .env.example .env
```

Open the newly created .env file and fill in all of the variables shown below

```
VITE_API_URL=http://localhost:5000
```

- **`VITE_API_URL`** - The base URL for the backend API server that handles Fibonacci calculation requests.

> **Security:** The `.env` file is excluded by `.gitignore` and should **never** be committed to version control.

### Step 3 - Run the Development Server

```bash
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173) to access the Fibonacci calculator interface.

### Step 4 - Build for Production

```bash
npm run build
npm run preview
```

## Deployment

The app is a standard **SvelteKit** project and can be deployed to any static hosting environment or Node.js server.

1. Ensure you have set the same environment variables (`VITE_*`) on the hosting platform.
2. Build the project:
   ```bash
   npm run build
   ```
3. Deploy the generated `build/` directory to your static hosting service, or serve it with:
   ```bash
   npm run preview
   ```
