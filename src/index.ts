import path from 'path'
import { readFile, writeFile, appendFile, readdir } from 'fs/promises'
import inquirer from 'inquirer'
import { parse } from 'dotenv'

import { DATA_FILE_PATH, PROJECT_IDENTIFIER_FILE_NAME } from './constants'
import {
  get_random_string,
  get_user_current_project_details,
  get_data_from_store,
  serach_env_files,
} from './utils'

export const New = async () => {
  const user_files = await readdir(process.cwd())

  if (user_files.includes(PROJECT_IDENTIFIER_FILE_NAME)) {
    const project_details_unparsed = await readFile(
      path.join(process.cwd(), PROJECT_IDENTIFIER_FILE_NAME),
      'utf8'
    )

    const project_details =
      project_details_unparsed === ''
        ? {}
        : JSON.parse(project_details_unparsed)

    const a: string = project_details.project_id
    const b: string = project_details.project_name

    if (a && b && a.trim() !== '' && b.trim() !== '') {
      console.log('A project already exists in the current directory')
      console.log(project_details)
      console.log(`Project Name: ${project_details.project_name}`)
      return
    }
  }

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

  await writeFile(
    path.join(process.cwd(), PROJECT_IDENTIFIER_FILE_NAME),
    JSON.stringify({
      project_id: new_project.project_id,
      project_name: new_project.project_name,
    })
  )

  if (user_files.includes('.gitignore')) {
    console.log(
      '.gitignore file already exists, added .envars.json to .gitignore'
    )

    await appendFile(
      path.join(process.cwd(), '.gitignore'),
      `\n${PROJECT_IDENTIFIER_FILE_NAME}`
    )
  } else {
    console.log('Created a .gitignore file in your project root directory')
    await writeFile(
      path.join(process.cwd(), '.gitignore'),
      `${PROJECT_IDENTIFIER_FILE_NAME}\n`
    )
  }

  console.log(`Project ${new_project.project_name} created successfully`)
}

// TODO: create a type file that has the currently env variables types, so that the user can get some autocompelte
export const Sync = async () => {
  console.log('Syncing project...')
  const project_details = await get_user_current_project_details()

  if (!project_details) {
    return
  }

  const { project_id } = project_details
  const projects = await get_data_from_store()
  const project = projects.find((item) => item.project_id === project_id)

  if (!project) {
    return console.error(`Project with id ${project_id} not found`)
  }

  const projectIndex = projects.indexOf(project)

  const env_files = await serach_env_files()
  if (env_files.length === 0) {
    return console.error('No env files found')
  }

  const file_read_promises = env_files.map(async (file) => {
    const file_content = await readFile(path.join(process.cwd(), file), 'utf8')
    const parsed = parse(file_content)
    return {
      file_name: file,
      envars: Object.entries(parsed).map(([key, value]) => ({
        key,
        value,
      })),
    }
  })

  const items = await Promise.all(file_read_promises)
  projects[projectIndex].items = items

  await writeFile(DATA_FILE_PATH, JSON.stringify(projects))

  console.log(`Synced files ${env_files.map((file) => `${file} `).join('')}`)
}

export const List = async () => {
  const data = await get_data_from_store()

  if (data.length === 0) {
    return console.log(
      "No Projects found, try creating one using 'new' command"
    )
  }

  console.log('Your Projects')
  data.forEach((i) => {
    console.log(`${i.project_name}\n`)
  })
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

Sync().catch((err) => console.error(err))
