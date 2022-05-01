#!/usr/bin/env node

import { Command } from 'commander'
import pkjson from '../../package.json'
import { List, New, Sync } from '..'

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
  .requiredOption('-n, --name <char>', 'Name of the project')
  .action((options) => {
    New({ name: options.name })
  })

program
  .command('sync')
  .description('Syncs enviornment variables to data store')
  .action(() => {
    Sync()
  })

program
  .command('list')
  .description('Lists all the projects')
  .action(() => {
    List()
  })

program.parse()
