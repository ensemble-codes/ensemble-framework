#!/usr/bin/env node
const { Command } = require('commander');

// Test command structure similar to our implementation
const testCommand = new Command('test')
  .description('Test command with help')
  .option('-h, --help', 'Display help information')
  .action(() => {
    testCommand.outputHelp();
  });

// Add a subcommand
testCommand
  .command('sub')
  .description('Subcommand with help')
  .option('-h, --help', 'Display help information')
  .option('--foo <bar>', 'Foo option')
  .action((options) => {
    if (options.help) {
      testCommand.command('sub').outputHelp();
      return;
    }
    console.log('Subcommand executed with options:', options);
  });

// Parse test arguments
const testArgs = process.argv.slice(2);
console.log('Testing with args:', testArgs);
testCommand.parse(['node', 'test', ...testArgs]);