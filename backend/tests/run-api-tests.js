#!/usr/bin/env node
/**
 * API Test Runner
 * Starts the backend server, runs all API tests, then stops the server.
 */

const { spawn } = require('child_process');
const http = require('http');

const SERVER_START_TIMEOUT = 30000;
const TEST_TIMEOUT = 120000;
const BASE_URL = 'http://localhost:5055';

function waitForServer(url, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function check() {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });
      
      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    }
    
    function retry() {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Server failed to start within ${timeout}ms`));
      } else {
        setTimeout(check, 500);
      }
    }
    
    check();
  });
}

function runTests() {
  return new Promise((resolve, reject) => {
    console.log('\n=== Running API Tests ===\n');
    
    const testProcess = spawn('node', ['--test', 'tests/api.test.js'], {
      cwd: __dirname + '/..',
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    testProcess.on('error', reject);
  });
}

async function main() {
  console.log('=== LucidLab Backend API Test Runner ===\n');
  console.log('Starting backend server...');
  
  // Start the server
  const serverProcess = spawn('node', ['src/index.js'], {
    cwd: __dirname + '/..',
    stdio: 'pipe'
  });
  
  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
    if (process.env.DEBUG) {
      process.stdout.write(data);
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    if (process.env.DEBUG) {
      process.stderr.write(data);
    }
  });
  
  try {
    // Wait for server to be ready
    console.log(`Waiting for server at ${BASE_URL}...`);
    await waitForServer(`${BASE_URL}/api/health`, SERVER_START_TIMEOUT);
    console.log('✓ Server is ready\n');
    
    // Run the tests
    await runTests();
    
    console.log('\n=== All Tests Completed ===');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test run failed:', error.message);
    if (serverOutput) {
      console.error('\nServer output:\n', serverOutput.slice(-2000));
    }
    process.exit(1);
  } finally {
    // Kill the server
    console.log('\nStopping server...');
    serverProcess.kill('SIGTERM');
  }
}

main();
