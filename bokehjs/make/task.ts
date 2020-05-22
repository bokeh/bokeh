import chalk from "chalk"

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

export class BuildError extends Error {
  constructor(readonly component: string, message: string) {
    super(message)
  }
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
  const error = failure.value
  if (error instanceof BuildError) {
    log(`${chalk.red("failed:")} ${error.message}`)
  } else {
    print(error.stack ?? error.toString())
  }
}

export type Fn<T> = (...args: unknown[]) => Promise<Result<T> | void>

class Task<T = unknown> {
  constructor(readonly name: string,
              readonly deps: string[],
              readonly fn?: Fn<T>) {}

  get task_deps(): Task<unknown>[] {
    return this.deps.map((dep) => {
      const task = tasks.get(dep)
      if (task != null)
        return task
      else
        throw new Error(`can't resolve ${dep} task`)
    })
  }
}

const tasks = new Map<string, Task>()

export function task2<T, T0>        (name: string, deps: [Task<T0>],                     fn: (v0: T0)                 => Promise<Result<T>>): Task<T>
export function task2<T, T0, T1>    (name: string, deps: [Task<T0>, Task<T1>],           fn: (v0: T0, v1: T1)         => Promise<Result<T>>): Task<T>
export function task2<T, T0, T1, T2>(name: string, deps: [Task<T0>, Task<T1>, Task<T2>], fn: (v0: T0, v1: T1, v2: T2) => Promise<Result<T>>): Task<T>

export function task2<T, Args extends unknown[]>(name: string, deps: Task<unknown>[], fn: (...args: Args) => Promise<Result<T>>): Task<T> {
  return task(name, deps.map((dep) => dep.name), fn)
}

export function task<T>(name: string, deps: string[] | Fn<T>, fn?: Fn<T>): Task<T> {
  if (!Array.isArray(deps)) {
    fn = deps
    deps = []
  }

  const task = new Task<T>(name, deps, fn)
  tasks.set(name, task)
  return task
}

export function task_names(): string[] {
  return Array.from(tasks.keys())
}

function* resolve_task(name: string, parent?: Task): Iterable<Task> {
  const [prefix, suffix] = name.split(":", 2)

  if (prefix == "*") {
    for (const task of tasks.values()) {
      if (task.name.endsWith(`:${suffix}`)) {
        yield task
      }
    }
  } else if (tasks.has(name)) {
    yield tasks.get(name)!
  } else {
    let message = `unknown task '${chalk.cyan(name)}'`
    if (parent != null)
      message += ` referenced from '${chalk.cyan(parent.name)}'`
    throw new BuildError("build", message)
  }
}

export async function run(...names: string[]): Promise<Result> {
  const finished = new Map<Task, Result>()

  async function exec_task(task: Task): Promise<Result> {
    if (task.fn == null) {
      log(`Finished '${chalk.cyan(task.name)}'`)
      return success(undefined)
    } else {
      log(`Starting '${chalk.cyan(task.name)}'...`)

      const args = []
      for (const dep of task.task_deps) {
        const result = finished.get(dep)
        if (result != null && result.is_Success())
          args.push(result.value)
        else
          throw new Error(`${dep} value is not available for ${task.name}`)
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
      log(`${result.is_Success() ? "Finished" : chalk.red("Failed")} '${chalk.cyan(task.name)}' after ${chalk.magenta(duration)}`)
      return result
    }
  }

  async function _run(task: Task): Promise<Result> {
    if (finished.has(task)) {
      return finished.get(task)!
    } else {
      let failed = false

      for (const name of task.deps) {
        for (const dep of resolve_task(name, task)) {
          const result = await _run(dep)
          if (result.is_Failure())
            failed = true
        }
      }

      let result: Result
      if (!failed)
        result = await exec_task(task)
      else
        result = failure(new BuildError(task.name, `task '${chalk.cyan(task.name)}' failed`))

      finished.set(task, result)

      if (result.is_Failure()) {
        show_failure(result)
      }

      return result
    }
  }

  for (const name of names) {
    for (const task of resolve_task(name)) {
      const result = await _run(task)
      if (result.is_Failure())
        return result
    }
  }

  return success(undefined)
}
