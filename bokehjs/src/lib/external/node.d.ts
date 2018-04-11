declare module "fs" {
  export function existsSync(path: string): boolean
}

declare module "path" {
  export function join(...paths: string[]): string
  export function dirname(p: string): string
}
