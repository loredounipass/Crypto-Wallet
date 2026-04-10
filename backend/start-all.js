const { spawn } = require('child_process');
const path = require('path');

const scripts = [
  './daemon/subscriptions/chain/evm/native-coins/avax.js',
  './daemon/subscriptions/chain/evm/native-coins/bnb.js',
  './daemon/subscriptions/chain/evm/native-coins/eth.js',
  './daemon/subscriptions/chain/evm/native-coins/ftm.js',
  './daemon/subscriptions/chain/evm/native-coins/matic.js',
  './daemon/subscriptions/chain/evm/native-coins/optimism.js',
  './daemon/subscriptions/app/withdraws.js',
  './daemon/workers/chain/avalanche.js',
  './daemon/workers/chain/bsc.js',
  './daemon/workers/chain/ethereum.js',
  './daemon/workers/chain/fantom.js',
  './daemon/workers/chain/polygon.js',
  './daemon/workers/chain/optimism.js',
  './daemon/workers/local/withdrawRequests.js',
];

console.log('Starting all daemons...');

const processes = scripts.map(script => {
  const child = spawn('node', [script], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('exit', (code) => {
    console.log(`Process ${script} exited with code ${code}`);
  });

  return child;
});

console.log(`Started ${processes.length} processes`);