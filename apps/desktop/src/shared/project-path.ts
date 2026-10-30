// The project editor's URL: "/project/:projectId", where the id is the folder, URL-encoded.
export const projectPath = (dir: string) => `/project/${encodeURIComponent(dir)}`
