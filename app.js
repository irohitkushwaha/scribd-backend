// app.js
// Main entry point for the Express application.

import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Import the download routes
import downloadRoutes from './routes/download.routes.js';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors()); 


// --- Middleware ---
// Enable parsing of JSON in request bodies
app.use(express.json());
// Enable parsing of URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Serve the generated PDF files statically from the 'public/downloads' directory
app.use('/downloads', express.static(path.join(__dirname, 'public', 'downloads')));


// --- Create necessary directories on startup ---
// This ensures that our folders for temporary screenshots and final PDFs exist.
const screenshotsDir = path.join(__dirname, 'temp', 'screenshots');
const downloadsDir = path.join(__dirname, 'public', 'downloads');

if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}


// --- Routes ---
// Use the download routes for any requests to '/api'
app.use('/api', downloadRoutes);


// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
