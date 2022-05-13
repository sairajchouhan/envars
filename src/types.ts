export interface Project {
  project_id: string
  project_name: string
  items: Array<EnvFile>
}

export interface EnvFile {
  file_name: string
  envars: Array<EnvVarKeyValuePair>
}

export interface EnvVarKeyValuePair {
  key: string
  value: string
}
