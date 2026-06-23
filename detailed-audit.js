const fs = require('fs');
const path = require('path');
const glob = require('glob');

const columns = [
  'id', 'company_id', 'project_name', 'customer_id', 'stage',
  'dimensions', 'notes', 'assigned_employees', 'assigned_designers',
  'assigned_marketers', 'image_mockup', 'stage_status',
  'version_history', 'chat_history', 'quote_details', 'design_details',
  'production_details', 'installation_details', 'date_created',
  'budget', 'deposit_paid', 'stage_admin_notes', 'customer_name',
  'order_id', 'health', 'lost_reason', 'product_type', 'requirements'
];

const mappedNames = {
  'company_id': 'companyId',
  'project_name': 'projectName',
  'customer_id': 'customerId',
  'assigned_employees': 'assignedEmployees',
  'assigned_designers': 'assignedDesigners',
  'assigned_marketers': 'assignedMarketers',
  'image_mockup': 'imageMockup',
  'stage_status': 'stageStatus',
  'version_history': 'versionHistory',
  'chat_history': 'chatHistory',
  'quote_details': 'quoteDetails',
  'design_details': 'designDetails',
  'production_details': 'productionDetails',
  'installation_details': 'installationDetails',
  'date_created': 'dateCreated',
  'deposit_paid': 'depositPaid',
  'stage_admin_notes': 'stageAdminNotes',
  'customer_name': 'customerName',
  'order_id': 'orderId',
  'lost_reason': 'lostReason',
  'product_type': 'productType'
};

const files = glob.sync('src/**/*.{ts,tsx}', { cwd: __dirname });

columns.forEach(col => {
  let usageCount = 0;
  let camelName = mappedNames[col] || col;
  
  for (const file of files) {
    if (file.includes('types/index.ts') || file.includes('page.tsx')) {
      // Ignore definition files and mapping files for the strict count
      continue;
    }
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for both snake_case and camelCase
    const regex = new RegExp(`\\b(${col}|${camelName})\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      usageCount += matches.length;
    }
  }
  
  if (usageCount === 0) {
    console.log(`[UNUSED] ${col} (camel: ${camelName})`);
  } else {
    // console.log(`[USED: ${usageCount}] ${col}`);
  }
});
