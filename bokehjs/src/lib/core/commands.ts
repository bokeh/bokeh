import type {Model} from "model"
import type {Document} from "document"
import type {Kind} from "./kinds"
import type {Dict} from "./types"
import {dict} from "./util/object"
import {logger} from "./logging"

/**
 * Resolved arguments passed to a command's handler.
 */
export type CommandArgs = {[name: string]: unknown}

/**
 * Arguments as provided by the caller (e.g. a key binding). May be a plain
 * object or a `Map` (e.g. when deserialized).
 */
export type GivenArgs = Dict<unknown>

/**
 * Declaration of a single command argument.
 *
 * An argument without a `default` value is required.
 */
export type CommandArg = {
  name: string
  type: Kind<unknown>
  default?: unknown
  description?: string
}

/**
 * A named operation that can be invoked by key bindings, the command line
 * or programmatically. Multiple providers may contribute a command with
 * the same name (e.g. several selection tools providing `clear_selection`),
 * in which case the first enabled provider (see `when`) is used.
 */
export type Command = {
  name: string
  description: string
  args?: CommandArg[]
  when?: () => boolean
  execute: (args: CommandArgs) => void | Promise<void>
  origin: Document | Model
}

export class CommandError extends Error {
  override name = "CommandError"
}

export class CommandRegistry {
  protected readonly _commands: Map<string, Command[]> = new Map()

  /**
   * Registers a command. Returns a function that unregisters it.
   */
  register(command: Command): () => void {
    const {name} = command
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new CommandError(`invalid command name '${name}'`)
    }
    const providers = this._commands.get(name)
    if (providers == null) {
      this._commands.set(name, [command])
    } else {
      providers.push(command)
    }
    return () => this.unregister(command)
  }

  unregister(command: Command): void {
    const providers = this._commands.get(command.name)
    if (providers != null) {
      const i = providers.indexOf(command)
      if (i != -1) {
        providers.splice(i, 1)
      }
      if (providers.length == 0) {
        this._commands.delete(command.name)
      }
    }
  }

  has(name: string): boolean {
    return this._commands.has(name)
  }

  /**
   * All registered commands, including multiple providers of the same name.
   */
  get commands(): Command[] {
    return [...this._commands.values()].flat()
  }

  get names(): string[] {
    return [...this._commands.keys()]
  }

  /**
   * Returns the first provider of the given command, preferring enabled ones.
   */
  get(name: string): Command | null {
    const providers = this._commands.get(name)
    if (providers == null) {
      return null
    }
    return providers.find((command) => is_enabled(command)) ?? providers[0]
  }

  /**
   * Returns the first enabled provider of the given command.
   */
  resolve(name: string): Command | null {
    const providers = this._commands.get(name) ?? []
    return providers.find((command) => is_enabled(command)) ?? null
  }

  is_enabled(name: string): boolean {
    return this.resolve(name) != null
  }

  async execute(name: string, args: GivenArgs = {}): Promise<void> {
    if (!this.has(name)) {
      throw new CommandError(`unknown command '${name}'`)
    }
    const command = this.resolve(name)
    if (command == null) {
      throw new CommandError(`command '${name}' is not available`)
    }
    const resolved_args = resolve_args(command, args)
    await command.execute(resolved_args)
  }

  /**
   * Like `execute()`, but reports errors instead of throwing them.
   */
  try_execute(name: string, args: GivenArgs = {}, report: (error: Error) => void = default_report): void {
    this.execute(name, args).catch((error: unknown) => {
      report(error instanceof Error ? error : new Error(`${error}`))
    })
  }
}

function default_report(error: Error): void {
  logger.error(error.message)
}

function is_enabled(command: Command): boolean {
  return command.when == null || command.when()
}

/**
 * Validates provided arguments against command's declaration and fills
 * in default values.
 */
export function resolve_args(command: Command, args: GivenArgs): CommandArgs {
  const declared = command.args ?? []
  const known = new Set(declared.map((arg) => arg.name))
  const given = dict(args)

  for (const name of given.keys()) {
    if (!known.has(name)) {
      throw new CommandError(`command '${command.name}' doesn't accept argument '${name}'`)
    }
  }

  const resolved: CommandArgs = {}
  for (const arg of declared) {
    if (given.has(arg.name)) {
      const value = given.get(arg.name)
      if (!arg.type.valid(value)) {
        throw new CommandError(`invalid value of argument '${arg.name}' of command '${command.name}'; expected ${arg.type}, got ${value}`)
      }
      resolved[arg.name] = value
    } else if ("default" in arg) {
      resolved[arg.name] = arg.default
    } else {
      throw new CommandError(`command '${command.name}' requires argument '${arg.name}'`)
    }
  }
  return resolved
}
