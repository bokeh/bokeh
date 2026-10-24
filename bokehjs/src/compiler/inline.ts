import {mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync} from "node:fs"
import {tmpdir} from "node:os"
import {dirname, extname, join, parse, relative, resolve} from "node:path"

import type {Plugin} from "rolldown"
import lesscss from "less"

import {bundle} from "./bundle.js"
import {compile_esm} from "./compile.js"
import {run_typescript} from "./compiler.js"
import {directory_exists, read, scan, write} from "./sys.js"
import tsconfig_json from "./tsconfig.ext.json" with {type: "json"}

type Model = {
  name: string
  module: string
  full_name: string
  code: string
  lang: "typescript" | "javascript"
  file: string
  path: string
  cached?: {code: string, deps: string[]}
}

export type BundleRequest = {models: Model[], entry: string, bokehjs_dir: string, bokeh_version: string}

const slash = (path: string) => path.replaceAll("\\", "/")

// Mirror the absolute source hierarchy so rootDirs redirects relative imports
// to their actual locations. Junctions preserve native npm package lookup while
// leaving virtual or read-only caller directories untouched.
function mirror_directory(temporary: string, path: string, roots: Map<string, string>): string {
  const absolute = resolve(path)
  const {root} = parse(absolute)
  let overlay = roots.get(root)
  if (overlay == null) {
    overlay = join(temporary, `sources-${roots.size}`)
    roots.set(root, overlay)
  }
  for (let ancestor = absolute; ; ancestor = dirname(ancestor)) {
    const directory = join(overlay, relative(root, ancestor))
    mkdirSync(directory, {recursive: true})
    const modules = join(ancestor, "node_modules")
    const link = join(directory, "node_modules")
    if (directory_exists(modules) && !directory_exists(link)) {
      symlinkSync(modules, link, "junction")
    }
    if (ancestor == root) {
      break
    }
  }
  return join(overlay, relative(root, absolute))
}

export async function bundle_models(request: BundleRequest): Promise<{code: string} | {error: string}> {
  const {models} = request
  const bokehjs_dir = resolve(request.bokehjs_dir)
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), "bokeh-inline-")))
  try {
    const base = join(temporary, "modules")
    const main = resolve(base, `${request.entry}.js`)
    if (relative(base, main).startsWith("..")) {
      throw new Error(`invalid custom model entry: ${request.entry}`)
    }
    const roots = new Map<string, string>()
    const aliases = new Map<string, string>()
    const sources = new Map<string, Model>()
    const paths: Record<string, string[]> = {
      "@bokehjs/*": [join(bokehjs_dir, "js/lib/*")],
      "*": [join(bokehjs_dir, "js/lib/*")],
    }
    const staged = new Map<string, Model>()
    for (const [index, model] of models.entries()) {
      const file = resolve(base, `${model.module}.js`)
      if (relative(base, file).startsWith("..")) {
        throw new Error(`invalid custom model module: ${model.module}`)
      }
      aliases.set(model.module, file)
      sources.set(file, model)
      write(file, model.cached?.code ?? model.code)
      const directory = mirror_directory(temporary, model.path, roots)
      const suffix = model.cached != null ? "cjs" : model.lang == "typescript" ? "ts" : "js"
      const input = join(directory, `bokeh-model-${index}.${suffix}`)
      write(input, model.cached?.code ?? model.code)
      staged.set(input, model)
      paths[model.module] = [input]
    }
    const styles = join(temporary, "styles.d.ts")
    write(styles, ["css", "less"].map((ext) =>
      `declare module "*.${ext}" {const css: string; export default css}`).join("\n"))
    const checked_files = new Set([...staged].filter(([, model]) => model.lang == "typescript" && model.cached == null)
      .map(([input]) => input))

    const lib = join(bokehjs_dir, "js/lib")
    const external = new Set(scan(lib, [".d.ts"]).map((file) => slash(relative(lib, file)).replace(/\.d\.ts$/, "")))
    external.add("tslib")
    const plugin: Plugin = {
      name: "bokeh-inline-models",
      async resolveId(source, importer, options) {
        const model = aliases.get(source)
        if (model != null) {
          return model
        }
        const name = source.replace(/^@bokehjs\//, "")
        // The bundle adapter recognizes registry imports by this prefix.
        if (external.has(name)) {
          return {id: name == "tslib" ? name : `@bokehjs/${name}`, external: true}
        }
        if (external.has(`${name}/index`)) {
          return {id: `@bokehjs/${name}/index`, external: true}
        }
        const origin = importer == null ? undefined : sources.get(importer)
        if (origin != null) {
          // Let Rolldown handle relative paths, package exports and require vs
          // import conditions from the model's declared source directory.
          return await this.resolve(source, join(resolve(origin.path), "__bokeh_model__.js"), {...options, skipSelf: true})
        }
        return null
      },
      async load(id) {
        const model = sources.get(id)
        if (model != null) {
          return model.cached?.code ?? compile_esm(model.code, resolve(model.path, model.file), model.lang, bokehjs_dir)
        }
        const ext = extname(id)
        if (ext == ".less" || ext == ".css") {
          const {css} = await lesscss.render(read(id)!, {filename: id, compress: true})
          return {
            code: `const css = ${JSON.stringify(css)};
const style = document.createElement("style");
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);
export default css;`,
            moduleType: "js",
            moduleSideEffects: true,
          }
        }
        if (/\.[cm]?ts$/.test(ext) && !id.endsWith(".d.ts")) {
          const code = read(id)
          if (code != null) {
            checked_files.add(id)
            return compile_esm(code, id, "typescript", bokehjs_dir)
          }
        }
        return null
      },
    }
    const imports = models.map((model, i) => `import {${model.name} as model_${i}} from ${JSON.stringify(model.module)};`)
    const public_models = new Map(models.map((model, i) => [model.name, i]))
    const names = [...public_models].map(([name, i]) => `${JSON.stringify(name)}: model_${i}`).join(", ")
    const exports = [...public_models].map(([name, i]) => `model_${i} as ${name}`).join(", ")
    write(main, `${imports.join("\n")}\nimport {register_models} from "@bokehjs/base";\nregister_models({${names}});\nexport {${exports}};\n`)
    const output = join(temporary, "inline.js")
    // Python's inline-model bundler has always allowed models to refer to each
    // other. The library and `bokeh build` retain their stricter cycle policy.
    await bundle({components: [{main, output}], base, plugin: true, plugins: [plugin], detect_cycles: false, minify: false, sanitize_paths: true})
    // JavaScript implementations are transpile-only. Check TypeScript roots,
    // including helpers discovered through JavaScript, without asking TS to
    // generate declarations for unrelated JS or cached CommonJS models.
    if (checked_files.size != 0) {
      const checked = run_typescript({
        compilerOptions: {
          ...tsconfig_json.compilerOptions,
          outDir: undefined,
          rootDirs: [...roots].flatMap(([root, overlay]) => [overlay, root]),
          paths,
          types: [],
          noEmit: true,
          allowImportingTsExtensions: true,
          checkJs: false,
        },
        files: [...checked_files, styles],
      }, temporary, bokehjs_dir, ["--pretty", "true"])
      if (checked.status != 0) {
        let error = checked.output
        for (const [input, model] of staged) {
          for (const path of [input, slash(input), relative(temporary, input), slash(relative(temporary, input))]) {
            error = error.replaceAll(path, model.file)
          }
        }
        return {error}
      }
    }
    // An inline script has no adjacent map file after temporary files are
    // removed. Embed the standard combined map produced by the adapter.
    const map = Buffer.from(read(`${output}.map`)!).toString("base64")
    return {code: read(output)!.replace(/\/\/# sourceMappingURL=.*$/m, `//# sourceMappingURL=data:application/json;base64,${map}`)}
  } finally {
    rmSync(temporary, {recursive: true, force: true})
  }
}
