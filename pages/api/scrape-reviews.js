// pages/api/scrape-reviews.js

/**
 * Web Scraper for Product Reviews
 * Extracts REAL customer reviews from brand websites
 * 
 * Supports:
 * - Garage Clothing (garageclothing.com)
 * - SHEIN (shein.com)
 * - Zara (zara.com)
 * 
 * Uses Playwright for browser automation
 * 
 * Setup:
 * npm install playwright
 * npx playwright install chromium
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productUrl } = req.body;

  if (!productUrl) {
    return res.status(400).json({ error: 'Product URL required' });
  }

  try {
    console.log('🕷️  Scraping reviews from:', productUrl);

    // Detect brand from URL
    const brand = detectBrand(productUrl);
    console.log('   Brand detected:', brand);

    // Check if Playwright is available
    let playwright;
    try {
      playwright = require('playwright');
    } catch (e) {
      console.warn('⚠️  Playwright not installed - using mock data');
      return res.status(200).json({
        success: true,
        reviews: getMockReviews(brand),
        source: 'mock',
        message: 'Install Playwright for real scraping: npm install playwright'
      });
    }

    // Scrape reviews based on brand
    let reviews = [];
    
    if (brand === 'Garage Clothing') {
      reviews = await scrapeGarageClothing(playwright, productUrl);
    } else if (brand === 'SHEIN') {
      reviews = await scrapeShein(playwright, productUrl);
    } else if (brand === 'Zara') {
      reviews = await scrapeZara(playwright, productUrl);
    } else {
      return res.status(400).json({
        error: 'Unsupported brand',
        message: 'Currently supports: Garage Clothing, SHEIN, Zara'
      });
    }

    console.log(`✅ Scraped ${reviews.length} reviews`);

    // Analyze reviews
    const analysis = analyzeReviews(reviews);

    return res.status(200).json({
      success: true,
      reviews,
      analysis,
      brand,
      source: 'scraped',
      scrapedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    return res.status(500).json({ 
      error: error.message,
      fallback: getMockReviews('Unknown')
    });
  }
}

/**
 * Detect brand from URL
 */
function detectBrand(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('garageclothing.com')) return 'Garage Clothing';
  if (urlLower.includes('shein.com')) return 'SHEIN';
  if (urlLower.includes('zara.com')) return 'Zara';
  if (urlLower.includes('hm.com')) return 'H&M';
  if (urlLower.includes('fashionnova.com')) return 'Fashion Nova';
  
  return 'Unknown';
}

/**
 * Scrape Garage Clothing reviews
 * Uses Yotpo review system
 */
async function scrapeGarageClothing(playwright, productUrl) {
  console.log('🏬 Scraping Garage Clothing...');
  
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(productUrl, { waitUntil: 'networkidle' });
    
    // Wait for Yotpo reviews to load
    await page.waitForSelector('.yotpo-review', { timeout: 10000 }).catch(() => {
      console.log('   No reviews found on page');
    });
    
    // Extract reviews
    const reviews = await page.$$eval('.yotpo-review', (elements) => {
      return elements.map(el => {
        const rating = el.querySelectorAll('.yotpo-icon-star.rating-star.yotpo-icon-star-filled').length;
        const authorEl = el.querySelector('.yotpo-user-name');
        const titleEl = el.querySelector('.content-title');
        const textEl = el.querySelector('.content-review');
        const verifiedEl = el.querySelector('.yotpo-verified-buyer');
        const dateEl = el.querySelector('.yotpo-review-date');
        
        // Extract custom fields (height, weight, size, etc.)
        const customFields = {};
        const fieldElements = el.querySelectorAll('.yotpo-review-field');
        fieldElements.forEach(field => {
          const label = field.querySelector('.field-label')?.textContent?.trim();
          const value = field.querySelector('.field-value')?.textContent?.trim();
          if (label && value) {
            customFields[label.toLowerCase()] = value;
          }
        });
        
        return {
          author: authorEl?.textContent?.trim() || 'Anonymous',
          rating,
          title: titleEl?.textContent?.trim() || '',
          text: textEl?.textContent?.trim() || '',
          verified: verifiedEl !== null,
          date: dateEl?.textContent?.trim() || '',
          
          // Body measurements (if available)
          height: customFields.height || null,
          weight: customFields.weight || null,
          size: customFields['size purchased'] || customFields.size || null,
          fit: customFields.fit || null,
          bodyType: customFields['body type'] || null,
          
          // Check for sponsored content
          isSponsored: detectSponsoredReview(titleEl?.textContent, textEl?.textContent)
        };
      });
    });
    
    await browser.close();
    return reviews;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Scrape SHEIN reviews
 */
async function scrapeShein(playwright, productUrl) {
  console.log('🛍️  Scraping SHEIN...');
  
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(productUrl, { waitUntil: 'networkidle' });
    
    // SHEIN uses their own review system
    await page.waitForSelector('.j-review-item, .reviews-item', { timeout: 10000 }).catch(() => {
      console.log('   No reviews found on page');
    });
    
    const reviews = await page.$$eval('.j-review-item, .reviews-item', (elements) => {
      return elements.map(el => {
        const ratingEl = el.querySelector('.she-rating-star__container, .rate');
        const rating = ratingEl 
          ? ratingEl.querySelectorAll('.she-icon-star_fill, .icon-star-fill').length 
          : 0;
        
        const authorEl = el.querySelector('.reviews-name, .user-name');
        const textEl = el.querySelector('.reviews-content, .comment-content');
        const dateEl = el.querySelector('.reviews-date, .date');
        const verifiedEl = el.querySelector('.verified-purchase, .she-badge-verified');
        
        // Extract measurements from text if mentioned
        const text = textEl?.textContent?.trim() || '';
        const height = extractMeasurement(text, /height[:\s]*([0-9]+'[0-9]+"?|[0-9]+cm)/i);
        const weight = extractMeasurement(text, /weight[:\s]*([0-9]+\s*lbs?|[0-9]+\s*kg)/i);
        const size = extractMeasurement(text, /size[:\s]*(XXS|XS|S|M|L|XL|XXL|[0-9]+)/i);
        
        return {
          author: authorEl?.textContent?.trim() || 'Anonymous',
          rating,
          title: '',
          text,
          verified: verifiedEl !== null,
          date: dateEl?.textContent?.trim() || '',
          height,
          weight,
          size,
          fit: extractFit(text),
          bodyType: null,
          isSponsored: false // SHEIN reviews are usually organic
        };
      });
    });
    
    await browser.close();
    return reviews;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Scrape Zara reviews
 */
async function scrapeZara(playwright, productUrl) {
  console.log('👗 Scraping Zara...');
  
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(productUrl, { waitUntil: 'networkidle' });
    
    // Zara uses Bazaarvoice
    await page.waitForSelector('.bv-content-item', { timeout: 10000 }).catch(() => {
      console.log('   No reviews found on page');
    });
    
    const reviews = await page.$$eval('.bv-content-item', (elements) => {
      return elements.map(el => {
        const ratingEl = el.querySelector('.bv-rating');
        const rating = ratingEl ? parseInt(ratingEl.getAttribute('aria-label')) : 0;
        
        const authorEl = el.querySelector('.bv-author-name');
        const titleEl = el.querySelector('.bv-content-title');
        const textEl = el.querySelector('.bv-content-summary');
        const verifiedEl = el.querySelector('.bv-badge-verified');
        const dateEl = el.querySelector('.bv-content-datetime');
        
        return {
          author: authorEl?.textContent?.trim() || 'Anonymous',
          rating,
          title: titleEl?.textContent?.trim() || '',
          text: textEl?.textContent?.trim() || '',
          verified: verifiedEl !== null,
          date: dateEl?.textContent?.trim() || '',
          height: null,
          weight: null,
          size: null,
          fit: null,
          bodyType: null,
          isSponsored: false
        };
      });
    });
    
    await browser.close();
    return reviews;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Detect sponsored reviews
 */
function detectSponsoredReview(title, text) {
  if (!title && !text) return false;
  
  const combined = `${title} ${text}`.toLowerCase();
  const sponsoredKeywords = [
    'gifted', '#gifted', 'received free',
    '#ad', 'partner', 'ambassador',
    'discount code', 'promo code'
  ];
  
  return sponsoredKeywords.some(keyword => combined.includes(keyword));
}

/**
 * Extract measurement from text using regex
 */
function extractMeasurement(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract fit feedback from text
 */
function extractFit(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('runs small') || textLower.includes('size up')) {
    return 'Runs small';
  }
  if (textLower.includes('runs large') || textLower.includes('size down')) {
    return 'Runs large';
  }
  if (textLower.includes('true to size') || textLower.includes('perfect fit')) {
    return 'True to size';
  }
  
  return null;
}

/**
 * Analyze scraped reviews
 */
function analyzeReviews(reviews) {
  if (reviews.length === 0) {
    return {
      avgRating: 0,
      totalReviews: 0,
      verifiedCount: 0,
      sponsoredCount: 0,
      ratingDistribution: {},
      commonFit: null,
      bodyTypeBreakdown: {}
    };
  }
  
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = (totalRating / reviews.length).toFixed(1);
  const verifiedCount = reviews.filter(r => r.verified).length;
  const sponsoredCount = reviews.filter(r => r.isSponsored).length;
  
  // Rating distribution
  const ratingDistribution = {};
  for (let i = 1; i <= 5; i++) {
    ratingDistribution[i] = reviews.filter(r => r.rating === i).length;
  }
  
  // Most common fit
  const fits = reviews.map(r => r.fit).filter(Boolean);
  const fitCounts = {};
  fits.forEach(fit => {
    fitCounts[fit] = (fitCounts[fit] || 0) + 1;
  });
  const commonFit = Object.keys(fitCounts).length > 0
    ? Object.entries(fitCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;
  
  // Body type breakdown
  const bodyTypes = reviews.map(r => r.bodyType).filter(Boolean);
  const bodyTypeBreakdown = {};
  bodyTypes.forEach(type => {
    bodyTypeBreakdown[type] = (bodyTypeBreakdown[type] || 0) + 1;
  });
  
  return {
    avgRating: parseFloat(avgRating),
    totalReviews: reviews.length,
    verifiedCount,
    sponsoredCount,
    sponsoredPercentage: ((sponsoredCount / reviews.length) * 100).toFixed(1),
    ratingDistribution,
    commonFit,
    bodyTypeBreakdown
  };
}

/**
 * Mock reviews fallback
 */
function getMockReviews(brand) {
  return [
    {
      author: 'Sarah M.',
      rating: 5,
      title: 'Perfect fit!',
      text: 'This is amazing! The fit is perfect and the quality exceeded my expectations. I\'m 5\'4" and 150 lbs, ordered a medium. Runs true to size!',
      verified: true,
      date: '2 weeks ago',
      height: '5\'4"',
      weight: '150 lbs',
      size: 'M',
      fit: 'True to size',
      bodyType: 'Curvy',
      isSponsored: false
    },
    {
      author: 'Emma L.',
      rating: 4,
      title: 'Good but thin material',
      text: 'Love the style but the material is pretty thin. Still cute though!',
      verified: true,
      date: '1 week ago',
      height: '5\'7"',
      weight: '135 lbs',
      size: 'S',
      fit: 'True to size',
      bodyType: 'Athletic',
      isSponsored: false
    },
    {
      author: 'Jessica K.',
      rating: 5,
      title: 'Obsessed! #gifted',
      text: 'Thank you ' + brand + ' for sending me this! Use code JESS10 for 10% off! 💕',
      verified: false,
      date: '3 days ago',
      height: null,
      weight: null,
      size: null,
      fit: null,
      bodyType: null,
      isSponsored: true
    }
  ];
}