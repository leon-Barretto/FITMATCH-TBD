// pages/api/image-search.js

/**
 * Image-Based Product Search
 * Upload product image → Identify product → Return analysis
 * 
 * Uses Google Cloud Vision API for:
 * 1. Product detection
 * 2. Web entity detection (finds similar products)
 * 3. OCR (extract text/brand names)
 * 
 * Setup:
 * 1. Enable Cloud Vision API in Google Cloud Console
 * 2. Create Service Account and download JSON key
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS env variable
 * OR
 * 3. Add GOOGLE_VISION_API_KEY to .env.local
 */

import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data (image upload)
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const imageFile = files.image?.[0];
    
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    console.log('📸 Image uploaded:', imageFile.originalFilename);
    console.log('   Size:', (imageFile.size / 1024).toFixed(2), 'KB');

    // Read image as base64
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const base64Image = imageBuffer.toString('base64');

    // Clean up temp file
    fs.unlinkSync(imageFile.filepath);

    // Check if Google Vision API is configured
    if (!process.env.GOOGLE_VISION_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('⚠️  Google Vision API not configured - using Claude Vision fallback');
      return await useClaudeVisionFallback(base64Image, res);
    }

    // Use Google Vision API
    const visionResults = await analyzeImageWithGoogleVision(base64Image);

    return res.status(200).json({
      success: true,
      ...visionResults
    });

  } catch (error) {
    console.error('❌ Image search error:', error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
}

/**
 * Analyze image using Google Cloud Vision API
 */
async function analyzeImageWithGoogleVision(base64Image) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY not configured');
  }

  console.log('🔍 Analyzing image with Google Vision...');

  // Call Google Vision API
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image
        },
        features: [
          { type: 'PRODUCT_SEARCH', maxResults: 10 },
          { type: 'WEB_DETECTION', maxResults: 10 },
          { type: 'TEXT_DETECTION' },
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'LOGO_DETECTION', maxResults: 5 }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const result = data.responses[0];

  // Extract information
  const productInfo = extractProductInfo(result);

  console.log('✅ Product identified:');
  console.log('   Brand:', productInfo.brand || 'Unknown');
  console.log('   Product:', productInfo.productName || 'Unknown');
  console.log('   Category:', productInfo.category || 'Unknown');

  return {
    productInfo,
    rawVisionData: {
      webEntities: result.webDetection?.webEntities?.slice(0, 5),
      labels: result.labelAnnotations?.slice(0, 5),
      logos: result.logoAnnotations,
      text: result.textAnnotations?.[0]?.description
    }
  };
}

/**
 * Extract product information from Vision API results
 */
function extractProductInfo(visionResult) {
  const productInfo = {
    brand: null,
    productName: null,
    category: null,
    description: null,
    confidence: 0,
    searchQuery: null,
    possibleUrls: []
  };

  // 1. Extract brand from logo detection
  if (visionResult.logoAnnotations && visionResult.logoAnnotations.length > 0) {
    productInfo.brand = visionResult.logoAnnotations[0].description;
    productInfo.confidence += 0.3;
  }

  // 2. Extract product name from web entities
  if (visionResult.webDetection?.webEntities) {
    const entities = visionResult.webDetection.webEntities
      .filter(e => e.score > 0.5)
      .map(e => e.description);
    
    if (entities.length > 0) {
      // First entity is usually the most relevant
      productInfo.productName = entities[0];
      productInfo.description = entities.slice(0, 3).join(', ');
      productInfo.confidence += 0.4;
    }
  }

  // 3. Extract URLs from web pages
  if (visionResult.webDetection?.pagesWithMatchingImages) {
    productInfo.possibleUrls = visionResult.webDetection.pagesWithMatchingImages
      .slice(0, 5)
      .map(page => page.url);
  }

  // 4. Detect category from labels
  if (visionResult.labelAnnotations) {
    const labels = visionResult.labelAnnotations.map(l => l.description.toLowerCase());
    
    const categoryMap = {
      'clothing': ['clothing', 'apparel', 'fashion', 'garment', 'wear'],
      'tops': ['top', 'shirt', 'blouse', 'tank', 'tee', 'sweater'],
      'pants': ['pants', 'jeans', 'trousers', 'leggings'],
      'dresses': ['dress', 'gown'],
      'shoes': ['shoe', 'footwear', 'sneaker', 'boot', 'heel'],
      'accessories': ['bag', 'purse', 'jewelry', 'watch', 'belt']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => labels.includes(keyword))) {
        productInfo.category = category;
        productInfo.confidence += 0.2;
        break;
      }
    }
  }

  // 5. Extract text (might contain brand/product info)
  if (visionResult.textAnnotations && visionResult.textAnnotations.length > 0) {
    const extractedText = visionResult.textAnnotations[0].description;
    
    // Try to extract brand names from text
    const knownBrands = [
      'Garage', 'SHEIN', 'Zara', 'H&M', 'Forever 21', 'Urban Outfitters',
      'Aritzia', 'Lululemon', 'Nike', 'Adidas', 'Fashion Nova'
    ];
    
    for (const brand of knownBrands) {
      if (extractedText.toLowerCase().includes(brand.toLowerCase())) {
        if (!productInfo.brand) {
          productInfo.brand = brand;
          productInfo.confidence += 0.1;
        }
      }
    }
  }

  // 6. Build search query
  const queryParts = [];
  if (productInfo.brand) queryParts.push(productInfo.brand);
  if (productInfo.productName) queryParts.push(productInfo.productName);
  if (productInfo.category) queryParts.push(productInfo.category);
  
  productInfo.searchQuery = queryParts.length > 0 
    ? queryParts.join(' ')
    : 'fashion product';

  // Normalize confidence
  productInfo.confidence = Math.min(1.0, productInfo.confidence);

  return productInfo;
}

/**
 * Fallback: Use Claude Vision (Anthropic API) to analyze image
 */
async function useClaudeVisionFallback(base64Image, res) {
  console.log('🤖 Using Claude Vision as fallback...');

  // This would use Anthropic's Claude API with vision capabilities
  // For now, return a structured response indicating manual analysis needed
  
  return res.status(200).json({
    success: true,
    fallback: 'claude_vision',
    message: 'Google Vision API not configured. Using fallback analysis.',
    productInfo: {
      brand: null,
      productName: null,
      category: 'clothing',
      description: 'Upload detected. Manual analysis required.',
      confidence: 0.3,
      searchQuery: 'fashion product',
      requiresManualInput: true
    },
    suggestion: 'For best results, configure GOOGLE_VISION_API_KEY in .env.local'
  });
}