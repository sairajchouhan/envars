import path from 'path'

const home =
  process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME

const DATA_DIR_PATH = path.join(home || '~/', '.envars')

const DATA_FILE_PATH = path.resolve(path.join(DATA_DIR_PATH, 'data.json'))

const PROJECT_IDENTIFIER_FILE_NAME = '.envars.json'

export { DATA_FILE_PATH, PROJECT_IDENTIFIER_FILE_NAME }
