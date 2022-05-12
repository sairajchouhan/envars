// - create
// - list
// - sync
// - pull
// - delete

import path from 'path'
import { get_random_string } from './utils'
import { parse } from 'dotenv'
import { readFile, writeFile, appendFile, readdir } from 'fs/promises'
import inquirer from 'inquirer'
import { DATA_FILE_PATH } from './constants'

interface DataItem {
  id: string
  name: string
  env_vars: DataItemEnvVar
}
interface DataItemEnvVar {
  [name: string]: string
}

interface Project {
  project_id: string
  project_name: string
  items: Array<EnvFile>
}

interface EnvFile {
  file_name: string
  envars: Array<EnvVarKeyValuePair>
}

type EnvVarKeyValuePair = {
  key: string
  value: string
}

const get_data_from_store = async () => {
  const data = await readFile(DATA_FILE_PATH, 'utf8')

  if (typeof data === 'string' && data.trim() === '') {
    return []
  }

  const parsed: Array<Project> = JSON.parse(data)
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

const read_users_dot_env = async () => {
  const user_envvars_string = await readFile(
    path.join(process.cwd(), '.env'),
    'utf8'
  )
  const user_envvars = parse(user_envvars_string)

  return user_envvars
}

export const New = async () => {
  const resp = await inquirer.prompt({
    name: 'project_name',
    type: 'input',
    message: 'Enter project name: ',
  })

  const projects = await get_data_from_store()

  const all_project_names = projects.map((item) =>
    item.project_name.toLowerCase()
  )

  if (all_project_names.includes(resp.project_name.toLowerCase())) {
    return console.error(
      `Project with name ${resp.project_name} already exists`
    )
  }

  const new_project = {
    project_id: await get_random_string(),
    project_name: resp.project_name,
    items: [],
  }

  const updated_projects = [...projects, new_project]
  await writeFile(DATA_FILE_PATH, JSON.stringify(updated_projects))

  console.log(`Project ${new_project.project_name} created successfully`)
}

// export const Sync = async () => {
//   const project_details = await get_user_envvars_details()

//   console.log(project_details)
//   if (project_details === null) return

//   const { project_id, user_envvars } = project_details
//   const parsed = await get_data_from_store()

//   const project = parsed.find((item) => item.id === project_id)

//   if (!project) {
//     return console.log(
//       "The current project that is specified in '.env' file is not found in store"
//     )
//   }

//   const updated_envvars = {
//     ...project.env_vars,
//     ...user_envvars,
//   }

//   const index = parsed.indexOf(project)

//   parsed[index].env_vars = updated_envvars

//   await writeFile(DATA_FILE_PATH, JSON.stringify(parsed), 'utf8')

//   console.log('Environment variables synced')
// }

export const List = async () => {
  const data = await get_data_from_store()

  if (data.length === 0) {
    return console.log(
      "No Projects found, try creating one using 'new' command"
    )
  }

  console.log('Your Projects')
  // data.forEach((i) => {
  //   console.log(`=> ${i.name}\n`)
  // })
}

export const Pull = async ({ name }: { name: string }) => {
  const data = await readFile(DATA_FILE_PATH, 'utf8')
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

export const Delete = async () => {
  const projects = await get_data_from_store()

  if (projects.length === 0) {
    return console.log(
      "No Projects found, try creating one using 'new' command"
    )
  }

  const resp = await inquirer.prompt({
    name: 'to_delete',
    message: 'Enter project name to delete: ',
    type: 'list',
    choices: projects.map((item) => item.project_name),
  })

  const updated_projects = projects.filter(
    (item) => item.project_name !== resp.to_delete
  )

  await writeFile(
    DATA_FILE_PATH,
    JSON.stringify(updated_projects.length > 0 ? updated_projects : []),
    'utf8'
  )

  console.log(`Project ${resp.to_delete} deleted successfully`)
}

// Delete().catch((err) => console.error(err))
Delete().catch((err) => console.error(err))
