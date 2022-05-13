import path from 'path'
import { get_random_string } from './utils'
import { readFile, writeFile, appendFile, readdir } from 'fs/promises'
import inquirer from 'inquirer'
import { DATA_FILE_PATH, PROJECT_IDENTIFIER_FILE_NAME } from './constants'

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

export const New = async () => {
  // check if user already has .envars.json file
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
      ` ${PROJECT_IDENTIFIER_FILE_NAME}\n`
    )
  }

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

New().catch((err) => console.error(err))
