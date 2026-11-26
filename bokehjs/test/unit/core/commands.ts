import {expect} from "#framework/assertions"

import type {Command, CommandArgs} from "@bokehjs/core/commands"
import {CommandRegistry, CommandError, resolve_args} from "@bokehjs/core/commands"
import {Float, Enum} from "@bokehjs/core/kinds"
import {Document} from "@bokehjs/document"

describe("core/commands module", () => {
  const origin = new Document()

  function command(name: string, attrs: Partial<Command> = {}): Command & {calls: CommandArgs[]} {
    const calls: CommandArgs[] = []
    return {
      name,
      description: `Command ${name}`,
      execute: (args) => { calls.push(args) },
      origin,
      ...attrs,
      calls,
    }
  }

  describe("should support CommandRegistry", () => {
    it("which allows to register and unregister commands", () => {
      const registry = new CommandRegistry()
      const cmd0 = command("cmd0")
      const cmd1 = command("cmd1")

      const unregister0 = registry.register(cmd0)
      registry.register(cmd1)

      expect(registry.has("cmd0")).to.be.true
      expect(registry.has("cmd1")).to.be.true
      expect(registry.names).to.be.equal(["cmd0", "cmd1"])
      expect(registry.get("cmd0")).to.be.identical(cmd0)

      unregister0()
      expect(registry.has("cmd0")).to.be.false
      expect(registry.get("cmd0")).to.be.null
      expect(registry.names).to.be.equal(["cmd1"])
    })

    it("which rejects invalid command names", () => {
      const registry = new CommandRegistry()
      expect(() => registry.register(command(""))).to.throw(CommandError)
      expect(() => registry.register(command("some cmd"))).to.throw(CommandError)
      expect(() => registry.register(command("0cmd"))).to.throw(CommandError)
      expect(() => registry.register(command(":cmd"))).to.throw(CommandError)
    })

    it("which executes commands by name", async () => {
      const registry = new CommandRegistry()
      const cmd = command("cmd")
      registry.register(cmd)

      await registry.execute("cmd")
      expect(cmd.calls).to.be.equal([{}])
    })

    it("which rejects unknown commands", async () => {
      const registry = new CommandRegistry()
      await expect(async () => await registry.execute("unknown")).to.throw(CommandError, "unknown command 'unknown'")
    })

    it("which resolves the first enabled provider of a command", async () => {
      const registry = new CommandRegistry()
      let enabled0 = false
      let enabled1 = true
      const cmd0 = command("cmd", {when: () => enabled0})
      const cmd1 = command("cmd", {when: () => enabled1})
      registry.register(cmd0)
      registry.register(cmd1)

      expect(registry.commands).to.be.equal([cmd0, cmd1])
      expect(registry.resolve("cmd")).to.be.identical(cmd1)

      await registry.execute("cmd")
      expect(cmd0.calls.length).to.be.equal(0)
      expect(cmd1.calls.length).to.be.equal(1)

      enabled0 = true
      expect(registry.resolve("cmd")).to.be.identical(cmd0)

      enabled0 = false
      enabled1 = false
      expect(registry.resolve("cmd")).to.be.null
      expect(registry.is_enabled("cmd")).to.be.false
      expect(registry.get("cmd")).to.be.identical(cmd0)
      await expect(async () => await registry.execute("cmd")).to.throw(CommandError, "command 'cmd' is not available")
    })

    it("which passes resolved arguments to commands", async () => {
      const registry = new CommandRegistry()
      const cmd = command("cmd", {
        args: [
          {name: "direction", type: Enum("left", "right")},
          {name: "factor", type: Float, default: 0.1},
        ],
      })
      registry.register(cmd)

      await registry.execute("cmd", {direction: "left"})
      await registry.execute("cmd", new Map<string, unknown>([["direction", "right"], ["factor", 0.5]]))
      expect(cmd.calls).to.be.equal([{direction: "left", factor: 0.1}, {direction: "right", factor: 0.5}])
    })

    it("which reports errors when using try_execute()", async () => {
      const registry = new CommandRegistry()
      const errors: string[] = []
      registry.try_execute("unknown", {}, (error) => errors.push(error.message))
      await Promise.resolve()
      await Promise.resolve()
      expect(errors).to.be.equal(["unknown command 'unknown'"])
    })
  })

  describe("should support resolve_args()", () => {
    const cmd = command("cmd", {
      args: [
        {name: "direction", type: Enum("left", "right")},
        {name: "factor", type: Float, default: 0.1},
      ],
    })

    it("which fills in default values", () => {
      expect(resolve_args(cmd, {direction: "left"})).to.be.equal({direction: "left", factor: 0.1})
    })

    it("which requires arguments without defaults", () => {
      expect(() => resolve_args(cmd, {})).to.throw(CommandError, "command 'cmd' requires argument 'direction'")
    })

    it("which rejects unknown arguments", () => {
      expect(() => resolve_args(cmd, {direction: "left", speed: 1})).to.throw(CommandError, "command 'cmd' doesn't accept argument 'speed'")
    })

    it("which validates argument types", () => {
      expect(() => resolve_args(cmd, {direction: "up"})).to.throw(CommandError, /invalid value of argument 'direction'/)
      expect(() => resolve_args(cmd, {direction: "left", factor: "fast"})).to.throw(CommandError, /invalid value of argument 'factor'/)
    })
  })
})
