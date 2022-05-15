import path from 'path'
import { readFile, writeFile, appendFile, readdir, unlink } from 'fs/promises'
import inquirer from 'inquirer'
import { parse } from 'dotenv'

import { DATA_FILE_PATH, PROJECT_IDENTIFIER_FILE_NAME } from './constants'
import {
  get_random_string,
  get_user_current_project_details,
  get_data_from_store,
  serach_env_files,
  log,
  yellow,
  yellow_bold,
  error,
} from './utils'

export const New = async () => {
  const user_files = await readdir(process.cwd())

  if (user_files.includes(PROJECT_IDENTIFIER_FILE_NAME)) {
    const project_details_unparsed = await readFile(
      path.join(process.cwd(), PROJECT_IDENTIFIER_FILE_NAME),
      'utf8'
    )

    const project_details =
      project_details_unparsed === '' ? {} : JSON.parse(project_details_unparsed)

    const a: string = project_details.project_id
    const b: string = project_details.project_name

    if (a && b && a.trim() !== '' && b.trim() !== '') {
      log(
        `A project with name ${yellow_bold(
          b
        )} exists in your current directory, please run ${yellow_bold(
          'envars pull'
        )} to pull the environment variables`
      )
      return
    }
  }

  const resp = await inquirer.prompt({
    name: 'project_name',
    type: 'input',
    message: 'Enter project name: ',
  })

  const projects = await get_data_from_store()

  const all_project_names = projects.map((item) => item.project_name.toLowerCase())

  if (all_project_names.includes(resp.project_name.toLowerCase())) {
    return log(`Project with name ${yellow_bold(resp.project_name)} already exists`)
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
    log(
      `${yellow_bold('.gitignore')} already exists, added ${yellow_bold(
        '.envars.json'
      )} to ${yellow_bold('.gitignore')}`
    )
    await appendFile(path.join(process.cwd(), '.gitignore'), `\n${PROJECT_IDENTIFIER_FILE_NAME}`)
  } else {
    log(`Created a ${yellow('.gitignore')} file in your project root directory`)
    await writeFile(path.join(process.cwd(), '.gitignore'), `${PROJECT_IDENTIFIER_FILE_NAME}\n`)
  }

  log(`Project ${yellow_bold(new_project.project_name)} created successfully`)
}

// TODO: create a type file that has the currently env variables types, so that the user can get some autocompelte
export const Sync = async () => {
  const project_details = await get_user_current_project_details()

  if (!project_details) {
    return
  }

  const { project_id } = project_details
  const projects = await get_data_from_store()
  const project = projects.find((item) => item.project_id === project_id)

  if (!project) {
    return log(error(`Project with id ${project_id} not found`))
  }

  const projectIndex = projects.indexOf(project)

  const env_files = await serach_env_files()
  if (env_files.length === 0) {
    return log(error('No env files found'))
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

  log(`Synced filesn\n ${env_files.map((file) => `${yellow_bold(file)} `).join('')}`)
}

export const Pull = async () => {
  const user_files = await readdir(process.cwd())
  const project_name: { value: string } = { value: '' }

  if (user_files.includes(PROJECT_IDENTIFIER_FILE_NAME)) {
    const resp = await get_user_current_project_details()
    if (!resp || !resp.project_id.trim() || !resp.project_name.trim()) {
      return
    }
    project_name.value = resp.project_name
  }

  const store_data = await get_data_from_store()

  if (!project_name.value) {
    const choices = store_data.map((item) => item.project_name)
    const ans = await inquirer.prompt({
      type: 'list',
      name: 'project_name',
      message: 'Select project to pull from: ',
      choices,
    })
    project_name.value = ans.project_name
  }

  if (project_name.value.trim() === '') {
    log(error('Project name is empty'))
    return
  }

  const project = store_data.find(
    (item) => item.project_name.toLowerCase() === project_name.value.toLowerCase()
  )

  if (!project) {
    return log(error(`Project with name ${project_name.value} not found`))
  }

  await writeFile(
    path.join(process.cwd(), PROJECT_IDENTIFIER_FILE_NAME),
    JSON.stringify({
      project_id: project.project_id,
      project_name: project.project_name,
    })
  )

  if (user_files.includes('.gitignore')) {
    log(
      `${yellow('.gitignore')} already exists, added ${yellow('.envars.json')} to ${yellow(
        '.gitignore'
      )}`
    )
    await appendFile(path.join(process.cwd(), '.gitignore'), `\n${PROJECT_IDENTIFIER_FILE_NAME}`)
  } else {
    log(`Created a ${yellow('.gitignore')} file in your project root directory`)
    await writeFile(path.join(process.cwd(), '.gitignore'), `${PROJECT_IDENTIFIER_FILE_NAME}\n`)
  }

  const env_files = project.items.map((item) => item.file_name)

  const file_write_promises = env_files.map(async (file_name) => {
    const env_file = project.items.filter((item) => item.file_name === file_name)[0]
    const content = env_file.envars.map((item) => `${item.key}=${item.value}`).join('\n')

    await writeFile(path.join(process.cwd(), file_name), content)
    return file_name
  })

  await Promise.all(file_write_promises)
  log(`Pulled Files \n ${env_files.map((file) => `${yellow_bold(file)} `).join('')}`)
}

export const List = async () => {
  const data = await get_data_from_store()

  if (data.length === 0) {
    return log(error("No Projects found, try creating one using 'new' command"))
  }

  log('Your Projects')
  data.forEach((i) => {
    log(yellow_bold(`${i.project_name}\n`))
  })
}

export const Delete = async () => {
  const projects = await get_data_from_store()

  if (projects.length === 0) {
    return log(error("No Projects found, try creating one using 'new' command"))
  }

  const resp = await inquirer.prompt({
    name: 'to_delete',
    message: 'Enter project name to delete: ',
    type: 'list',
    choices: projects.map((item) => item.project_name),
  })

  const updated_projects = projects.filter((item) => item.project_name !== resp.to_delete)

  await writeFile(
    DATA_FILE_PATH,
    JSON.stringify(updated_projects.length > 0 ? updated_projects : []),
    'utf8'
  )
  try {
    await unlink(path.join(process.cwd(), PROJECT_IDENTIFIER_FILE_NAME))
  } catch (err) {
    //
  }

  log(`Project ${yellow_bold(resp.to_delete)} deleted successfully`)
}
