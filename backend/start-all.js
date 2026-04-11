const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const processJsonPath = path.join(__dirname, 'process.json');
let scripts = [];

try {
  const fileContent = fs.readFileSync(processJsonPath, 'utf8');
  const parsed = JSON.parse(fileContent);
  scripts = parsed.apps || [];
} catch (error) {
  console.error('Error reading process.json:', error.message);
  process.exit(1);
}

console.log('Starting processes from process.json...');

const processes = scripts.map(({ name, script }) => {
  const startProcess = () => {
    console.log(`[${name}] Starting...`);
    const child = spawn('node', [script], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('exit', (code) => {
      console.log(`[${name}] Exited with code ${code}. Restarting in 5 seconds...`);
      setTimeout(startProcess, 5000);
    });

    child.on('error', (err) => {
      console.error(`[${name}] Error:`, err);
    });

    return child;
  };

  return startProcess();
});

console.log(`Started ${processes.length} daemon processes successfully.`);