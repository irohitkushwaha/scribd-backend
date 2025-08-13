// // utils/puppeteer.util.js
// // Contains the function for browser automation and screenshotting.

// // Import puppeteer-extra and the stealth plugin
// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// // Apply the stealth plugin
// puppeteer.use(StealthPlugin());

// /**
//  * Scrolls through a Scribd page, takes screenshots of each page element,
//  * and returns them as an array of buffers along with the document title.
//  * @param {string} url - The Scribd document URL.
//  * @returns {Promise<{imageBuffers: Buffer[], title: string}>} A promise that resolves to an object containing image buffers and the title.
//  */
// export async function takePageScreenshots(url) {
//     const browser = await puppeteer.launch({
//         headless: "new",
//         args: [
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-dev-shm-usage',
//             '--disable-accelerated-2d-canvas',
//             '--disable-gpu'
//         ]
//     });
    
//     const page = await browser.newPage();
    
//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
//     await page.setViewport({ width: 1280, height: 1920 });
    
//     try {
//         console.log('Navigating to URL with stealth...');
//         await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
//         console.log('Navigation successful.');
//     } catch (error) {
//         await browser.close();
//         throw new Error(`Failed to navigate to the page: ${error.message}`);
//     }
    
//     // The initial pop-up handler has been removed as per your request.
//     // The stealth plugin often handles these implicitly.
    
//     try {
//         console.log('Waiting for the document viewer to become visible...');
//         await page.waitForSelector('.outer_page.only_ie6_border', { visible: true, timeout: 30000 });
//         console.log('Document viewer is visible.');
//     } catch (error) {
//         await browser.close();
//         throw new Error('The document viewer did not load in time. The page may be protected or require a login.');
//     }

//     let title = 'Scribd_Document';
//     try {
//         const titleSelector = 'h1[data-e2e="doc_page_title"] p';
//         await page.waitForSelector(titleSelector, { timeout: 5000 });
//         title = await page.$eval(titleSelector, el => el.textContent.trim());
//         console.log(`📄 Found title: "${title}"`);
//     } catch (error) {
//         console.warn('Could not find the document title, using a default name.');
//     }

//     await page.evaluate(() => {
//         const selectorsToHide = [
//             '.between_page_portal_root',
//             '#header_search_input',
//             '.auto__doc_page_body_header',
//             '._3_fjIV',
//             '._1GApkd'
//         ];
//         selectorsToHide.forEach(selector => {
//             document.querySelectorAll(selector).forEach(el => el.style.display = 'none');
//         });
//     });
//     console.log('Hid ad containers and other non-content elements.');


//     const imageBuffers = [];
//     let pageNum = 1;

//     while (true) {
//         const pageElements = await page.$$('.outer_page.only_ie6_border');
        
//         for (let i = imageBuffers.length; i < pageElements.length; i++) {
//             const element = pageElements[i];
//             try {
//                 await element.waitForSelector('.text_layer, .image_layer', { timeout: 10000 });

//                 await page.evaluate(async (el) => {
//                     const textLayerReady = new Promise((resolve) => {
//                         const checkText = () => {
//                             const textLayer = el.querySelector('.text_layer');
//                             if (textLayer && textLayer.children.length > 0) {
//                                 resolve();
//                             } else {
//                                 setTimeout(checkText, 100);
//                             }
//                         };
//                         checkText();
//                     });

//                     const images = Array.from(el.querySelectorAll('.image_layer img'));
//                     images.forEach(img => {
//                         const realSrc = img.getAttribute('orig');
//                         if (realSrc && !img.src.includes(realSrc)) {
//                             img.src = realSrc;
//                         }
//                     });
//                     const imagePromises = images.map(img => {
//                         if (img.complete && img.naturalWidth > 1) return Promise.resolve();
//                         return new Promise((resolve) => {
//                             img.addEventListener('load', resolve);
//                             img.addEventListener('error', () => resolve());
//                         });
//                     });
                    
//                     await Promise.all([textLayerReady, ...imagePromises]);
//                 }, element);
                
//                 const buffer = await element.screenshot();
//                 imageBuffers.push(buffer);
//                 console.log(`📸 Captured page ${pageNum}`);
//                 pageNum++;
//             } catch (e) {
//                 console.warn(`Could not screenshot element for page ${pageNum}. Skipping. Error: ${e.message}`);
//             }
//         }
        
//         // --- SPEED OPTIMIZATION ---
//         // Instead of a fixed wait, we now check if more pages have loaded after scrolling.
//         // This is much faster as it doesn't wait unnecessarily.
//         const previousPageCount = pageElements.length;
//         await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        
//         try {
//             // Wait until the number of page elements on the page is greater than the previous count.
//             await page.waitForFunction(
//                 (selector, count) => document.querySelectorAll(selector).length > count,
//                 { timeout: 10000 }, // Wait a maximum of 10 seconds for new pages
//                 '.outer_page.only_ie6_border',
//                 previousPageCount
//             );
//         } catch (e) {
//             console.log('No new pages loaded after scroll. Assuming end of document.');
//             break; // Exit the loop if no new pages appear after the timeout
//         }
//     }

//     await browser.close();
//     return { imageBuffers, title };
// }



// utils/puppeteer.util.js
// Contains the function for browser automation and screenshotting.

// Import puppeteer-extra and the stealth plugin
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply the stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Scrolls through a Scribd page, takes screenshots of each page element,
 * and returns them as an array of buffers along with the document title.
 * @param {string} url - The Scribd document URL.
 * @returns {Promise<{imageBuffers: Buffer[], title: string}>} A promise that resolves to an object containing image buffers and the title.
 */
export async function takePageScreenshots(url) {
    let browser; // Define browser in the outer scope to access it in the finally block

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // OPTIMIZATION: Block non-essential resources to speed up page load and reduce memory usage.
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            const blockedTypes = ['stylesheet', 'font', 'media', 'image'];

            if (blockedTypes.includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 1920 });

        console.log('Navigating to URL with stealth...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('Navigation successful.');


        console.log('Waiting for the document viewer to become visible...');
        await page.waitForSelector('.outer_page.only_ie6_border', { visible: true, timeout: 30000 });
        console.log('Document viewer is visible.');


        let title = 'Scribd_Document';
        try {
            const titleSelector = 'h1[data-e2e="doc_page_title"] p';
            await page.waitForSelector(titleSelector, { timeout: 5000 });
            title = await page.$eval(titleSelector, el => el.textContent.trim());
            console.log(`📄 Found title: "${title}"`);
        } catch (error) {
            console.warn('Could not find the document title, using a default name.');
        }

        await page.evaluate(() => {
            const selectorsToHide = [
                '.between_page_portal_root', '#header_search_input',
                '.auto__doc_page_body_header', '._3_fjIV', '._1GApkd'
            ];
            selectorsToHide.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.style.display = 'none');
            });
        });
        console.log('Hid ad containers and other non-content elements.');

        const imageBuffers = [];
        let pageNum = 1;

        while (true) {
            const pageElements = await page.$$('.outer_page.only_ie6_border');

            for (let i = imageBuffers.length; i < pageElements.length; i++) {
                const element = pageElements[i];
                try {
                    await element.waitForSelector('.text_layer, .image_layer', { timeout: 10000 });

                    // This complex evaluation block is specific to Scribd's lazy-loading mechanism
                    await page.evaluate(async (el) => {
                        const textLayerReady = new Promise((resolve) => {
                            const checkText = () => {
                                const textLayer = el.querySelector('.text_layer');
                                if (textLayer && textLayer.children.length > 0) resolve();
                                else setTimeout(checkText, 100);
                            };
                            checkText();
                        });

                        const images = Array.from(el.querySelectorAll('.image_layer img'));
                        images.forEach(img => {
                            const realSrc = img.getAttribute('orig');
                            if (realSrc && !img.src.includes(realSrc)) img.src = realSrc;
                        });
                        const imagePromises = images.map(img => {
                            if (img.complete && img.naturalWidth > 1) return Promise.resolve();
                            return new Promise((resolve) => {
                                img.addEventListener('load', resolve, { once: true });
                                img.addEventListener('error', () => resolve(), { once: true });
                            });
                        });
                        await Promise.all([textLayerReady, ...imagePromises]);
                    }, element);
                    
                    // OPTIMIZATION: Use JPEG format for smaller file sizes and faster encoding.
                    const buffer = await element.screenshot({
                        type: 'jpeg',
                        quality: 85 // A good balance between size and quality
                    });
                    
                    imageBuffers.push(buffer);
                    console.log(`📸 Captured page ${pageNum}`);
                    pageNum++;
                } catch (e) {
                    console.warn(`Could not screenshot element for page ${pageNum}. Skipping. Error: ${e.message}`);
                }
            }
            
            const previousPageCount = pageElements.length;
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

            try {
                // Wait for new page elements to load after scrolling
                await page.waitForFunction(
                    (selector, count) => document.querySelectorAll(selector).length > count,
                    { timeout: 10000 },
                    '.outer_page.only_ie6_border',
                    previousPageCount
                );
            } catch (e) {
                console.log('No new pages loaded after scroll. Assuming end of document.');
                break; // Exit the loop
            }
        }

        return { imageBuffers, title };

    } catch (error) {
        console.error("An error occurred during the Puppeteer process:", error);
        // Re-throw the error so the calling function knows the process failed
        throw error;
    } finally {
        // STABILITY: This block ensures the browser is always closed, preventing zombie processes.
        if (browser) {
            await browser.close();
            console.log('Browser closed successfully.');
        }
    }
}