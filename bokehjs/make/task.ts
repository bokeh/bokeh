import chalk from "chalk"

import {BuildError} from "@compiler/error"
export {BuildError}

function join(items: string[], sep0: string, sep1: string): string {
  if (items.length <= 1) {
    return items.join("")
  } else {
    return `${items.slice(0, -1).join(sep0)}${sep1}${items[items.length-1]}`
  }
}

export type Result<T = unknown> = Success<T> | Failure<T>

export class Success<T> {
  constructor(readonly value: T) {}

  is_Success(): this is Success<T> {
    return true
  }

  is_Failure(): this is Failure<T> {
    return false
  }
}

export class Failure<T> {
  constructor(readonly value: Error) {}

  is_Success(): this is Success<T> {
    return false
  }

  is_Failure(): this is Failure<T> {
    return true
  }
}

export function success<T>(value: T): Result<T> {
  return new Success(value)
}

export function failure<T>(error: Error): Result<T> {
  return new Failure<T>(error)
}

export function log(message: string): void {
  const now = new Date().toTimeString().split(" ")[0]
  console.log(`[${chalk.gray(now)}] ${message}`)
}

export function print(message: string): void {
  for (const line of message.split("\n")) {
    log(line)
  }
}

export function show_failure(failure: Failure<unknown>): void {
  show_error(failure.value)
}

export function show_error(error: Error): void {
  if (error instanceof BuildError) {
    log(`${chalk.red("failed:")} ${error.message}`)
  } else {
    print(`${chalk.red("failed:")} ${error.stack ?? error.toString()}`)
  }
}

export type Fn<T> = (...args: unknown[]) => Promise<Result<T> | void>

class Task<T = unknown> {
  constructor(readonly name: string,
              readonly deps: Dependency[],
              readonly fn?: Fn<T>) {}

  toString(): string {
    return this.name
  }
}

const tasks = new Map<string, Task>()

export function task2<T, T0>        (name: string, deps: [Task<T0>],                     fn: (v0: T0)                 => Promise<Result<T>>): Task<T>
export function task2<T, T0, T1>    (name: string, deps: [Task<T0>, Task<T1>],           fn: (v0: T0, v1: T1)         => Promise<Result<T>>): Task<T>
export function task2<T, T0, T1, T2>(name: string, deps: [Task<T0>, Task<T1>, Task<T2>], fn: (v0: T0, v1: T1, v2: T2) => Promise<Result<T>>): Task<T>

export function task2<T, Args extends unknown[]>(name: string, deps: Task<unknown>[], fn: (...args: Args) => Promise<Result<T>>): Task<T> {
  return task(name, deps.map((dep) => dep.name), fn)
}

export type TaskLike = string | Task
export type DependencyLike = TaskLike | Dependency

function _resolve_dep(dep: DependencyLike): Dependency {
  if (dep instanceof Dependency)
    return dep
  else
    return new Dependency(_resolve_task(dep))
}

function _resolve_task(dep: TaskLike): Task {
  if (dep instanceof Task)
    return dep
  else {
    const task = tasks.get(dep)
    if (task != null)
      return task
    else
      throw new BuildError("tasks", `can't resolve ${dep} task`)
  }
}

export function task<T>(name: string, deps: DependencyLike[] | Fn<T>, fn?: Fn<T>): Task<T> {
  if (!Array.isArray(deps)) {
    fn = deps
    deps = []
  }

  const task = new Task<T>(name, deps.map(_resolve_dep), fn)
  tasks.set(name, task)
  return task
}
export function task_names(): string[] {
  return Array.from(tasks.keys())
}

export function passthrough(dep: TaskLike): Dependency {
  return new Dependency(_resolve_task(dep), true)
}

class Dependency {
  constructor(readonly task: Task, readonly passthrough: boolean = false) {}
}

export async function run(task: Task): Promise<Result> {
  const finished = new Map<Task, Result>()
  const failures: Task[] = []

  async function exec_task(task: Task): Promise<Result> {
    if (task.fn == null) {
      log(`Finished '${chalk.cyan(task.name)}'`)
      return success(undefined)
    } else {
      log(`Starting '${chalk.cyan(task.name)}'...`)

      const args = []
      for (const dep of task.deps) {
        const result = finished.get(dep.task)
        if (result != null && result.is_Success())
          args.push(result.value)
        else if (dep.passthrough)
          args.push(undefined)
        else
          throw new Error(`${dep} value is not available for ${task}`)
      }

      const start = Date.now()
      let result: Result
      try {
        const value = await task.fn(...args)
        result = value === undefined ? success(value) : value
      } catch (error) {
        result = failure(error)
      }
      const end = Date.now()
      const diff = end - start
      const duration = diff >= 1000 ? `${(diff / 1000).toFixed(2)} s` : `${diff} ms`
      log(`Finished '${chalk.cyan(task.name)}' after ${chalk.magenta(duration)}`)
      return result
    }
  }

  function fail(failures: Task[]): Result {
    const names = join(failures.map((dep_task) => `'${chalk.cyan(dep_task.name)}'`), ", ", " and ")
    return failure(new BuildError(task.name, `task '${chalk.cyan(task.name)}' failed because ${names} failed`))
  }

  async function _run(task: Task, passthrough: boolean): Promise<Result> {
    if (finished.has(task)) {
      return finished.get(task)!
    } else {
      const failed_deps = []

      for (const dep of task.deps) {
        const result = await _run(dep.task, dep.passthrough)
        if (result.is_Failure()) {
          show_failure(result)
          failed_deps.push(dep.task)
        }
      }

      let result: Result
      if (failed_deps.length == 0) {
        result = await exec_task(task)
      } else {
        result = fail(failed_deps)
      }

      if (result.is_Failure()) {
        show_failure(result)

        if (passthrough) {
          result = success(undefined)
          failures.push(task)
        }
      }

      finished.set(task, result)
      return result
    }
  }

  const result = await _run(task, false)
  if (result.is_Success && failures.length != 0)
    return fail(failures)
  else
    return result
}
