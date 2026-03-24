const https = require('https');
const fs = require('fs');
const d3 = require('d3-geo');

const GEOJSON_URL = 'https://raw.githubusercontent.com/shuklaneerajdev/IndiaStateTopojsonFiles/master/Uttarakhand.geojson';

https.get(GEOJSON_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const geojson = JSON.parse(data);

    // Setup d3-geo projection for the bounding box of Uttarakhand
    const width = 800;
    const height = 600;
    
    // Create a projection that fits the geojson into the viewBox
    const projection = d3.geoMercator().fitSize([width, height], geojson);
    const pathGenerator = d3.geoPath().projection(projection);

    const districts = [];

    geojson.features.forEach((feature) => {
      // Find district name (usually under properties.dtname, properties.district, etc)
      let name = feature.properties.dtname || feature.properties.NAME_2 || feature.properties.district || 'Unknown';
      if (name) {
        // Capitalize nicely
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
      const svgPath = pathGenerator(feature);
      districts.push({
        id: name,
        name: name,
        d: svgPath,
      });
    });

    console.log('Generated paths for:', districts.map(d => d.name).join(', '));

    const outputPath = './src/data/uttarakhandMapData.json';
    fs.writeFileSync(outputPath, JSON.stringify(districts, null, 2));
    console.log('Saved to', outputPath);
  });
}).on('error', (err) => {
  console.error('Error fetching geojson:', err.message);
});
