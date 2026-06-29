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

const children = [];
let startupIndex = 0;

const startNext = () => {
  if (startupIndex >= scripts.length) return;
  const { name, script } = scripts[startupIndex];
  const delay = startupIndex > 0 ? 2000 : 0;
  startupIndex++;

  setTimeout(() => {
    console.log(`[${name}] Starting...`);
    const child = spawn('node', [script], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.log(`[${name}] Exited with code ${code}. Restarting in 5 seconds...`);
        setTimeout(() => {
          console.log(`[${name}] Starting...`);
          const newChild = spawn('node', [script], {
            stdio: 'inherit',
            cwd: __dirname
          });
          children[children.indexOf(child)] = newChild;
          child = newChild;
          child.on('exit', () => {});
        }, 5000);
      }
    });

    child.on('error', (err) => {
      console.error(`[${name}] Error:`, err);
    });

    children.push(child);
    startNext();
  }, delay);
};

startNext();

function shutdown() {
  console.log('\nShutting down all processes gracefully...');
  let completed = 0;
  const total = children.length;

  children.forEach((child, i) => {
    if (!child || !child.pid) {
      completed++;
      if (completed === total) process.exit(0);
      return;
    }
    const name = scripts[i]?.name || `process-${i}`;
    child.on('exit', () => {
      console.log(`[${name}] Stopped.`);
      completed++;
      if (completed === total) process.exit(0);
    });
    child.kill('SIGTERM');
  });

  setTimeout(() => {
    console.warn('Forcing exit after timeout.');
    process.exit(1);
  }, 15000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`Started ${children.length} daemon processes successfully.`);