import { writeFile, mkdir, readdir } from 'fs/promises'
import path from 'path'

const home =
  process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME

const data_dir_path = path.join(home || '~/', '.envars')

export const setup = async () => {
  try {
    const resp = await readdir(data_dir_path)

    if (!resp.includes('data.json')) {
      await writeFile(path.join(data_dir_path, 'data.json'), '')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await mkdir(data_dir_path)
      await writeFile(path.join(data_dir_path, 'data.json'), '')
    }
  }
}

setup()
