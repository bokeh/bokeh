import {basename, dirname, relative, resolve, win32} from "node:path"
import {realpathSync} from "node:fs"
import {createHash} from "node:crypto"
import {rolldown} from "rolldown"
import type {InputOptions, OutputChunk, OutputOptions, Plugin, RolldownOutput} from "rolldown"
import {minifySync} from "rolldown/experimental"
import {parseSync, Visitor} from "rolldown/utils"
import type {ESTree} from "rolldown/utils"
import {AnyMap, encodedMap} from "@jridgewell/trace-mapping"
import type {EncodedSourceMap, SectionedSourceMap} from "@jridgewell/trace-mapping"
import remapping from "@jridgewell/remapping"
import MagicString from "magic-string"

import {read, write} from "./sys.js"
import * as preludes from "./prelude.js"
import {restore_import_annotations} from "./import_annotations.js"

// Class names are Python wire names (HasProps.__qualified__) and registration
// keys. This applies to ordinary bundling too, which can rename colliding names.
// Property mangling must never be enabled for Bokeh or extension outputs.
export const output_options: OutputOptions = {
  keepNames: true,
  minifyInternalExports: false,
  charset: "ascii",
  // CustomJS loads a browser-created Blob URL through the native module loader.
  dynamicImportInCjs: true,
  sourcemap: true,
}

const slash = (path: string) => path.replaceAll("\\", "/")
const canonical = (path: string) => slash(path).replace(/\.js$/, "")

export function is_relative_to_base(path: string): boolean {
  // relative() returns an absolute path across Windows drives or UNC shares.
  // Windows absolute-path recognition also covers POSIX rooted paths.
  return !win32.isAbsolute(path) && path != ".." && !slash(path).startsWith("../")
}

export const bundle_log: NonNullable<InputOptions["onLog"]> = (level, log, handler) => {
  if (log.code == "PLUGIN_TIMINGS") {
    return
  }
  // Keep any dependency-specific exception scoped to the distributed regl file;
  // direct eval elsewhere can prevent safe optimization and must remain visible.
  if (log.code == "EVAL" && log.id != null && slash(log.id).endsWith("/node_modules/regl/dist/regl.js")) {
    return
  }
  handler(log.code == "UNRESOLVED_IMPORT" ? "error" : level, log)
}

export function input_sourcemaps(): Plugin {
  return {
    name: "bokeh-input-sourcemaps",
    load(id) {
      const source_map = read(`${id}.map`)
      if (source_map == null) {
        return null
      }
      const map = JSON.parse(source_map) as EncodedSourceMap
      map.sourcesContent = map.sources.map((source, i) => map.sourcesContent?.[i] ??
        (source == null ? null : read(resolve(dirname(id), map.sourceRoot ?? "", source)) ?? null))
      // Some packages omit their original sources. Keep a usable mapping to
      // their distributed JavaScript instead of shipping broken source links.
      if (map.sources.length == 0 || !/[^;]/.test(map.mappings) || map.sourcesContent.some((content) => content == null)) {
        const code = read(id)!
        const identity = new MagicString(code).generateMap({source: id, includeContent: true, hires: true})
        return {code, map: JSON.parse(identity.toString()) as EncodedSourceMap}
      }
      return {code: read(id)!, map}
    },
  }
}

function registry_imports(chunk: OutputChunk, runtime: string | undefined, source_labels?: Map<string, string>): {code: string, map?: EncodedSourceMap} {
  const externals = new Set([...chunk.imports, ...chunk.dynamicImports].filter((id) => id.startsWith("@bokehjs/")))
  const map = chunk.map == null ? undefined : JSON.parse(chunk.map.toString()) as EncodedSourceMap
  if (externals.size == 0 && source_labels == null) {
    return {code: chunk.code, map}
  }

  const {program, comments} = parseSync(chunk.fileName, chunk.code)
  const namespaces = new Set<string>()
  const helpers = new Set<string>()
  const required = (node: ESTree.Expression): string | null =>
    node.type == "CallExpression" && node.callee.type == "Identifier" && node.callee.name == "require" &&
    node.arguments.length == 1 && node.arguments[0].type == "Literal" &&
    typeof node.arguments[0].value == "string" ? node.arguments[0].value : null
  const is_registry_require = (node: ESTree.Expression): boolean => externals.has(required(node) ?? "")
  for (const statement of program.body) {
    if (statement.type == "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        if (declaration.id.type == "Identifier" && declaration.init != null) {
          const dependency = required(declaration.init)
          if (dependency != null) {
            if (externals.has(dependency)) {
              namespaces.add(declaration.id.name)
            } else if (runtime != null && resolve(dirname(chunk.fileName), dependency) == resolve(runtime)) {
              helpers.add(declaration.id.name)
            }
          }
        }
      }
    }
  }

  const source = new MagicString(chunk.code)
  // Rolldown adds source labels to unminified chunks. Replace only generated
  // labels, keeping user comments and the composed mappings intact.
  if (source_labels != null) {
    for (const {start, end, value} of comments) {
      const label = source_labels.get(value.trim())
      if (label != null) {
        source.overwrite(start, end, `// ${label}`)
      }
    }
  }
  new Visitor({
    CallExpression(node) {
      // Bokeh.require() already returns an ES module namespace. Rolldown's
      // Node interop would wrap that namespace as its own default export.
      const {callee} = node
      if (callee.type == "MemberExpression" && !callee.computed &&
          callee.object.type == "Identifier" && helpers.has(callee.object.name) &&
          callee.property.type == "Identifier" && callee.property.name == "__toESM") {
        const value = node.arguments.at(0)
        if (value != null && value.type != "SpreadElement" &&
            (value.type == "Identifier" && namespaces.has(value.name) || is_registry_require(value))) {
          source.overwrite(node.start, node.end, chunk.code.slice(value.start, value.end))
        }
      }
    },
    ImportExpression(node) {
      const value = node.source.type == "Literal" ? node.source.value :
        node.source.type == "TemplateLiteral" && node.source.expressions.length == 0 ? node.source.quasis[0].value.cooked : null
      if (typeof value == "string" && externals.has(value)) {
        // Literal registry imports share the parent's module cache. URL and
        // computed imports continue through the native browser module loader.
        source.overwrite(node.start, node.end, `Promise.resolve().then(() => require(${JSON.stringify(value)}))`)
      }
    },
  }).visit(program)
  if (!source.hasChanged()) {
    return {code: chunk.code, map}
  }
  const rewritten = source.generateMap({hires: true, source: chunk.fileName, includeContent: true})
  const composed = map == null ? rewritten : remapping([rewritten.toString(), map], () => null)
  return {code: source.toString(), map: JSON.parse(composed.toString()) as EncodedSourceMap}
}

export type Component = {main: string, output: string}
export type BundleOptions = {
  components: Component[]
  base: string
  plugin?: boolean
  global?: string
  minify?: boolean
  detect_cycles?: boolean
  sanitize_paths?: boolean
  version?: string
  license?: string
  esm?: boolean
  external?: InputOptions["external"]
  plugins?: Plugin[]
}

// Rolldown owns resolution, CommonJS interop, graph traversal, code generation,
// and optimization. This adapter only places its chunks in Bokeh's public lazy
// module registry, which Python-generated extensions also use.
export async function bundle(options: BundleOptions): Promise<void> {
  // Rolldown resolves symlinks by default. Match its module identities even
  // when an extension was opened through a symlink (including macOS /var).
  options = {
    ...options,
    base: realpathSync(options.base),
    components: options.components.map((component) => ({...component, main: realpathSync(component.main)})),
  }
  const {components, base, esm = false} = options
  const owners = new Map<string, number>()
  const commonjs = new Set<string>()
  const esmodules = new Set<string>()
  const logical_names = new Map<string, string>([["\0rolldown/runtime.js", "_virtual/runtime.js"]])
  const directories = components.slice(1).map(({main}) => `${slash(dirname(resolve(main)))}/`)
  const build = await rolldown({
    // Source labels participate in the plugin hash; temporary staging paths
    // must not change module identities when the same bundle is rebuilt.
    cwd: base,
    input: components.map(({main}) => main),
    platform: "browser",
    transform: {target: "es2024"},
    // These imports have historically supplied strings to custom extensions.
    // CSS is consumed by Bokeh's style system, not extracted into a side file.
    moduleTypes: {".css": "text", ".yaml": "text", ".json5": "text"},
    preserveEntrySignatures: "strict",
    external: options.external,
    plugins: [{
      name: "bokeh-public-modules",
      async buildStart() {
        if (options.plugin !== true && options.global == null) {
          // Python-compiled extensions can request helpers independently of
          // whether the current library happens to import any of them.
          const tslib = await this.resolve("tslib")
          if (tslib != null) {
            owners.set(tslib.id, 0)
            this.emitFile({type: "chunk", id: tslib.id, preserveSignature: "strict"})
          }
        }
      },
      moduleParsed(info) {
        if (info.inputFormat == "cjs") {
          commonjs.add(info.id)
        } else if (info.inputFormat == "es") {
          esmodules.add(info.id)
        }
        // Public namespaces must retain all their exports for Bokeh.require().
        // Private code and dependency internals remain eligible for shaking.
        if (is_relative_to_base(relative(base, info.id))) {
          this.emitFile({type: "chunk", id: info.id, preserveSignature: "strict"})
        }
      },
      buildEnd(error) {
        if (error != null) {
          return
        }
        if (options.detect_cycles !== false) {
          // Keep the previous guard on Bokeh's public modules. npm packages
          // may contain intentional cycles and aren't subject to this policy.
          const internal = new Set([...this.getModuleIds()].filter((id) => {
            const path = slash(relative(base, id))
            return !id.startsWith("\0") && is_relative_to_base(path) && !path.split("/").includes("node_modules")
          }))
          const visited = new Set<string>()
          const active: string[] = []
          const check = (id: string): void => {
            const index = active.indexOf(id)
            if (index != -1) {
              const cycle = [...active.slice(index), id].map((file) => canonical(relative(base, file)))
              this.error(`cycle detected: ${cycle.join(" -> ")}`)
            }
            if (visited.has(id)) {
              return
            }
            visited.add(id)
            active.push(id)
            const info = this.getModuleInfo(id)!
            for (const dependency of [...info.importedIds, ...info.dynamicallyImportedIds]) {
              if (internal.has(dependency)) {
                check(dependency)
              }
            }
            active.pop()
          }
          for (const id of [...internal].sort()) {
            check(id)
          }
        }
        const visit = (id: string, component: number): void => {
          if (owners.has(id)) {
            return
          }
          let boundary = 0
          for (const [index, directory] of directories.entries()) {
            if (slash(id).startsWith(directory)) {
              boundary = index + 1
            }
          }
          if (boundary != 0 && boundary != component) {
            return
          }
          owners.set(id, component)
          const info = this.getModuleInfo(id)
          if (info != null) {
            for (const dependency of [...info.importedIds, ...info.dynamicallyImportedIds]) {
              visit(dependency, component)
            }
          }
        }
        // Assign shared helpers and styles to their first consuming component.
        // Use the source graph so empty and shaken public modules retain aliases.
        for (const [component, {main}] of components.entries()) {
          visit(resolve(main), component)
        }
        if (options.sanitize_paths === true) {
          // Keep physical module identities for resolution and sharing. Only
          // output labels follow the deterministic source-graph traversal, so
          // unrelated equal-content or same-basename files remain distinct.
          let dependency = 0
          const label = (id: string): void => {
            if (logical_names.has(id)) {
              return
            }
            const info = this.getModuleInfo(id)
            if (info == null) {
              return
            }
            const path = relative(base, id)
            logical_names.set(id, !is_relative_to_base(path) ?
              `dependencies/${dependency++}/${basename(id).replace(/\.[cm]?[jt]s$/, ".js")}` : slash(path))
            for (const imported of [...info.importedIds, ...info.dynamicallyImportedIds]) {
              label(imported)
            }
          }
          for (const {main} of components) {
            label(main)
          }
        }
      },
    }, ...options.plugins ?? [], input_sourcemaps()],
    onLog: bundle_log,
  })

  try {
    for (const minify of options.minify === false ? [false] : [false, true]) {
      const result = await build.generate({
        ...output_options,
        dir: dirname(components[0].output),
        format: "cjs",
        exports: "named",
        preserveModules: true,
        preserveModulesRoot: base,
        entryFileNames: options.sanitize_paths !== true ? "[name].js" : (chunk) => {
          const name = logical_names.get(chunk.facadeModuleId ?? chunk.moduleIds[0])
          if (name == null) {
            throw new Error(`missing logical name for inline module: ${chunk.name}`)
          }
          return name
        },
        chunkFileNames: "[name].js",
        minify,
      })
      assemble(result, options, owners, commonjs, esmodules, minify, false)
      if (esm) {
        assemble(result, options, owners, commonjs, esmodules, minify, true)
      }
    }
  } finally {
    await build.close()
  }
}

function assemble(result: RolldownOutput, options: BundleOptions, owners: Map<string, number>, commonjs: Set<string>, esmodules: Set<string>, minify: boolean, esm: boolean): void {
  const {components, base, plugin = false, version, license = ""} = options
  const chunks = result.output.filter((output): output is OutputChunk => output.type == "chunk")
  const runtime = chunks.find((chunk) => chunk.facadeModuleId == "\0rolldown/runtime.js")?.fileName
  const by_name = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const entries = components.map(({main}) => chunks.find((chunk) => chunk.facadeModuleId == resolve(main))!)
  const owned = new Set<string>()
  const source_labels = options.sanitize_paths !== true ? undefined : new Map(chunks.flatMap((chunk) =>
    Object.keys(chunk.modules).map((id) => [slash(relative(base, id)), chunk.fileName] as const)))
  const rewritten_chunks = new Map(chunks.map((chunk) => [chunk, registry_imports(chunk, runtime, source_labels)]))
  const namespace = plugin ? `extension-${createHash("sha256").update(chunks.map((chunk) =>
    options.sanitize_paths === true ? rewritten_chunks.get(chunk)!.code : chunk.code).join("\n")).digest("hex").slice(0, 16)}` : options.global ?? "bokeh"
  const id = (name: string) => `${namespace}/${name}`

  for (const [i, component] of components.entries()) {
    const selected = new Set<OutputChunk>()
    function visit(name: string): void {
      const chunk = by_name.get(name)
      if (chunk == null || owned.has(name) || selected.has(chunk)) {
        return
      }
      if (chunk.facadeModuleId != null) {
        const owner = owners.get(chunk.facadeModuleId)
        if (owner != null && owner != i) {
          return
        }
      }
      selected.add(chunk)
      for (const dependency of [...chunk.imports, ...chunk.dynamicImports]) {
        visit(dependency)
      }
    }
    visit(entries[i].fileName)
    for (const chunk of chunks) {
      const file = chunk.facadeModuleId
      if (file != null && is_relative_to_base(relative(base, file))) {
        if (owners.get(file) == i) {
          visit(chunk.fileName)
        }
      } else if (i == 0 && !plugin && file != null && /[/\\]tslib[/\\]/.test(file)) {
        visit(chunk.fileName)
      }
    }
    for (const {fileName} of selected) {
      owned.add(fileName)
    }

    const is_plugin = plugin || i != 0
    const prelude = esm ? (is_plugin ? preludes.plugin_prelude_esm(minify) : preludes.prelude_esm(minify)) :
      (is_plugin ? preludes.plugin_prelude({version}) : options.global != null ? preludes.default_prelude({global: options.global}) : preludes.prelude())
    const postlude = esm ? (is_plugin ? preludes.plugin_postlude_esm() : preludes.postlude_esm()) :
      (is_plugin ? preludes.plugin_postlude() : preludes.postlude())
    let code = `${license}${prelude}({\n`
    let line = code.split("\n").length - 1
    const sections: SectionedSourceMap["sections"] = []
    const aliases: Record<string, string> = {}
    const externals: Record<string, boolean> = {}

    for (const chunk of selected) {
      for (const dependency of [...chunk.imports, ...chunk.dynamicImports]) {
        if (!by_name.has(dependency)) {
          externals[dependency] = true
        }
      }
      const esmodule = chunk.facadeModuleId != null && esmodules.has(chunk.facadeModuleId)
      const prefix = `${JSON.stringify(id(chunk.fileName))}: function(require, module, exports${esmodule ? ", __esModule" : ""}) {\n`
      code += prefix
      line++
      const rewritten = rewritten_chunks.get(chunk)!
      if (rewritten.map != null) {
        const map = rewritten.map
        const chunk_dir = dirname(resolve(dirname(components[0].output), chunk.fileName))
        // Rolldown's map paths refer to each preserved chunk; the public
        // artifact combines those chunks in a different directory.
        map.sources = map.sources.map((source, index) => source == null ? null : options.sanitize_paths === true ?
          `inline/${canonical(chunk.fileName)}/${index}/${basename(source)}` :
          slash(relative(dirname(component.output), resolve(chunk_dir, map.sourceRoot ?? "", source))))
        delete map.sourceRoot
        sections.push({offset: {line, column: 0}, map})
      }
      let source = rewritten.code.replace(/^\/\/# sourceMappingURL=.*$/gm, "").trimEnd()
      if (esmodule) {
        // Cached extensions compiled by TypeScript's CommonJS emitter use this
        // marker to preserve namespace identity and unwrap default exports.
        source += "\n__esModule();"
      }
      code += `${source}\n},\n`
      line += source.split("\n").length + 1

      if (chunk.facadeModuleId != null) {
        const path = relative(base, chunk.facadeModuleId)
        if (is_relative_to_base(path)) {
          let public_id = id(chunk.fileName)
          if (commonjs.has(chunk.facadeModuleId)) {
            // Rolldown's preserved CommonJS chunk has a lazy default export.
            // Public registry callers expect the original exports object.
            public_id += ".namespace"
            code += `${JSON.stringify(public_id)}: function(require, module, exports) {module.exports = require(${JSON.stringify(id(chunk.fileName))}).default;},\n`
            line++
          }
          aliases[canonical(path)] = public_id
        } else if (/[/\\]tslib[/\\]tslib(?:\.es6)?\.(?:m?js)$/.test(chunk.facadeModuleId)) {
          aliases.tslib = id(chunk.fileName)
        }
      }
    }
    code += `}, ${JSON.stringify(id(entries[i].fileName))}, ${JSON.stringify(aliases)}, ${JSON.stringify(externals)});${postlude}\n`
    const output = component.output.replace(/\.js$/, `${esm ? ".esm" : ""}${minify ? ".min" : ""}.js`)
    let map: EncodedSourceMap | ReturnType<typeof remapping> = encodedMap(AnyMap({version: 3, sections}))
    if (minify) {
      // Compress the registry wrappers too. As with the previous minifier,
      // class names are stable wire names; ordinary function names may shrink.
      const optimized = minifySync(output, code, {
        module: esm,
        compress: {target: "es2024", keepNames: {class: true, function: false}},
        mangle: {keepNames: {class: true, function: false}},
        codegen: {legalComments: "inline", asciiOnly: true},
        sourcemap: true,
      })
      if (optimized.errors.length != 0) {
        throw new Error(optimized.errors.map(({message}) => message).join("\n"))
      }
      code = `${optimized.code}\n`
      map = remapping([optimized.map as EncodedSourceMap, map], () => null)
    }
    const restored = restore_import_annotations(output, code, JSON.parse(JSON.stringify(map)) as EncodedSourceMap)
    code = restored.code
    map = restored.map
    map.file = basename(output)
    write(output, `${code}//# sourceMappingURL=${basename(output)}.map\n`)
    write(`${output}.map`, JSON.stringify(map))
  }
}
