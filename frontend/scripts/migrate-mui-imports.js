const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src");

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, visit);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      visit(full);
    }
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
  const materialRel = relativeImport(file, path.join(root, "ui", "material.js"));
  const stylesRel = relativeImport(file, path.join(root, "ui", "styles.js"));

  source = source.replace(/from\s+['"]@mui\/material\/styles['"]/g, `from '${stylesRel}'`);
  source = source.replace(/from\s+['"]@mui\/material['"]/g, `from '${materialRel}'`);
  source = source.replace(
    /import\s+([A-Za-z0-9_]+)\s+from\s+['"]@mui\/material\/([A-Za-z0-9_]+)['"];?/g,
    (_, localName, componentName) => `import { ${componentName} as ${localName} } from '${materialRel}';`
  );

  fs.writeFileSync(file, source, "utf8");
}

walk(root, processFile);
console.log("Material imports migrated.");
