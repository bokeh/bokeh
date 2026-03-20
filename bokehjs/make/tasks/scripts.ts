import {join, normalize, relative, dirname} from "node:path"
import cp from "node:child_process"
import fs from "node:fs"

import MagicString from "magic-string"
import {SourceMapConsumer, SourceMapGenerator} from "source-map"
import * as oxc from "oxc-parser"
import {glob} from "glob"
import {GlslMinify} from "webpack-glsl-minify/build/minify.js"

import {task, passthrough, BuildError} from "../task.js"
import {file_exists, compile_typescript} from "./_util.js"

import {rename, read, write, scan} from "#compiler/sys.js"
import {wrap_css_modules} from "#compiler/styles.js"
import type {AssemblyOptions} from "#compiler/linker.js"
import {Linker} from "#compiler/linker.js"
import * as preludes from "#compiler/prelude.js"

import {argv} from "../args.js"
import * as paths from "../paths.js"

// Don't use imports here, because TS will copy package.json to make/_build
// and that will mess up node's module resolution.
const pkg_file = fs.readFileSync("./make/package.json", {encoding: "utf-8"})
const pkg = JSON.parse(pkg_file) as {version: string}

task("scripts:styles", ["styles:compile"], async () => {
  function styles(lib_dir: string) {
    const css_dir = paths.build_dir.css
    const js_dir = lib_dir
    const dts_dir = lib_dir
    const dts_internal_dir = join(paths.build_dir.all, "dts")
    wrap_css_modules(css_dir, js_dir, dts_dir, dts_internal_dir)
  }
  styles(paths.build_dir.lib)
})

task("scripts:grammar", async () => {
  function grammar(lib_dir: string) {
    function compile_grammar(ne_path: string, js_path: string) {
      const is_windows = process.platform == "win32"
      const npx = is_windows ? "npx.cmd" : "npx"
      const {status, stdout, stderr} = cp.spawnSync(`${npx} nearleyc "${ne_path}" -o "${js_path}"`, {stdio: "pipe", encoding: "utf-8", shell: true})
      if (status !== 0) {
        console.error(stdout)
        console.error(stderr)
        throw new BuildError("pack", `failed to run '${npx} nearleyc'`)
      }
    }

    const base = paths.src_dir.grammar
    for (const ne_path of scan(base, [".ne"])) {
      const sub_path = relative(base, ne_path)
      const js_path = rename(join(lib_dir, sub_path), {ext: ".js"})
      write(js_path, "") // make sure path exists before running nearleyc
      compile_grammar(ne_path, js_path)
    }
  }
  grammar(paths.build_dir.lib)
})

task("scripts:glsl", async () => {
  async function glsl(lib_dir: string) {
    const lib_base = paths.src_dir.lib

    const js_base = lib_dir
    const dts_base = lib_dir

    // preserveAll: true disables identifier mangling, limiting minification to
    // stripping comments and compressing whitespace. This is required because regl
    // binds uniforms/attributes by name at runtime, and glyph code prepends
    // #define directives (e.g. USE_CIRCLE, HATCH) that must match the shader source.
    const minifier = new GlslMinify({
      output: "sourceOnly",
      preserveAll: true,
    })

    for (const glsl_path of scan(lib_base, [".vert", ".frag"])) {
      const sub_path = relative(lib_base, glsl_path)
      const source = read(glsl_path)!
      // Join backslash-continued lines so the minifier doesn't corrupt them.
      const joined = source.replace(/\\\s*\n\s*/g, "")
      const minified = await minifier.execute(joined)

      const js = `\
const shader = \`\n${minified.sourceCode}\`;
export default shader;
`
      const dts = `\
declare const shader: string;
export default shader;
`

      write(`${join(js_base, sub_path)}.js`, js)
      write(`${join(dts_base, sub_path)}.d.ts`, dts)
    }
  }

  await glsl(paths.build_dir.lib)
})

task("scripts:typescript", ["scripts:styles", "scripts:glsl", "scripts:grammar"], async () => {
  compile_typescript("./src/lib/tsconfig.json")
})

task("scripts:imports", async () => {
  const base_path = paths.build_dir.lib

  // windowsPathsNoEscape is needed because glob() expects / as path separators by default.
  const files = await glob(join(base_path, "**", "*.{js,d.ts}"), {windowsPathsNoEscape: true})
  for (const file of files) {
    const file_map = `${file}.map`

    if (!file_exists(file) || !file_exists(file_map)) {
      continue
    }

    const source = fs.readFileSync(file, {encoding: "utf-8"})
    const source_map = fs.readFileSync(file_map, {encoding: "utf-8"})

    const {module} = oxc.parseSync(file, source)
    if (file.endsWith(".js")) {
      fs.writeFileSync(`${file}.module`, JSON.stringify(module), {encoding: "utf-8"})
    }

    function relativize(module_path: string): string | null {
      if (!module_path.startsWith(".") && !module_path.startsWith("/") &&
          !module_path.startsWith("#") && !module_path.startsWith("@")) {
        const module_file = join(base_path, module_path)
        if (file_exists(module_file) || file_exists(`${module_file}.js`) || file_exists(join(module_file, "index.js"))) {
          const rel_path = normalize(relative(dirname(file), module_file)).replaceAll("\\", "/")
          const new_path = rel_path.startsWith(".") ? rel_path : `./${rel_path}`
          return new_path
        }
      }
      return null
    }

    const rewrites: {new_path: string, start: number, end: number}[] = []
    for (const imp of module.staticImports) {
      const {value: module_path, start, end} = imp.moduleRequest
      const new_path = relativize(module_path)
      if (new_path != null) {
        rewrites.push({new_path, start, end})
      }
    }

    if (file.endsWith(".d.ts")) {
      const re = /import\("(?<module_path>[^"]+)"\)/g
      for (const result of source.matchAll(re)) {
        const {index} = result
        const {module_path} = result.groups!
        const start = index + "import(".length
        const end = index + result[0].length - 1
        const new_path = relativize(module_path)
        if (new_path != null) {
          rewrites.push({new_path, start, end})
        }
      }
    }

    if (rewrites.length != 0) {
      const str = new MagicString(source, {filename: file})
      for (const {new_path, start, end} of rewrites) {
        str.update(start, end, `"${new_path}"`)
      }

      const new_source = str.toString()
      const new_source_map = str.generateMap({
        hires: true,
        source: file,
        file: file_map,
        includeContent: true,
      }).toString()

      const consumer = await new SourceMapConsumer(source_map)
      const generator = SourceMapGenerator.fromSourceMap(consumer)

      generator.applySourceMap(await new SourceMapConsumer(new_source_map))
      const gen_source_map = generator.toString()

      fs.writeFileSync(file, new_source, {encoding: "utf-8"})
      fs.writeFileSync(file_map, gen_source_map, {encoding: "utf-8"})
    }
  }
})

task("scripts:version", async () => {
  function version(lib_dir: string) {
    const version_js = "version.js"
    const version_js_path = join(lib_dir, version_js)
    const version_map_path = join(lib_dir, `${version_js}.map`)

    const source = fs.readFileSync(version_js_path, {encoding: "utf-8"})
    const str = new MagicString(source, {filename: version_js})
    str.replace("VERSION", pkg.version)

    const map = str.generateMap({
      source: version_js,
      file: `${version_js}.map`,
      includeContent: true,
    })

    fs.writeFileSync(version_js_path, str.toString())
    fs.writeFileSync(version_map_path, map.toString())
  }
  version(join(paths.build_dir.js, "lib"))
})

task("scripts:compile", [passthrough("scripts:typescript"), "scripts:imports", "scripts:version"])

function min_js(js: string): string {
  return rename(js, {ext: ".min.js"})
}

task("scripts:bundle", [passthrough("scripts:compile")], async () => {
  const {bokehjs, gl, api, widgets, tables, mathjax} = paths.bundles
  const packages = [bokehjs, gl, api, widgets, tables, mathjax]

  const linker = new Linker({
    entries: packages.map((pkg) => pkg.main),
    bases: [paths.build_dir.lib, "./node_modules"],
    cache: argv.cache ? join(paths.build_dir.js, "bokeh.json") : undefined,
    target: "ES2024",
    exports: ["tslib"],
    detect_cycles: argv.detectCycles,
    overrides: {
      // https://github.com/bokeh/bokeh/issues/12142
      "mathjax-full/js/components/version.js": `\
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = "0.0.0";
`,
    },
  })

  if (!argv.rebuild) {
    linker.load_cache()
  }
  const {bundles, status} = await linker.link()
  linker.store_cache()

  const outputs = packages.map((pkg) => pkg.output)

  const prelude = {
    main: preludes.prelude(),
    plugin: preludes.plugin_prelude({version: pkg.version}),
  }

  const postlude = {
    main: preludes.postlude(),
    plugin: preludes.plugin_postlude(),
  }

  function bundle(options: AssemblyOptions, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble(options))
      .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle({prelude, postlude, minified: false}, outputs)
  bundle({prelude, postlude, minified: true}, outputs.map(min_js))

  const esm_settings = (minified: boolean) => {
    return {
      prelude: {
        main: preludes.prelude_esm(minified),
        plugin: preludes.plugin_prelude_esm(minified),
      },
      postlude: {
        main: preludes.postlude_esm(),
        plugin: preludes.plugin_postlude_esm(),
      },
    }
  }

  bundle({...esm_settings(false), minified: false}, outputs.map((name) => rename(name, {ext: ".esm.js"})))
  bundle({...esm_settings(true), minified: true}, outputs.map((name) => rename(name, {ext: ".esm.min.js"})))

  if (!status) {
    throw new BuildError("scripts:bundle", "unable to bundle modules")
  }
})
