const https = require('https');

https.get('https://mindroots-1093242443167.us-central1.run.app', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const scripts = data.match(/<script.*?src="(.*?)"/g);
    if (!scripts) {
      console.log('No scripts found');
      return;
    }
    const jsFiles = scripts.map(s => s.match(/src="(.*?)"/)[1]);
    
    jsFiles.forEach(file => {
      const url = file.startsWith('http') ? file : 'https://mindroots-1093242443167.us-central1.run.app' + (file.startsWith('/') ? '' : '/') + file;
      https.get(url, (sRes) => {
        let sData = '';
        sRes.on('data', (c) => sData += c);
        sRes.on('end', () => {
          if (sData.includes('AIzaSyB9k1oxWi_RrqTePgsBI43QZ-I3YuhIiL0')) {
            console.log(`FOUND API KEY IN: ${url}`);
          } else if (sData.includes('NEXT_PUBLIC_FIREBASE')) {
            console.log(`FOUND RAW ENV KEY IN: ${url}`);
          }
        });
      });
    });
    console.log('Checked JS files.');
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
