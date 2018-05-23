import chalk from "chalk"
import {array as toposort} from "toposort"

export class BuildError extends Error {
  constructor(readonly component: string, message: string) {
    super(message)
  }
}

export function log(message: string): void {
  const now = new Date().toTimeString().split(" ")[0]
  console.log(`[${chalk.gray(now)}] ${message}`)
}

export type Fn<T> = () => Promise<T>

class Task<T> {
  constructor(readonly name: string,
              readonly deps: string[],
              readonly fn?: Fn<T>) {}
}

const tasks = new Map()

export function task<T>(name: string, deps: string[] | Fn<T>, fn?: Fn<T>): void {
  if (!Array.isArray(deps)) {
    fn = deps
    deps = []
  }

  const t = new Task<T>(name, deps, fn)
  tasks.set(name, t)
}

export function task_names(): string[] {
  return Array.from(tasks.keys())
}

export async function run(name: string): Promise<void> {
  const task = tasks.get(name)

  if (task == null)
    throw new Error(`unknown task: ${name}`)

  const nodes: Set<Task<any>> = new Set()
  const edges: [Task<any>, Task<any>][] = []

  function build_graph(task: Task<any>): void {
    nodes.add(task)

    for (const dep of task.deps) {
      const task_dep = tasks.get(dep)
      if (task_dep != null) {
        edges.push([task_dep, task]) // before -> after
        build_graph(task_dep)
      } else
        throw new Error(`unknown task '${chalk.cyan(dep)}' referenced from '${chalk.cyan(name)}'`)
    }
  }

  build_graph(task)

  const ordered_tasks = toposort(Array.from(nodes), edges)

  for (const task of ordered_tasks) {
    if (task.fn == null)
      log(`Finished '${chalk.cyan(task.name)}'`)
    else {
      log(`Starting '${chalk.cyan(task.name)}'...`)
      const start = Date.now()
      await task.fn()
      const end = Date.now()
      const diff = end - start
      const duration = diff >= 1000 ? `${(diff / 1000).toFixed(2)} s` : `${diff} ms`
      log(`Finished '${chalk.cyan(task.name)}' after ${chalk.magenta(duration)}`)
    }
  }
}
