// - create
// - list
// - sync
// - pull
// - delete

import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { parse } from 'dotenv'

interface DataItem {
  id: string
  name: string
  env_vars: DataItemEnvVar
}
interface DataItemEnvVar {
  [name: string]: string
}

const PULL_ENV_DATA_PATH = path.resolve(path.join('.pullenv', 'data.json'))

const get_pull_env_data = async () => {
  const data = await fs.readFile(PULL_ENV_DATA_PATH, 'utf8')
  const parsed: Array<DataItem> = JSON.parse(data)
  return parsed
}

const get_project_details = async () => {
  const user_envvars_string = await fs.readFile(path.join('.env'), 'utf8')
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

const Create = async ({ name }: { name: string }) => {
  const data = await get_pull_env_data()

  const empty_json_cond =
    typeof data === 'object' && Object.keys(data).length === 0

  if (empty_json_cond) {
    await fs.writeFile(
      PULL_ENV_DATA_PATH,
      JSON.stringify([{ id: await get_random_string(), name, env_vars: {} }])
    )
  }
  console.log('Created a new Project with name: ', name)
}

const Sync = async () => {
  const project_details = await get_project_details()

  if (!project_details) return

  const { project_id, user_envvars } = project_details

  const data = await fs.readFile(PULL_ENV_DATA_PATH, 'utf8')
  const parsed: Array<DataItem> = JSON.parse(data)
  const project = parsed.find((item) => item.id === project_id)

  if (!project) {
    return console.log('No Project Data')
  }

  const updated_envvars = {
    ...project.env_vars,
    ...user_envvars,
  }

  const item = parsed.find((item) => item.id === project_id)

  if (!item) return
  const index = parsed.indexOf(item)

  parsed[index].env_vars = updated_envvars

  await fs.writeFile(PULL_ENV_DATA_PATH, JSON.stringify(parsed), 'utf8')
}

const List = async () => {
  const data = await get_pull_env_data()

  console.log('Your Projects')
  data.forEach((i) => {
    console.log(`=> ${i.name}\n`)
  })
}

const Pull = async () => {
  const project_details = await get_project_details()
  if (!project_details) return
  const { project_id } = project_details

  const data = await fs.readFile(PULL_ENV_DATA_PATH, 'utf8')
  const parsed: Array<DataItem> = JSON.parse(data)
  const project = parsed.find((item) => item.id === project_id)

  if (!project) {
    return console.log('No Project Data')
  }

  const content = Object.keys(project.env_vars)
    .map((key) => `${key}=${project.env_vars[key]}`)
    .join('\n')

  await fs.writeFile(path.join('.env'), content)
}

// const Delete = async () => {

// }

Pull()
  .then(() => {
    console.log('\n\nsuccess')
  })
  .catch((err) => console.log(err))
