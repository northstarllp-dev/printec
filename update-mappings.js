const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/app/**/page.tsx', { cwd: __dirname });

let updated = 0;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('dimensions: ')) {
    content = content.replace(/dimensions:\s*o\.dimensions,?/g, 'dimensions: o.dimensions,\n    productType: o.product_type,\n    requirements: o.requirements,');
    content = content.replace(/dimensions:\s*order\.dimensions,?/g, 'dimensions: order.dimensions,\n    productType: order.product_type,\n    requirements: order.requirements,');
    content = content.replace(/dimensions:\s*orderData\.dimensions,?/g, 'dimensions: orderData.dimensions,\n    productType: orderData.product_type,\n    requirements: orderData.requirements,');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated ' + file);
    updated++;
  }
}

console.log('Total files updated: ' + updated);
