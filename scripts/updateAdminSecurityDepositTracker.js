const fs = require('fs');

const targetFile = '/Users/karthikp/Desktop/V.2 _ Admin/src/components/SecurityDepositTracker.tsx';

if (!fs.existsSync(targetFile)) {
  console.error('File not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// 1. Dynamic totalCollected
content = content.replace(
  'const totalCollected = paidDrivers.length * 250;',
  'const totalCollected = paidDrivers.reduce((sum, d) => sum + (Number(d.deposit_amount) || 250), 0);'
);

// 2. Dynamic deposit amount display
content = content.replace(
  `<td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">\n                        ₹250.00\n                      </td>`,
  `<td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">\n                        ₹{(Number(driver.deposit_amount) || 250).toFixed(2)}\n                      </td>`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ Updated SecurityDepositTracker.tsx with dynamic values from database!');
