#!/usr/bin/env node
/**
 * Three Minds v2 - CLI Entry
 * 
 * Multi-Agent Collaboration System
 */

import { Command } from 'commander';
import { Council, loadConfig, getDefaultConfig } from './council';
import { CouncilConfig } from './types';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('three-minds')
  .description('Multi-Agent Collaboration System - Three AI agents working together')
  .version('2.0.0')
  .argument('<task>', 'Task description')
  .option('-c, --config <path>', 'Config file path')
  .option('-d, --dir <path>', 'Working directory (default: current directory)', process.cwd())
  .option('-m, --max-rounds <n>', 'Maximum rounds', '15')
  .option('-q, --quiet', 'Quiet mode')
  .option('-o, --output <path>', 'Save result to file')
  .action(async (task: string, options: any) => {
    try {
      let config: CouncilConfig;

      if (options.config) {
        config = await loadConfig(options.config);
        // Override working directory
        config.projectDir = path.resolve(options.dir);
      } else {
        config = getDefaultConfig(path.resolve(options.dir));
      }

      // Override maxRounds
      if (options.maxRounds) {
        config.maxRounds = parseInt(options.maxRounds, 10);
      }

      // Ensure working directory exists
      if (!fs.existsSync(config.projectDir)) {
        console.error(`Error: Working directory does not exist: ${config.projectDir}`);
        process.exit(1);
      }

      const council = new Council(config, options.quiet);
      const session = await council.run(task);

      // Save result
      if (options.output) {
        const outputPath = path.resolve(options.output);
        const outputContent = JSON.stringify(session, null, 2);
        fs.writeFileSync(outputPath, outputContent);
        console.log(`\n💾 Result saved: ${outputPath}`);
      }

      // Set exit code based on status
      process.exit(session.status === 'consensus' ? 0 : 1);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
