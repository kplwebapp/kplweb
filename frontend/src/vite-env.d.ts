/// <reference types="vite/client" />

declare module '*.yml' {
  const content: Record<string, string>
  export default content
}

declare module '*.yaml' {
  const content: Record<string, string>
  export default content
}
