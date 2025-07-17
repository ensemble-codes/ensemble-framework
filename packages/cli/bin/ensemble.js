#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Path to the compiled CLI entry point
const cliPath = isDev 
  ? path.join(__dirname, '..', 'src', 'index.ts')
  : path.join(__dirname, '..', 'dist', 'index.js');

// For development, use tsx to run TypeScript directly
if (isDev) {
  const child = spawn('tsx', [cliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  
  child.on('exit', (code) => {
    process.exit(code);
  });
} else {
  // For production, run the compiled JavaScript
  require(cliPath);
}