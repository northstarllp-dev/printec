const fs = require('fs');
const path = require('path');
const glob = require('glob');

const columns = [
  'id', 'company_id', 'project_name', 'customer_id', 'stage',
  'dimensions', 'notes', 'assigned_employees', 'assigned_designers',
  'assigned_marketers', 'deadline_status', 'image_mockup', 'stage_status',
  'version_history', 'chat_history', 'quote_details', 'design_details',
  'production_details', 'installation_details', 'urgent', 'date_created',
  'budget', 'deposit_paid', 'stage_admin_notes', 'customer_name',
  'order_id', 'health', 'lost_reason', 'product_type', 'requirements',
  // and camelCase versions
  'companyId', 'projectName', 'customerId', 'assignedEmployees',
  'assignedDesigners', 'assignedMarketers', 'deadlineStatus', 'imageMockup',
  'stageStatus', 'versionHistory', 'chatHistory', 'quoteDetails', 'designDetails',
  'productionDetails', 'installationDetails', 'dateCreated', 'depositPaid',
  'stageAdminNotes', 'customerName', 'orderId', 'lostReason', 'productType'
];

const files = glob.sync('src/**/*.{ts,tsx}', { cwd: __dirname });
const usage = {};

columns.forEach(col => usage[col] = 0);

for (const file of files) {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  columns.forEach(col => {
    // Search for occurrences of the column name
    const regex = new RegExp(`\\b${col}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      usage[col] += matches.length;
    }
  });
}

console.log("Usage counts:");
columns.forEach(col => {
  console.log(`${col}: ${usage[col]}`);
});
