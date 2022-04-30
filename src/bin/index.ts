#!/usr/bin/env node

import { Command } from 'commander'
import pkjson from '../../package.json'
import { New } from '..'

const program = new Command()

program
  .name('Pull Env')
  .description('Simple CLI to save your enviornment variables')
  .version(pkjson.version)

program
  .command('new')
  .description(
    'Creates a new project where can save your enviornment variables'
  )
  .option('-n, --name <char>', 'Name of the project')
  .action((options) => {
    New({ name: options.name })
  })

program.parse()
