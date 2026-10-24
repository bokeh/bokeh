import {join, relative, dirname, basename} from "node:path"
import cp from "node:child_process"
import fs from "node:fs"

import MagicString from "magic-string"
import * as esbuild from "esbuild"
import remapping from "@jridgewell/remapping"
import type {EncodedSourceMap} from "@jridgewell/trace-mapping"
import * as oxc from "oxc-parser"
import {glob} from "glob"
import {GlslMinify} from "webpack-glsl-minify/build/minify.js"

import {task, passthrough, BuildError} from "../task.js"
import {argv} from "../args.js"
import {file_exists, compile_typescript} from "./_util.js"

import {rename, read, write, scan} from "#compiler/sys.js"
import {wrap_css_modules} from "#compiler/styles.js"
import {bundle} from "#compiler/bundle.js"
import {comment} from "#compiler/prelude.js"

import * as paths from "../paths.js"

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
      const compiler = "./node_modules/nearley/bin/nearleyc.js"
      const {status, error, stdout, stderr} = cp.spawnSync(process.execPath, [compiler, ne_path, "-o", js_path], {stdio: "pipe", encoding: "utf-8"})
      if (error != null || status !== 0) {
        console.error(stdout)
        console.error(stderr)
        const reason = error != null ? `: ${error.message}` : ""
        throw new BuildError("grammar", `failed to run nearleyc${reason}`)
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

    const source = fs.readFileSync(file, {encoding: "utf-8"})
    if (file_exists(file_map)) {
      const map = JSON.parse(read(file_map)!) as EncodedSourceMap
      if (map.sourcesContent == null) {
        // Declaration maps need their original TypeScript when used from npm
        // or an installed wheel, where the checkout is no longer available.
        map.sourcesContent = map.sources.map((source) => source == null ? null : read(join(dirname(file), map.sourceRoot ?? "", source)) ?? null)
        write(file_map, JSON.stringify(map))
      }
    }

    function relativize(module_path: string): string | null {
      if (module_path.startsWith("/") || module_path.startsWith("#") || module_path.startsWith("@") || /^\w+:/.test(module_path)) {
        return null
      }

      const base = module_path.startsWith(".") ? dirname(file) : base_path
      const module_file = join(base, module_path)
      // Resolve to the emitted file, including wrapped CSS and GLSL modules.
      // Package imports have no matching file in lib and remain unchanged.
      const resolved = [module_file, `${module_file}.js`, join(module_file, "index.js")].find(file_exists)
      if (resolved == null) {
        return null
      }

      const rel_path = relative(dirname(file), resolved).replaceAll("\\", "/")
      return rel_path.startsWith(".") ? rel_path : `./${rel_path}`
    }

    const rewrites: {new_path: string, start: number, end: number}[] = []
    function rewrite({value, start, end}: oxc.StringLiteral): void {
      const new_path = relativize(value)
      if (new_path != null && new_path != value) {
        rewrites.push({new_path, start, end})
      }
    }

    const {program} = oxc.parseSync(file, source)
    new oxc.Visitor({
      ImportDeclaration(node) { rewrite(node.source) },
      ExportAllDeclaration(node) { rewrite(node.source) },
      ExportNamedDeclaration(node) {
        if (node.source != null) {
          rewrite(node.source)
        }
      },
      ImportExpression(node) {
        if (node.source.type == "Literal" && typeof node.source.value == "string") {
          rewrite(node.source)
        }
      },
      TSImportType(node) { rewrite(node.source) },
    }).visit(program)

    // JavaScript optimizers are free to mangle class identifiers. Model names are
    // also used for serialization and CSS classes, so preserve the source name in
    // the class itself. A static field is tree-shakeable with its containing class
    // and is initialized before user-defined static blocks execute.
    const stable_names: {name: string, start: number}[] = []
    if (file.endsWith(".js")) {
      for (const statement of program.body) {
        const declaration = statement.type == "ExportNamedDeclaration" ? statement.declaration : statement
        if (declaration?.type != "ClassDeclaration" || declaration.id == null) {
          continue
        }

        const already_named = declaration.body.body.some((member) =>
          member.type == "PropertyDefinition" && member.static &&
          member.key.type == "Identifier" && member.key.name == "__name__",
        )
        if (!already_named) {
          stable_names.push({name: declaration.id.name, start: declaration.body.start + 1})
        }
      }
    }

    if (rewrites.length != 0 || stable_names.length != 0) {
      const str = new MagicString(source, {filename: file})
      for (const {new_path, start, end} of rewrites) {
        str.update(start, end, `"${new_path}"`)
      }

      for (const {name, start} of stable_names) {
        str.appendLeft(start, `\n    static __name__ = ${JSON.stringify(name)};`)
      }

      const new_source = str.toString()
      if (file_exists(file_map)) {
        const source_map = fs.readFileSync(file_map, {encoding: "utf-8"})
        const new_source_map = str.generateMap({
          hires: true,
          source: basename(file),
          file: basename(file),
          includeContent: true,
        }).toString()

        // Compose rewritten JS -> emitted JS -> original TypeScript, in that order.
        const gen_source_map = remapping([new_source_map, source_map], () => null).toString()
        fs.writeFileSync(file_map, gen_source_map, {encoding: "utf-8"})
      }

      fs.writeFileSync(file, new_source, {encoding: "utf-8"})
    }
  }
})

task("scripts:version", async () => {
  function version(lib_dir: string) {
    const version_js = "version.js"
    const version_js_path = join(lib_dir, version_js)
    const version_map_path = join(lib_dir, `${version_js}.map`)

    const source = fs.readFileSync(version_js_path, {encoding: "utf-8"})
    if (!source.includes("VERSION")) {
      return
    }
    const str = new MagicString(source, {filename: version_js})
    str.replace("VERSION", pkg.version)

    const map = str.generateMap({
      source: version_js,
      file: `${version_js}.map`,
      includeContent: true,
    })

    fs.writeFileSync(version_js_path, str.toString())
    const original = fs.readFileSync(version_map_path, "utf8")
    fs.writeFileSync(version_map_path, remapping([map.toString(), original], () => null).toString())
  }
  version(join(paths.build_dir.js, "lib"))
})

task("scripts:compile", [passthrough("scripts:typescript"), "scripts:imports", "scripts:version"])

task("scripts:bundle", [passthrough("scripts:compile")], async () => {
  const {bokehjs, gl, api, widgets, tables, mathjax} = paths.bundles
  await bundle({
    components: [bokehjs, gl, api, widgets, tables, mathjax],
    base: paths.build_dir.lib,
    detect_cycles: argv.detectCycles,
    version: pkg.version,
    esm: true,
    plugins: [{
      name: "bokeh-mathjax-version",
      load(id) {
        // https://github.com/bokeh/bokeh/issues/12142
        return id.endsWith("mathjax-full/js/components/version.js") ? 'exports.VERSION = "0.0.0";' : null
      },
    }],
  })

  const license = fs.readFileSync(join(paths.base_dir, "..", "LICENSE.txt"), {encoding: "utf-8"})
  for (const minify of [false, true]) {
    await esbuild.build({
      entryPoints: [paths.embed_bootstrap.main],
      sourcemap: true,
      outfile: minify ? rename(paths.embed_bootstrap.output, {ext: ".min.js"}) : paths.embed_bootstrap.output,
      bundle: true,
      format: "iife",
      target: "es2024",
      minify,
      banner: {js: comment(license)},
    })
  }
})
