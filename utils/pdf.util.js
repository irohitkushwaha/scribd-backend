// utils/pdf.util.js
// Contains the function for creating a PDF from a list of images.

import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Creates a PDF from an array of image buffers.
 * @param {Buffer[]} imageBuffers - An array of buffers containing the screenshot image data.
 * @param {string} outputPdfPath - The path where the final PDF will be saved.
 * @returns {Promise<void>} A promise that resolves when the PDF has been created.
 */
export function createPdfFromImages(imageBuffers, outputPdfPath) {
    return new Promise((resolve, reject) => {
        // Create a new PDF document. We set autoFirstPage to false because
        // we will add pages manually inside the loop.
        const doc = new PDFDocument({ autoFirstPage: false });

        // Pipe the PDF document to a writable stream to save it to a file.
        const writeStream = fs.createWriteStream(outputPdfPath);
        doc.pipe(writeStream);

        // Handle success and error events for the stream
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);

        // Loop through each of the screenshot image buffers
        for (const imageBuffer of imageBuffers) {
            try {
                // The image buffer is passed directly to pdfkit.
                // pdfkit will automatically determine its dimensions.
                const image = doc.openImage(imageBuffer);
                
                // Add a new page with dimensions matching the image
                doc.addPage({
                    size: [image.width, image.height],
                    margin: 0,
                });

                // Place the image on the page, fitting it to the whole page
                doc.image(image, 0, 0, {
                    fit: [image.width, image.height],
                    align: 'center',
                    valign: 'center'
                });
            } catch (error) {
                console.warn(`Could not process an image buffer. Skipping. Error: ${error.message}`);
            }
        }

        // Finalize the PDF and close the stream
        doc.end();
    });
}
