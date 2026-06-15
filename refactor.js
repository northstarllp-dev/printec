const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk('src', function(err, results) {
  if (err) throw err;
  results.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const original = content;
    
    // Actions
    content = content.replace(/@\/app\/actions\/orderActions/g, '@/features/orders/actions/orderActions');
    content = content.replace(/@\/app\/actions\/customerActions/g, '@/features/customers/actions/customerActions');
    content = content.replace(/@\/app\/actions\/enquiryActions/g, '@/features/enquiries/actions/enquiryActions');
    content = content.replace(/@\/app\/actions\/employeeActions/g, '@/features/employees/actions/employeeActions');
    content = content.replace(/@\/app\/actions\/authActions/g, '@/features/auth/actions/authActions');
    content = content.replace(/@\/app\/actions\/auditActions/g, '@/features/audit/actions/auditActions');
    
    // Components
    content = content.replace(/@\/app\/components\/OrdersEnhancedDashboard/g, '@/features/orders/components/OrdersEnhancedDashboard');
    content = content.replace(/@\/app\/components\/OrdersManagementDashboard/g, '@/features/orders/components/OrdersManagementDashboard');
    content = content.replace(/@\/app\/components\/OrderWorksheetModal/g, '@/features/orders/components/OrderWorksheetModal');
    content = content.replace(/@\/app\/components\/OrderWorkflow/g, '@/features/orders/components/OrderWorkflow');
    content = content.replace(/@\/app\/components\/ProductQuoteDashboard/g, '@/features/orders/components/ProductQuoteDashboard');
    content = content.replace(/@\/app\/components\/CustomersViewNew/g, '@/features/customers/components/CustomersViewNew');
    content = content.replace(/@\/app\/components\/EnquiriesViewNew/g, '@/features/enquiries/components/EnquiriesViewNew');
    content = content.replace(/@\/app\/components\/AddEnquiryModal/g, '@/features/enquiries/components/AddEnquiryModal');
    content = content.replace(/@\/app\/components\/ConvertEnquiryModal/g, '@/features/enquiries/components/ConvertEnquiryModal');
    content = content.replace(/@\/app\/components\/EmployeesViewNew/g, '@/features/employees/components/EmployeesViewNew');
    content = content.replace(/@\/app\/components\/EmployeeProfileView/g, '@/features/employees/components/EmployeeProfileView');
    content = content.replace(/@\/app\/components\/EmployeeCalendarView/g, '@/features/employees/components/EmployeeCalendarView');
    content = content.replace(/@\/app\/components\/EmployeeModal/g, '@/features/employees/components/EmployeeModal');
    content = content.replace(/@\/app\/components\/SettingsViewNew/g, '@/features/settings/components/SettingsViewNew');
    
    content = content.replace(/from "\.\/auditActions"/g, 'from "@/features/audit/actions/auditActions"');
    content = content.replace(/from "\.\/employeeActions"/g, 'from "@/features/employees/actions/employeeActions"');
    content = content.replace(/from "\.\/authActions"/g, 'from "@/features/auth/actions/authActions"');
    content = content.replace(/from "\.\/orderActions"/g, 'from "@/features/orders/actions/orderActions"');
    
    if (content !== original) {
      console.log('Updated', f);
      fs.writeFileSync(f, content, 'utf8');
    }
  });
});
