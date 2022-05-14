#!/usr/bin/env node

import { Command } from 'commander'
import { List, New, Pull, Sync, Delete } from './index'
import { get_package_json } from './utils'
//
;(async () => {
  const program = new Command()
  const pkjson = await get_package_json()

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
      Sync()
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
    .action(() => {
      Pull()
    })

  program
    .command('delete')
    .description('Delete a project')
    .action(() => {
      Delete()
    })

  program.parse()
})()
