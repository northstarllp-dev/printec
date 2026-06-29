const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  }
  return filelist;
};

const processFile = (filePath) => {
  if (filePath.endsWith('.png') || filePath.endsWith('.ico') || filePath.endsWith('.jpg')) return;

  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Case-preserving replacements
  newContent = newContent.replace(/printec/g, 'printoms');
  newContent = newContent.replace(/Printec/g, 'Printoms');
  newContent = newContent.replace(/PRINTEC/g, 'PRINTOMS');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
};

const dirsToScan = ['src', 'docs'];
const singleFiles = ['package.json', 'package-lock.json', 'seed.sql', 'migration.sql', 'create-test-user.js'];

dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = walkSync(dir);
    files.forEach(processFile);
  }
});

singleFiles.forEach(file => {
  if (fs.existsSync(file)) {
    processFile(file);
  }
});

console.log("Global text replacement complete.");
