import type { Plugin } from 'vite'

function parseFlatYaml(source: string): Record<string, string> {
  const result: Record<string, string> = {}

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const colon = trimmed.indexOf(':')
    if (colon === -1) continue

    const key = trimmed.slice(0, colon).trim()
    let value = trimmed.slice(colon + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

export function yamlPlugin(): Plugin {
  return {
    name: 'yaml-flat',
    transform(code, id) {
      if (!id.endsWith('.yml') && !id.endsWith('.yaml')) return

      const parsed = parseFlatYaml(code)
      return {
        code: `export default ${JSON.stringify(parsed)}`,
        map: null,
      }
    },
  }
}
