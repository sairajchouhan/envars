import { randomBytes } from 'crypto'
import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { parse } from 'dotenv'
import { PROJECT_IDENTIFIER_FILE_NAME } from './constants'

export const get_random_string = async () => {
  const buf = randomBytes(32)
  return Buffer.from(buf).toString('hex')
}

// TODO: should inspect this
export const get_user_envvars_details = async () => {
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
  console.log('Searching for files that start with .env')
  const files = await readdir(path.join(process.cwd()))

  let env_files = files.filter((file) => file.startsWith('.env'))

  if (env_files.length === 0) {
    console.log('No files found')
    return []
  }

  env_files = env_files.filter((file) => file !== PROJECT_IDENTIFIER_FILE_NAME)

  console.log('Found following files:')
  env_files.forEach((file) => {
    console.log(file)
  })

  return env_files
}

serach_env_files()
