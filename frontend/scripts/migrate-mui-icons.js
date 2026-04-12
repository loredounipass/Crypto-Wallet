const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src");

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) visit(full);
  }
}

function relativeImport(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel.replace(/\.js$/, "");
}

function processFile(file) {
  if (file.includes(`${path.sep}src${path.sep}ui${path.sep}`)) return;
  let source = fs.readFileSync(file, "utf8");
  const iconsRel = relativeImport(file, path.join(root, "ui", "icons.js"));

  source = source.replace(/from\s+['"]@mui\/icons-material['"]/g, `from '${iconsRel}'`);
  source = source.replace(
    /import\s+([A-Za-z0-9_]+)\s+from\s+['"]@mui\/icons-material\/([A-Za-z0-9_]+)['"];?/g,
    (_, localName, iconName) => `import { ${iconName} as ${localName} } from '${iconsRel}';`
  );

  fs.writeFileSync(file, source, "utf8");
}

walk(root, processFile);
console.log("Icon imports migrated.");
