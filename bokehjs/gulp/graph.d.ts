declare module "toposort" {
  export function array<T>(nodes: T[], edges: [T, T][]): T[]
}
