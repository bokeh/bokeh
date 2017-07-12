import * as fs from "fs"
import {resolve, join, dirname} from "path"

import * as esprima from "esprima"
import * as escodegen from "escodegen"
import * as estraverse from "estraverse"
import {Program, Node, CallExpression} from "estree"

import {canonical} from "./labeler"

const str = JSON.stringify
const exists = fs.existsSync
const is_dir = (path: string) => fs.statSync(path).isDirectory()

const prelude = (entry: number, modules: string) => {
  return `\
(function(modules, entry) {
  var cache = {};

  var require = function(name) {
    if (!cache[name]) {
      if (!modules[name]) {
        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      var module = cache[name] = {exports: {}};
      modules[name].call(module.exports, require, module, module.exports);
    }

    return cache[name].exports;
  }

  var main = require(entry);
  main.require = require;

  main.register_plugin = function(plugin_modules, plugin_entry) {
    for (var name in plugin_modules) {
      modules[name] = plugin_modules[name];
    }

    var plugin = require(plugin_entry);

    for (var name in plugin) {
      main[name] = plugin[name];
    }
  }

  return main;
})(${modules}, ${entry});
`
}

const plugin_prelude = (entry: number, modules: string) => {
  return `\
(function(modules, entry) {
  if (Bokeh != null) {
    Bokeh.register_plugin(modules, entry);
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})(${modules}, ${entry});
`
}

export interface LinkerOpts {
  entries: string[]
  bases?: string[]
  excludes?: string[]
}

export class Linker {
  readonly entries: string[]
  readonly bases: string[]
  readonly excludes: Set<string>

  constructor(opts: LinkerOpts) {
    this.entries = opts.entries
    this.bases = (opts.bases || []).map((path) => resolve(path))
    this.excludes = new Set((opts.excludes || []).map((path) => resolve(path)))

    for (const base of this.bases) {
      if (!exists(base) || !is_dir(base))
        throw new Error(`base path ${base} doesn't exist or isn't a directory`)
    }
  }

  reachable(modules: Map<string, Module>, entry: string, is_excluded: (file: string) => boolean): string[] {
    const visited = new Set<string>()
    const pending = new Set<string>([entry])

    while (pending.size > 0) {
      const file = pending.values().next().value
      pending.delete(file)

      const mod = modules.get(file)!
      visited.add(file)

      for (const [_, file] of mod.deps) {
        if (!visited.has(file) && !this.excludes.has(file) && !is_excluded(file))
          pending.add(file)
      }
    }

    return Array.from(visited).sort()
  }

  link(): {bundles: string[], modules: {[key: string]: number}} {
    const modules = this.walk()

    const [main, ...plugins] = this.entries

    const dirnames = plugins.map((plugin) => dirname(plugin))
    const is_excluded = (file: string) => {
      return dirnames.filter((e) => file.startsWith(e)).length !== 0
    }

    const main_bundle = this.reachable(modules, main, is_excluded)
    const parents = new Set(main_bundle)

    const plugin_bundles: string[][] = []

    for (const plugin of plugins) {
      const bundle = this.reachable(modules, plugin, parents.has.bind(parents))
      plugin_bundles.push(bundle)
    }

    const module_map = new Map<string, number>()
    let i = 0

    for (const file of main_bundle.concat(...plugin_bundles)) {
      module_map.set(file, i++)
    }

    const sources = (bundle: string[]): [number, string][] => {
      const result: [number, string][] = []
      for (const file of bundle) {
        const mod = modules.get(file)!
        mod.rewrite_deps(module_map)
        result.push([module_map.get(file)!, mod.closure])
      }
      return result
    }

    const source = `[\n${sources(main_bundle).map(([_, code]) => code).join(",\n")}\n]`
    const main_source = prelude(module_map.get(main)!, source)

    const plugin_sources: string[] = []
    for (let j = 0; j < plugins.length; j++) {
      const plugin = plugins[j]
      const bundle = plugin_bundles[j]
      const source = `{\n${sources(bundle).map(([id, code]) => `${id}: ${code}`).join(",\n")}\n}`
      const plugin_source = plugin_prelude(module_map.get(plugin)!, source)
      plugin_sources.push(plugin_source)
    }

    const _modules: {[key: string]: number} = {}
    for (const [file, id] of module_map) {
      _modules[modules.get(file)!.canonical] = id
    }

    return {
      bundles: [main_source].concat(plugin_sources),
      modules: _modules,
    }
  }

  walk(): Map<string, Module> {
    const visited = new Map<string, Module>()
    const pending = new Set<string>(this.entries)

    while (pending.size > 0) {
      const file = pending.values().next().value
      pending.delete(file)

      const mod = new Module(file, this.resolve.bind(this))
      visited.set(mod.file, mod)

      for (const [_, file] of mod.deps) {
        if (!visited.has(file) && !this.excludes.has(file))
          pending.add(file)
      }
    }

    return visited
  }

  protected readonly ext = ".js"

  protected resolve_relative(dep: string, parent: Module): string {
    const path = resolve(parent.dir, dep)
    const file = path + this.ext

    if (exists(file))
      return file
    else if (exists(path) && is_dir(path)) {
      const file = join(path, "index" + this.ext)
      if (exists(file))
        return file
    }

    throw new Error(`can't resolve '${dep}' from '${parent.file}'`)
  }

  protected resolve_absolute(dep: string, parent: Module): string {
    for (const base of this.bases) {
      const path = join(base, dep)
      const file = path + this.ext

      if (exists(file))
        return file
      else if (exists(path) && is_dir(path)) {
        let index = "index" + this.ext

        const pkg_path = join(path, "package.json")
        if (exists(pkg_path)) {
          const pkg = JSON.parse(fs.readFileSync(pkg_path, "utf8"))
          if (pkg.main != null)
            index = pkg.main
        }

        let file = join(path, index)
        if (exists(file))
          return file
        else {
          file += this.ext
          if (exists(file))
            return file
        }
      }
    }

    throw new Error(`can't resolve '${dep}' from '${parent.file}'`)
  }

  resolve(dep: string, parent: Module): string {
    if (dep[0] === ".")
      return this.resolve_relative(dep, parent)
    else
      return this.resolve_absolute(dep, parent)
  }
}

export type Resolver = (dep: string, parent: Module) => string

export class Module {
  readonly ast: Program
  readonly deps = new Map<string, string>()

  constructor(readonly file: string, resolve: Resolver) {
    this.ast = this.parse()

    for (const dep of this.collect_deps()) {
      this.deps.set(dep, resolve(dep, this))
    }
  }

  get canonical(): string {
    return canonical(this.file)
  }

  get dir(): string {
    return dirname(this.file)
  }

  toString(): string {
    const deps: {[key: string]: string} = {}
    for (const [dep, file] of this.deps) {
      deps[dep] = file
    }
    return `Module(${str(this.file)}, ${str(deps)})`
  }

  protected parse(): Program {
    const source = fs.readFileSync(this.file, "utf8")
    const ast: any = esprima.parse(source, {comment: true, range: true, tokens: true})
    return escodegen.attachComments(ast, ast.comments, ast.tokens)
  }

  protected is_require(node: Node): node is CallExpression {
    return node.type === "CallExpression" &&
           node.callee.type === "Identifier" && node.callee.name === "require" &&
           node.arguments.length === 1
  }

  protected collect_deps(): string[] {
    const deps: string[] = []
    estraverse.traverse(this.ast, {
      enter: (node) => {
        if (this.is_require(node)) {
          const [arg] = node.arguments
          if (arg.type === "Literal" && typeof arg.value === "string" && arg.value.length > 0)
            deps.push(arg.value)
        }
      }
    })
    return deps
  }

  rewrite_deps(module_map: Map<string, number>): void {
    estraverse.traverse(this.ast, {
      enter: (node) => {
        if (this.is_require(node)) {
          const [arg] = node.arguments
          if (arg.type === "Literal" && typeof arg.value === "string" && arg.value.length > 0) {
            const dep = arg.value
            const val = module_map.get(this.deps.get(dep)!)
            arg.value = val != null ? val : dep
            const comment = {type: "Block", value: ` ${dep} `}
            if (arg.trailingComments == null)
              arg.trailingComments = [comment]
            else
              arg.trailingComments.push(comment)
          }
        }
      }
    })
  }

  get source(): string {
    return escodegen.generate(this.ast, {comment: true})
  }

  get closure(): string {
    return `/* ${this.canonical} */ function(require, module, exports) {\n${this.source}\n}`
  }
}
