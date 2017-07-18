import * as fs from "fs"
import {resolve, relative, join, dirname, basename, sep} from "path"

import * as esprima from "esprima"
import * as escodegen from "escodegen"
import * as estraverse from "estraverse"
import {Program, Node, CallExpression} from "estree"

import * as combine from "combine-source-map"
import * as convert from "convert-source-map"
const merge = require("merge-source-map")

import {prelude, plugin_prelude} from "./prelude"

const str = JSON.stringify
const exists = fs.existsSync
const write = fs.writeFileSync
const is_dir = (path: string) => fs.statSync(path).isDirectory()
const to_obj = <T>(map: Map<string, T>): {[key: string]: T} => {
  const obj = Object.create(null)
  for (const [key, val] of map) {
    obj[key] = val
  }
  return obj
}

export class Bundle {
  constructor(readonly source: string, readonly sourcemap: any, readonly modules: Map<string, number>) {}

  full_source(name: string) {
    return `${this.source}\n${convert.generateMapFileComment(name)}\n`
  }

  get module_names() {
    return Array.from(this.modules.keys())
  }

  write(path: string): void {
    const dir = dirname(path)
    const name = basename(path, ".js")
    write(path, this.full_source(name + ".js.map"))
    write(join(dir, name + ".js.map"), JSON.stringify(this.sourcemap))
    write(join(dir, name + ".json"), JSON.stringify(this.module_names))
  }
}

export interface LinkerOpts {
  entries: string[]
  bases?: string[]
  excludes?: string[]
  sourcemaps?: boolean
}

export class Linker {
  readonly entries: string[]
  readonly bases: string[]
  readonly excludes: Set<string>
  readonly sourcemaps: boolean

  constructor(opts: LinkerOpts) {
    this.entries = opts.entries
    this.bases = (opts.bases || []).map((path) => resolve(path))
    this.excludes = new Set((opts.excludes || []).map((path) => resolve(path)))
    this.sourcemaps = opts.sourcemaps || false

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

  link(): Bundle[] {
    const modules = this.walk()

    const [main, ...plugins] = this.entries

    const dirnames = plugins.map((plugin) => dirname(plugin))
    const is_excluded = (file: string) => {
      return dirnames.filter((e) => file.startsWith(e)).length !== 0
    }

    const main_files = this.reachable(modules, main, is_excluded)
    const parents = new Set(main_files)

    const plugin_files: string[][] = []

    for (const plugin of plugins) {
      const files = this.reachable(modules, plugin, parents.has.bind(parents))
      plugin_files.push(files)
    }

    const module_map = new Map<string, number>()
    let i = 0

    for (const file of main_files.concat(...plugin_files)) {
      module_map.set(file, i++)
    }

    const newlines = (source: string): number => {
      const result = source.match(/\n/g)
      return result != null ? result.length : 0
    }

    const bundle = (entry: string, files: string[], prelude: string,
        prefix: string, suffix: string, wrap: (id: number, source: string) => string) => {
      let line = 0
      let sources: string = ""
      const sourcemap = combine.create()
      const exported = new Map<string, number>()

      sources += `${prelude}(${prefix}\n`
      line += newlines(sources)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const last = i === files.length - 1

        const mod = modules.get(file)!
        mod.rewrite_deps(module_map)

        const id = module_map.get(file)!
        if (!mod.is_external)
          exported.set(mod.canonical, id)

        const start = wrap(id, `/* ${mod.canonical} */ function(require, module, exports) {\n`)
        sources += start
        line += newlines(start)

        const source_with_sourcemap = mod.source
        const source = combine.removeComments(source_with_sourcemap)
        sources += source
        sourcemap.addFile({source: source_with_sourcemap, sourceFile: file}, {line: line})
        line += newlines(source)

        const end = `}${last ? "" : ","}\n`
        sources += end
        line += newlines(end)
      }

      const aliases = JSON.stringify(to_obj(exported))
      const entry_id = module_map.get(entry)!
      sources += `${suffix}, ${aliases}, ${entry_id});\n})\n`

      const obj = convert.fromBase64(sourcemap.base64()).toObject()
      return new Bundle(sources, obj, exported)
    }

    const main_bundle = bundle(main, main_files, prelude, "[", "]", (_, source) => source)

    const plugin_bundles: Bundle[] = []
    for (let j = 0; j < plugins.length; j++) {
      const plugin_bundle = bundle(plugins[j], plugin_files[j], plugin_prelude, "{", "}", (id, source) => `${id}: ${source}`)
      plugin_bundles.push(plugin_bundle)
    }

    return [main_bundle].concat(plugin_bundles)
  }

  walk(): Map<string, Module> {
    const visited = new Map<string, Module>()
    const pending = new Set<string>(this.entries)

    while (pending.size > 0) {
      const file = pending.values().next().value
      pending.delete(file)

      const mod = new Module(file, this)
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
export type Canonical = (file: string) => string

export class Module {
  readonly input: string
  readonly ast: Program
  readonly deps = new Map<string, string>()

  constructor(readonly file: string, protected readonly linker: Linker) {
    this.input = fs.readFileSync(this.file, "utf8")
    this.ast = this.parse()

    for (const dep of this.collect_deps()) {
      this.deps.set(dep, linker.resolve(dep, this))
    }
  }

  get is_external(): boolean {
    return this.file.split(sep).indexOf("node_modules") !== -1
  }

  get canonical(): string {
    for (const base of this.linker.bases) {
      const path = relative(base, this.file)
      if (!path.startsWith("..")) {
        return path.replace(/\.js$/, "")
      }
    }

    throw new Error(`unable to compute canonical representation of ${this.file}`)
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
    const ast: any = esprima.parse(this.input, {comment: true, loc: true, range: true, tokens: true})
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
    estraverse.replace(this.ast, {
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
        return node
      }
    })
  }

  get source(): string {
    if (!this.linker.sourcemaps || this.is_external) {
      const source = escodegen.generate(this.ast, {comment: true})
      return convert.removeMapFileComments(source)
    } else {
      const old_map = convert.fromMapFileSource(this.input, dirname(this.file))
      const result: any = escodegen.generate(this.ast, {
        comment: true,
        sourceMap: old_map ? old_map.getProperty("sources")[0] : basename(this.file),
        sourceMapWithCode: true,
        sourceContent: this.input,
      })
      const new_map = JSON.parse(result.map.toString())
      const map = old_map ? merge(old_map.toObject(), new_map) : new_map
      const source = convert.removeMapFileComments(result.code)
      const comment = convert.fromObject(map).toComment()
      return `${source}\n${comment}\n`
    }
  }
}
