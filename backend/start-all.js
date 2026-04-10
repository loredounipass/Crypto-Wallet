const { spawn } = require('child_process');
const path = require('path');

const scripts = [
  { name: 'API Server', script: './app-core/dist/main.js' },
  { name: 'AVAX Broadcast', script: './daemon/subscriptions/chain/evm/native-coins/avax.js' },
  { name: 'BNB Broadcast', script: './daemon/subscriptions/chain/evm/native-coins/bnb.js' },
  { name: 'ETH Broadcast', script: './daemon/subscriptions/chain/evm/native-coins/eth.js' },
  { name: 'FTM Broadcast', script: './daemon/subscriptions/chain/evm/native-coins/ftm.js' },
  { name: 'MATIC Broadcast', script: './daemon/subscriptions/chain/evm/native-coins/matic.js' },
  { name: 'OP Broadcast', script: './daemon/subscriptions/chain/evm/native-coins/optimism.js' },
  { name: 'App Withdraws Broadcast', script: './daemon/subscriptions/app/withdraws.js' },
  { name: 'Avalanche Worker', script: './daemon/workers/chain/avalanche.js' },
  { name: 'BSC Worker', script: './daemon/workers/chain/bsc.js' },
  { name: 'Ethereum Worker', script: './daemon/workers/chain/ethereum.js' },
  { name: 'Fantom Worker', script: './daemon/workers/chain/fantom.js' },
  { name: 'Polygon Worker', script: './daemon/workers/chain/polygon.js' },
  { name: 'Optimism Worker', script: './daemon/workers/chain/optimism.js' },
  { name: 'Withdraw Requests Worker', script: './daemon/workers/local/withdrawRequests.js' },
];

console.log('Starting all processes...');

const processes = scripts.map(({ name, script }) => {
  const child = spawn('node', [script], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('exit', (code) => {
    console.log(`Process ${name} exited with code ${code}`);
  });

  return child;
});

console.log(`Started ${processes.length} processes`);