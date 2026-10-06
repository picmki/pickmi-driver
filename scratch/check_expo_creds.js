const https = require('https');
const fs = require('fs');

const state = JSON.parse(fs.readFileSync('/Users/karthikp/.expo/state.json', 'utf8'));
const sessionSecret = state.auth ? state.auth.sessionSecret : null;

const query = `
query GetAndroidCredentials {
  app {
    byId(appId: "4ecc15ea-142d-4f0b-a354-66c2cbb829d3") {
      id
      slug
      ownerAccount {
        name
      }
      androidAppCredentials {
        id
        androidKeystore {
          id
          keystorePassword
          keyPassword
          keyAlias
        }
      }
    }
  }
}
`;

const postData = JSON.stringify({ query });

const options = {
  hostname: 'api.expo.dev',
  path: '/v2/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'expo-session': sessionSecret || ''
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log("Response Status:", res.statusCode);
    console.log("Response Data:", data);
  });
});

req.on('error', (e) => {
  console.error("Req error:", e);
});

req.write(postData);
req.end();
