#!/usr/bin/env node

import { Command } from 'commander'
import pkjson from '../../package.json'
import { List, New, Pull } from '..'

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
  .action(() => {
    New()
  })

program
  .command('sync')
  .description('Syncs enviornment variables to data store')
  .action(() => {
    // Sync()
  })

program
  .command('list')
  .description('Lists all the projects')
  .action(() => {
    List()
  })

program
  .command('pull')
  .description('Pull enviornment variables from store')
  .requiredOption('-n, --name <char>', 'Name of the project')
  .action((options) => {
    Pull({ name: options.name })
  })

program.parse()
