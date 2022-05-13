import { randomBytes } from 'crypto'
import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { parse } from 'dotenv'
import { DATA_FILE_PATH, PROJECT_IDENTIFIER_FILE_NAME } from './constants'
import type { Project } from './types'

export const get_random_string = async () => {
  const buf = randomBytes(32)
  return Buffer.from(buf).toString('hex')
}

export const get_user_current_project_details = async () => {
  const project_details_unparsed = await readFile(
    path.join(process.cwd(), PROJECT_IDENTIFIER_FILE_NAME),
    'utf8'
  )

  const project_details: {
    project_id: string
    project_name: string
  } = JSON.parse(project_details_unparsed)

  const project_id = project_details.project_id
  const project_name = project_details.project_name

  if (!project_id.trim() || !project_name.trim()) {
    console.warn(
      `Project is not initialized, or the data in ${PROJECT_IDENTIFIER_FILE_NAME} has been corrupted`
    )
    return
  }

  return { project_id, project_name }
}

// TODO: take this as a reference when you make new Pull command
// export const Pull = async ({ name }: { name: string }) => {
//   const data = await readFile(DATA_FILE_PATH, 'utf8')
//   const parsed: Array<DataItem> = JSON.parse(data)
//   const project = parsed.find((item) => item.name === name)

//   if (!project) {
//     return console.log('No Project Data')
//   }

//   const user_envvars = await read_users_dot_env()

//   const content = Object.keys(project.env_vars)
//     .map((key) => `${key}=${project.env_vars[key]}`)
//     .join('\n')

//   if (Object.keys(user_envvars).length > 0) {
//     const ans = await inquirer.prompt([
//       {
//         type: 'list',
//         name: 'override',
//         message:
//           'You have few environment variables already, would you like to override it',
//         choices: ['Yes', 'No'],
//       },
//     ])

//     if ((ans.override as string).toLowerCase() === 'yes') {
//       await writeFile(path.join('.env'), content)
//     } else {
//       await appendFile(path.join(process.cwd(), '.env'), content)
//     }
//   }
// }

export const read_users_dot_env = async () => {
  const user_envvars_string = await readFile(
    path.join(process.cwd(), '.env'),
    'utf8'
  )
  const user_envvars = parse(user_envvars_string)

  return user_envvars
}

export const serach_env_files = async () => {
  const files = await readdir(path.join(process.cwd()))
  let env_files = files.filter((file) => file.startsWith('.env'))

  if (env_files.length === 0) {
    console.log('No files found')
    return []
  }

  env_files = env_files.filter((file) => file !== PROJECT_IDENTIFIER_FILE_NAME)

  return env_files
}

export const get_data_from_store = async () => {
  const data = await readFile(DATA_FILE_PATH, 'utf8')

  if (typeof data === 'string' && data.trim() === '') {
    return []
  }

  const parsed: Array<Project> = JSON.parse(data)
  return parsed
}
