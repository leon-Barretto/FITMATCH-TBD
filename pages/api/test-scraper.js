// test-scraper.js - Test Review Scraper
async function testScraper() {
  console.log('🕷️  Testing Review Scraper...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/scrape-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productUrl: 'https://www.garageclothing.com/ca/p/snatch-booty-terry-pants/10009801618X.html'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS!\n');
      console.log(`Scraped ${data.reviews.length} reviews`);
      console.log(`Source: ${data.source}\n`);
      
      if (data.analysis) {
        console.log('📊 Analysis:');
        console.log(`   Average Rating: ${data.analysis.avgRating}/5`);
        console.log(`   Verified Reviews: ${data.analysis.verifiedCount}`);
        console.log(`   Sponsored: ${data.analysis.sponsoredCount} (${data.analysis.sponsoredPercentage}%)`);
        console.log('');
      }
      
      console.log('📝 Sample Reviews:\n');
      data.reviews.slice(0, 3).forEach((review, i) => {
        console.log(`${i + 1}. ${review.author} - ${review.rating}⭐`);
        console.log(`   ${review.title || review.text.substring(0, 80)}...`);
        if (review.height || review.size) {
          console.log(`   📏 ${review.height || ''} | Size: ${review.size || ''}`);
        }
        console.log(`   Verified: ${review.verified ? '✅' : '❌'} | Sponsored: ${review.isSponsored ? '⚠️' : '✅'}`);
        console.log('');
      });
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testScraper();
