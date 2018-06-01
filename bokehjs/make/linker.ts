import {resolve, relative, join, dirname, basename, sep} from "path"
const {_builtinLibs} = require("repl")

import * as combine from "combine-source-map"
import * as convert from "convert-source-map"

import {read, write, fileExists, directoryExists} from "./fs"
import {prelude, plugin_prelude} from "./prelude"
import {parse_es, print_es, collect_deps, rewrite_deps, add_json_export,
        remove_use_strict, remove_esmodule, wrap_in_function, SourceFile} from "./transform"

const to_obj = <T>(map: Map<string, T>): {[key: string]: T} => {
  const obj = Object.create(null)
  for (const [key, val] of map) {
    obj[key] = val
  }
  return obj
}

export class Bundle {
  constructor(readonly source: string,
              readonly sourcemap: any,
              readonly exported: Map<string, number>,
              readonly modules: Module[]) {}

  full_source(name: string) {
    return `${this.source}\n${convert.generateMapFileComment(name)}\n`
  }

  get module_names() {
    return Array.from(this.exported.keys())
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
  excludes?: string[] // paths: process, but don't include in a bundle
  ignores?: string[]  // modules: don't process at all
  builtins?: boolean
}

export class Linker {
  readonly entries: string[]
  readonly bases: string[]
  readonly excludes: Set<string>
  readonly ignores: Set<string>
  readonly builtins: boolean

  constructor(opts: LinkerOpts) {
    this.entries = opts.entries
    this.bases = (opts.bases || []).map((path) => resolve(path))
    this.excludes = new Set((opts.excludes || []).map((path) => resolve(path)))
    this.ignores = new Set(opts.ignores || [])
    this.builtins = opts.builtins || false

    if (this.builtins) {
      this.ignores.add("module")
      this.ignores.add("constants")

      for (const lib of _builtinLibs)
        this.ignores.add(lib)
    }

    for (const base of this.bases) {
      if (!directoryExists(base))
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

      for (const [, file] of mod.deps) {
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
      const bundled: Module[] = []

      sources += `${prelude}(${prefix}\n`
      line += newlines(sources)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const last = i === files.length - 1

        const mod = modules.get(file)!
        mod.rewrite_deps(module_map)
        mod.transform()

        bundled.push(mod)

        const id = module_map.get(file)!
        if (!mod.is_external)
          exported.set(mod.canonical, id)

        const start = wrap(id, "")
        sources += start
        line += newlines(start)

        const source_with_sourcemap = mod.source
        const source = combine.removeComments(source_with_sourcemap)
        sources += source
        sourcemap.addFile({source: source_with_sourcemap, sourceFile: file}, {line: line})
        line += newlines(source)

        const end = `${last ? "" : ","}\n`
        sources += end
        line += newlines(end)
      }

      const aliases = JSON.stringify(to_obj(exported))
      const entry_id = module_map.get(entry)!
      const parent_require = this.builtins ? `typeof "require" !== "undefined" && require` : "null"
      sources += `${suffix}, ${aliases}, ${entry_id}, ${parent_require});\n})\n`

      const obj = convert.fromBase64(sourcemap.base64()).toObject()
      return new Bundle(sources, obj, exported, bundled)
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

      for (const [, file] of mod.deps) {
        if (!visited.has(file) && !this.excludes.has(file))
          pending.add(file)
      }
    }

    return visited
  }

  protected readonly ext = ".js"

  protected resolve_relative(dep: string, parent: Module): string {
    const path = resolve(parent.dir, dep)

    if (fileExists(path))
      return path

    const file = path + this.ext
    const has_file = fileExists(file)

    const index = join(path, "index" + this.ext)
    const has_index = fileExists(index)

    if (has_file && has_index)
      throw new Error(`both ${file} and ${index} exist, remove one of them or clean the build and recompile`)
    else if (has_file)
      return file
    else if (has_index)
      return index
    else
      throw new Error(`can't resolve '${dep}' from '${parent.file}'`)
  }

  protected resolve_absolute(dep: string, parent: Module): string {
    const resolve_with_index = (path: string): string | null => {
      let index = "index" + this.ext

      const pkg_path = join(path, "package.json")
      if (fileExists(pkg_path)) {
        const pkg = JSON.parse(read(pkg_path)!)
        if (pkg.main != null)
          index = pkg.main
      }

      let file = join(path, index)
      if (fileExists(file))
        return file
      else {
        file += this.ext
        if (fileExists(file))
          return file
      }

      return null
    }

    for (const base of this.bases) {
      let path = join(base, dep)
      const file = path + this.ext

      if (fileExists(file))
        return file

      if (directoryExists(path)) {
        const file = resolve_with_index(path)
        if (file != null)
          return file
      }

      if (parent.file.startsWith(base)) {
        let base_path = parent.file

        while (true) {
          base_path = dirname(base_path)

          if (base_path == base)
            break

          path = join(base_path, "node_modules", dep)

          if (directoryExists(path)) {
            const file = resolve_with_index(path)
            if (file != null)
              return file
          }
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
  protected ast: SourceFile
  readonly deps = new Map<string, string>()
  protected _source: string | null

  constructor(readonly file: string, protected readonly linker: Linker) {
    this.ast = parse_es(file)

    for (const dep of this.collect_deps()) {
      if (!this.linker.ignores.has(dep))
        this.deps.set(dep, linker.resolve(dep, this))
    }
  }

  get is_external(): boolean {
    return this.file.split(sep).indexOf("node_modules") !== -1
  }

  get is_json(): boolean {
    return this.file.endsWith(".json")
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
    return `Module(${JSON.stringify(this.file)}, ${JSON.stringify(to_obj(this.deps))})`
  }

  protected collect_deps(): string[] {
    return collect_deps(this.ast)
  }

  rewrite_deps(module_map: Map<string, number>): void {
    this.ast = rewrite_deps(this.ast, (dep) => module_map.get(this.deps.get(dep)!))
  }

  transform(): void {
    let {ast} = this

    if (this.is_json)
      ast = add_json_export(ast)
    else {
      ast = remove_use_strict(ast)
      ast = remove_esmodule(ast)
    }

    ast = wrap_in_function(ast, this.canonical)
    this.ast = ast
  }

  protected generate_source(): string {
    const source = print_es(this.ast)
    return convert.removeMapFileComments(source)
  }

  get source(): string {
    if (this._source == null)
      this._source = this.generate_source()
    return this._source
  }
}
