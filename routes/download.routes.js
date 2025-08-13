// routes/download.routes.js
// Defines the API endpoints for the application.

import express from 'express';
import { processScribdUrl, downloadFile } from '../controllers/downloadscribd.controller.js';

const router = express.Router();

/**
 * @route   POST /api/process-url
 * @desc    Receives a Scribd URL, processes it, and returns a download link.
 * @access  Public
 */
router.post('/process-url', processScribdUrl);

/**
 * @route   GET /api/download-file/:filename
 * @desc    Allows the user to download the generated PDF file.
 * @access  Public
 */
router.get('/download-file/:filename', downloadFile);


export default router;
