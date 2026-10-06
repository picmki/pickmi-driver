const fs = require('fs');
const crypto = require('crypto');

const jksData = fs.readFileSync(__dirname + '/keystore.jks');

function checkJksPassword(password) {
  if (jksData.length < 20) return false;
  
  const digestInFile = jksData.slice(jksData.length - 20);
  const content = jksData.slice(0, jksData.length - 20);

  const passBuf = Buffer.alloc(password.length * 2);
  for (let i = 0; i < password.length; i++) {
    passBuf.writeUInt16BE(password.charCodeAt(i), i * 2);
  }

  const sha1 = crypto.createHash('sha1');
  sha1.update(passBuf);
  sha1.update(content);
  const hash = sha1.digest();

  return hash.equals(digestInFile);
}

const candidates = [
  "android",
  "8c3791781e0f315af0a5f1211508fb80",
  "c301558a19094901c938bab28dffe1a7",
  "pickmi",
  "pickmi_25",
  "MobileApp",
  "Pickmi@123",
  "Pickmi2024",
  "Pickmi2025",
  "Pickmi2026",
  "123456",
  "password"
];

for (const p of candidates) {
  if (checkJksPassword(p)) {
    console.log("MATCH FOUND! Keystore Password is:", p);
    process.exit(0);
  }
}

console.log("None of the test candidates matched.");
