// - create
// - list
// - sync
// - pull
// - delete

import path from 'path'
import { randomBytes } from 'crypto'
import { parse } from 'dotenv'
import { readFile, writeFile, appendFile, readdir } from 'fs/promises'
import inquirer from 'inquirer'

interface DataItem {
  id: string
  name: string
  env_vars: DataItemEnvVar
}
interface DataItemEnvVar {
  [name: string]: string
}

const PULL_ENV_DATA_PATH = path.resolve(path.join('.envars', 'data.json'))

const get_pull_env_data = async () => {
  const data = await readFile(PULL_ENV_DATA_PATH, 'utf8')

  if (typeof data === 'string' && data.trim() === '') {
    return []
  }

  const parsed: Array<DataItem> = JSON.parse(data)
  return parsed
}

const get_user_envvars_details = async () => {
  const user_envvars_string = await readFile(
    path.join(process.cwd(), '.env'),
    'utf8'
  )
  const user_envvars = parse(user_envvars_string)
  const project_id = user_envvars['PULL_ENV_PROJECT_ID']
  const project_name = user_envvars['PULL_ENV_PROJECT_NAME']

  if (
    !project_id ||
    !project_name ||
    project_id.trim() === '' ||
    project_name.trim() === ''
  ) {
    console.error(
      'Some enviormnet variables that that are used by pull-env are missing, kindly confirm that you have PULL_ENV_PROJECT_ID, PULL_ENV_PROJECT_NAME enviornment variables configured in you .env file'
    )
    return null
  }

  return { project_id, project_name, user_envvars }
}

const get_random_string = async () => {
  const buf = randomBytes(32)
  return Buffer.from(buf).toString('hex')
}

const read_users_dot_env = async () => {
  const user_envvars_string = await readFile(
    path.join(process.cwd(), '.env'),
    'utf8'
  )
  const user_envvars = parse(user_envvars_string)

  return user_envvars
}

export const New = async ({ name }: { name: string }) => {
  const dir_contents = await readdir(path.join(process.cwd()))
  const is_env_file_present = dir_contents.includes('.env')

  if (is_env_file_present) {
    const user_envvars_string = await readFile(
      path.join(process.cwd(), '.env'),
      'utf8'
    )
    const user_envvars = parse(user_envvars_string)
    const project_id = user_envvars['PULL_ENV_PROJECT_ID']
    const project_name = user_envvars['PULL_ENV_PROJECT_NAME']

    if (
      (project_id && project_id.trim() !== '') ||
      (project_name && project_name.trim() !== '')
    ) {
      return console.log(
        'You already have a project, please use the sync command to update your project'
      )
    }
  }

  const data = await get_pull_env_data()

  let exists = false
  data.forEach((item) => {
    if (item.name === name) {
      exists = true
    }
  })

  if (exists) {
    console.log(
      `Project with name ${name} already exists!, Try some other name`
    )
    return
  }

  const new_project = { id: await get_random_string(), name, env_vars: {} }

  await writeFile(PULL_ENV_DATA_PATH, JSON.stringify([...data, new_project]))

  const dot_env_contents = `PULL_ENV_PROJECT_NAME=${new_project.name}
PULL_ENV_PROJECT_ID=${new_project.id}`

  if (!is_env_file_present) {
    await writeFile(path.join(process.cwd(), '.env'), dot_env_contents)
    console.log(`Created a new project with name ${new_project.name}
Created a .env file with PULL_ENV_PROJECT_NAME and PULL_ENV_PROJECT_ID enviornment variables
  `)
  } else {
    await appendFile(path.join(process.cwd(), '.env'), dot_env_contents)
    console.log(`Created a new project with name ${new_project.name} 
.env file already exists!!, added PULL_ENV_PROJECT_NAME and PULL_ENV_PROJECT_ID enviornment variables
  `)
  }
}

export const Sync = async () => {
  const project_details = await get_user_envvars_details()

  if (!project_details) return

  const { project_id, user_envvars } = project_details
  const parsed = await get_pull_env_data()

  const project = parsed.find((item) => item.id === project_id)

  if (!project) {
    return console.log(
      "The current project that is specified in '.env' file is not found in store"
    )
  }

  const updated_envvars = {
    ...project.env_vars,
    ...user_envvars,
  }

  const index = parsed.indexOf(project)

  parsed[index].env_vars = updated_envvars

  await writeFile(PULL_ENV_DATA_PATH, JSON.stringify(parsed), 'utf8')

  console.log('Environment variables synced')
}

export const List = async () => {
  const data = await get_pull_env_data()

  if (data.length === 0) {
    return console.log(
      "No Projects found, try creating one using 'new' command"
    )
  }

  console.log('Your Projects')
  data.forEach((i) => {
    console.log(`=> ${i.name}\n`)
  })
}

export const Pull = async ({ name }: { name: string }) => {
  const data = await readFile(PULL_ENV_DATA_PATH, 'utf8')
  const parsed: Array<DataItem> = JSON.parse(data)
  const project = parsed.find((item) => item.name === name)

  if (!project) {
    return console.log('No Project Data')
  }

  const user_envvars = await read_users_dot_env()

  const content = Object.keys(project.env_vars)
    .map((key) => `${key}=${project.env_vars[key]}`)
    .join('\n')

  if (Object.keys(user_envvars).length > 0) {
    const ans = await inquirer.prompt([
      {
        type: 'list',
        name: 'override',
        message:
          'You have few environment variables already, would you like to override it',
        choices: ['Yes', 'No'],
      },
    ])

    if ((ans.override as string).toLowerCase() === 'yes') {
      await writeFile(path.join('.env'), content)
    } else {
      await appendFile(path.join(process.cwd(), '.env'), content)
    }
  }
}

const Delete = async () => {
  const data = await get_pull_env_data()

  if (data.length === 0) {
    return console.log(
      "No Projects found, try creating one using 'new' command"
    )
  }

  const ans = await inquirer.prompt([
    {
      name: 'to_delete',
      type: 'list',
      choices: data.map((item) => item.name),
    },
  ])

  const index = data.findIndex((item) => item.name === ans.to_delete)
  delete data[index]

  await writeFile(
    PULL_ENV_DATA_PATH,
    JSON.stringify(data.length > 0 ? data : []),
    'utf8'
  )

  console.log(`Project ${ans.to_delete} deleted`)
}

Delete().catch((err) => console.error(err.message))
