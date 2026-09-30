const fs = require('fs');

const targetFile = '/Users/karthikp/Desktop/V.2 _ Admin/src/lib/pushNotifications.ts';

if (!fs.existsSync(targetFile)) {
  console.error('File not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// Ensure token deduplication and expo_go filter
const targetSection = `    if (tokens.length === 0) {
      console.log('ℹ️ No registered Expo push tokens found for target drivers yet.');
      return { success: true, deliveredCount: 0 };
    }

    console.log(\`📣 Sending remote push notification to \${tokens.length} driver device(s)...\`);

    // 2. Build Expo Push Service payloads
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: '🚨 New Trip Received! - PickMi Driver',
      body: \`Trip \${payload.tripNumber} (₹\${payload.fare})\\nFrom: \${pickupShort}\\nTo: \${dropShort}\`,
      data: {
        tripId: payload.tripId,
        fare: payload.fare,
      },
      priority: 'high',
      channelId: 'pickmi_rides',
      badge: 1,
    }));`;

const replacementSection = `    // Deduplicate and filter valid Expo tokens (remove mock Expo Go tokens)
    tokens = Array.from(
      new Set(
        tokens.filter(
          (t) => typeof t === 'string' && t.startsWith('ExponentPushToken[') && !t.includes('expo_go_')
        )
      )
    );

    if (tokens.length === 0) {
      console.log('ℹ️ No registered Expo push tokens found for target drivers yet.');
      return { success: true, deliveredCount: 0 };
    }

    console.log(\`📣 Sending remote push notification to \${tokens.length} driver device(s)...\`);

    // 2. Build Expo Push Service payloads
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: '🚨 New Trip Received! - PickMi Driver',
      body: \`Trip \${payload.tripNumber} (₹\${payload.fare})\\nFrom: \${pickupShort}\\nTo: \${dropShort}\`,
      data: {
        tripId: payload.tripId,
        fare: payload.fare,
      },
      priority: 'high',
      channelId: 'pickmi_rides',
      badge: 1,
      _displayInForeground: true,
    }));`;

if (content.includes(targetSection)) {
  content = content.replace(targetSection, replacementSection);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✅ Admin pushNotifications.ts updated with deduplication and _displayInForeground!');
} else {
  console.warn('⚠️ targetSection not found in pushNotifications.ts');
}
