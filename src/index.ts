// - create
// - list
// - sync
// - pull
// - delete

import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

const PULL_ENV_DATA_PATH = path.resolve(path.join('.pullenv', 'data.json'))

const get_pull_env_data = async () => {
  try {
    const data = await fs.readFile(PULL_ENV_DATA_PATH, 'utf8')
    console.log('data', data, typeof data)
    return JSON.parse(data)
  } catch (error) {
    return {}
  }
}

const get_random_string = async () => {
  const buf = randomBytes(32)
  return Buffer.from(buf).toString('hex')
}

const create = async ({ name }: { name: string }) => {
  const data = await get_pull_env_data()

  const empty_json_cond =
    typeof data === 'object' && Object.keys(data).length === 0

  if (empty_json_cond) {
    await fs.writeFile(
      PULL_ENV_DATA_PATH,
      JSON.stringify([{ id: await get_random_string(), name, env_vars: [] }])
    )
  }
  console.log('Created a new Project with name: ', name)
}

create({ name: 'hi' })
  .then(() => {
    console.log('succes')
  })
  .catch((err) => console.log(err))
