// // controllers/downloadscribd.controller.js
// // Handles the core logic for processing requests and generating responses.

// import path from 'path';
// import fs from 'fs';
// import { v4 as uuidv4 } from 'uuid';
// import { fileURLToPath } from 'url';
// import { takePageScreenshots } from '../utils/puppeteer.util.js';
// import { createPdfFromImages } from '../utils/pdf.util.js';

// // ES6 module equivalent of __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /**
//  * Main controller to process the Scribd URL.
//  */
// export const processScribdUrl = async (req, res) => {
//     const { url } = req.body;

//     // Basic URL validation
//     if (!url || !url.includes('scribd.com')) {
//         return res.status(400).json({ success: false, message: 'Please provide a valid Scribd URL.' });
//     }

//     // Generate a unique ID for this request to manage the final PDF file
//     const requestId = uuidv4();
//     const outputDir = path.join(__dirname, '..', 'public', 'downloads');
//     const outputPdfName = `${requestId}.pdf`;
//     const outputPdfPath = path.join(outputDir, outputPdfName);

//     try {
//         console.log(`[${requestId}] Starting screenshot process for URL: ${url}`);
        
//         // Step 1: Use Puppeteer to take screenshots of each page as in-memory buffers
//         const imageBuffers = await takePageScreenshots(url);

//         if (imageBuffers.length === 0) {
//             throw new Error('Could not capture any pages. The document might be protected or the URL is incorrect.');
//         }

//         console.log(`[${requestId}] Successfully captured ${imageBuffers.length} pages. Now creating PDF.`);

//         // Step 2: Use pdfkit to combine the image buffers into a single PDF
//         await createPdfFromImages(imageBuffers, outputPdfPath);

//         console.log(`[${requestId}] PDF created successfully at ${outputPdfPath}`);

//         // Step 3: Return the download URL to the user
//         const downloadUrl = `/downloads/${outputPdfName}`;
        
//         res.status(200).json({
//             success: true,
//             message: 'PDF generated successfully!',
//             downloadUrl: downloadUrl
//         });

//     } catch (error) {
//         console.error(`[${requestId}] An error occurred during the process:`, error);
        
//         res.status(500).json({
//             success: false,
//             message: error.message || 'An internal server error occurred.'
//         });
//     }
// };

// /**
//  * Controller to handle the actual file download.
//  */
// export const downloadFile = (req, res) => {
//     const { filename } = req.params;
//     const filePath = path.join(__dirname, '..', 'public', 'downloads', filename);

//     if (fs.existsSync(filePath)) {
//         res.download(filePath, (err) => {
//             if (err) {
//                 console.error("Error during file download:", err);
//             }
//             // Clean up the file after download is initiated
//             fs.unlink(filePath, (unlinkErr) => {
//                 if (unlinkErr) console.error(`Error deleting PDF file ${filename}:`, unlinkErr);
//                 else console.log(`Cleaned up downloaded PDF: ${filename}`);
//             });
//         });
//     } else {
//         res.status(404).send('File not found.');
//     }
// };



// controllers/downloadscribd.controller.js
// Handles the core logic for processing requests and generating responses.

import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { takePageScreenshots } from '../utils/puppeteer.util.js';
import { createPdfFromImages } from '../utils/pdf.util.js';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main controller to process the Scribd URL.
 */
export const processScribdUrl = async (req, res) => {
    const { url } = req.body;

    // Basic URL validation
    if (!url || !url.includes('scribd.com')) {
        return res.status(400).json({ success: false, message: 'Please provide a valid Scribd URL.' });
    }

    const requestId = uuidv4();
    const outputDir = path.join(__dirname, '..', 'public', 'downloads');
    // Sanitize the title for use in a filename
    let safeFilename = 'document'; 
    let documentTitle = 'Scribd Document';

    try {
        console.log(`[${requestId}] Starting screenshot process for URL: ${url}`);
        
        // Step 1: Use Puppeteer to get both the screenshots and the title
        const { imageBuffers, title } = await takePageScreenshots(url);
        
        documentTitle = title; // Store the original title
        // Create a safe filename by removing illegal characters
        safeFilename = title.replace(/[^a-z0-9_ ]/gi, '').trim().replace(/\s+/g, '_');


        if (imageBuffers.length === 0) {
            throw new Error('Could not capture any pages. The document might be protected or the URL is incorrect.');
        }

        console.log(`[${requestId}] Successfully captured ${imageBuffers.length} pages. Now creating PDF.`);
        
        const outputPdfName = `${safeFilename}_${requestId.slice(0, 8)}.pdf`;
        const outputPdfPath = path.join(outputDir, outputPdfName);

        // Step 2: Use pdfkit to combine the image buffers into a single PDF
        await createPdfFromImages(imageBuffers, outputPdfPath);

        console.log(`[${requestId}] PDF created successfully at ${outputPdfPath}`);

        // Step 3: Return the download URL and the title to the user
        const downloadUrl = `/downloads/${outputPdfName}`;
        
        res.status(200).json({
            success: true,
            message: 'PDF generated successfully!',
            downloadUrl: downloadUrl,
            title: documentTitle // NEW: Include the title in the response
        });

    } catch (error) {
        console.error(`[${requestId}] An error occurred during the process:`, error);
        
        res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred.'
        });
    }
};

/**
 * Controller to handle the actual file download.
 */
export const downloadFile = (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'public', 'downloads', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error("Error during file download:", err);
            }
            // Clean up the file after download is initiated
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error(`Error deleting PDF file ${filename}:`, unlinkErr);
                else console.log(`Cleaned up downloaded PDF: ${filename}`);
            });
        });
    } else {
        res.status(404).send('File not found.');
    }
};
