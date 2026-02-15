// test-youtube.js - Test YouTube API
async function testYouTube() {
  console.log('🧪 Testing YouTube API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/youtube-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: 'Snatch Booty Terry Pants',
        brandName: 'Garage Clothing',
        maxResults: 5
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS!\n');
      console.log(`Found ${data.videos.length} videos\n`);
      
      data.videos.forEach((video, i) => {
        console.log(`${i + 1}. ${video.title}`);
        console.log(`   Channel: ${video.channelTitle}`);
        console.log(`   Views: ${video.views} | Likes: ${video.likes}`);
        console.log(`   URL: ${video.url}`);
        console.log(`   Sponsored: ${video.isSponsored ? 'YES ⚠️' : 'NO ✅'}`);
        console.log('');
      });
    } else {
      console.log('❌ Error:', data.error);
      console.log('\nNote: If API key not set, it will return mock data');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\n💡 Make sure your dev server is running:');
    console.log('   npm run dev');
  }
}

testYouTube();
