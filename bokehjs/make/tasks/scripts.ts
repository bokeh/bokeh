import {join, relative} from "node:path"
import cp from "node:child_process"
import fs from "node:fs"

import {task, passthrough, BuildError} from "../task.js"

import {rename, read, write, scan} from "#compiler/sys.js"
import {wrap_css_modules} from "#compiler/styles.js"
import {compile_typescript} from "#compiler/compiler.js"
import type {AssemblyOptions} from "#compiler/linker.js"
import {Linker} from "#compiler/linker.js"
import * as preludes from "#compiler/prelude.js"

import {argv} from "../args.js"
import * as paths from "../paths.js"

// Don't use imports here, because TS will copy package.json to make/_build
// and that will mess up node's module resolution.
const pkg_file = fs.readFileSync("./make/package.json", {encoding: "utf-8"})
const pkg = JSON.parse(pkg_file) as {version: string}

task("scripts:version", async () => {
  const version_js_path = join(paths.build_dir.lib, "version.js")
  const version_js = fs.readFileSync(version_js_path, {encoding: "utf-8"})
  const version_js_updated = version_js.replace("VERSION", pkg.version)
  fs.writeFileSync(version_js_path, version_js_updated)
})

task("scripts:styles", ["styles:compile"], async () => {
  const css_dir = paths.build_dir.css
  const js_dir = paths.build_dir.lib
  const dts_dir = paths.build_dir.lib
  const dts_internal_dir = join(paths.build_dir.all, "dts")

  wrap_css_modules(css_dir, js_dir, dts_dir, dts_internal_dir)
})

task("scripts:grammar", async () => {
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
    const js_path = rename(join(paths.build_dir.lib, sub_path), {ext: ".js"})
    write(js_path, "") // make sure path exists before running nearleyc
    compile_grammar(ne_path, js_path)
  }
})

task("scripts:glsl", async () => {
  const lib_base = paths.src_dir.lib

  const js_base = paths.build_dir.lib
  const dts_base = paths.build_dir.lib

  for (const glsl_path of scan(lib_base, [".vert", ".frag"])) {
    const sub_path = relative(lib_base, glsl_path)

    const js = `\
const shader = \`\n${read(glsl_path)}\`;
export default shader;
`
    const dts = `\
declare const shader: string;
export default shader;
`

    write(`${join(js_base, sub_path)}.js`, js)
    write(`${join(dts_base, sub_path)}.d.ts`, dts)
  }
})

task("scripts:compile", ["scripts:styles", "scripts:glsl", "scripts:grammar"], async () => {
  compile_typescript(join(paths.src_dir.lib, "tsconfig.json"))
})

// This doesn't apply necessary transforms to produce output usable by scripts:bundle. This
// is used only for experimentation with third-party bundlers like esbuild. However, you can
// enable tsgo as a faster LSP in your editor/IDE.
task("scripts:compile:tsgo", ["scripts:styles", "scripts:glsl", "scripts:grammar"], async () => {
  const is_windows = process.platform == "win32"
  const npx = is_windows ? "npx.cmd" : "npx"
  const {status} = cp.spawnSync(npx, ["tsgo", "--project", "./src/lib/tsconfig.json"], {stdio: "inherit", shell: is_windows})
  if (status != 0) {
    throw new BuildError("typescript", "compilation failed with tsgo")
  }
})

function min_js(js: string): string {
  return rename(js, {ext: ".min.js"})
}

task("scripts:bundle", [passthrough("scripts:compile"), "scripts:version"], async () => {
  const {bokehjs, gl, api, widgets, tables, mathjax} = paths.lib
  const packages = [bokehjs, gl, api, widgets, tables, mathjax]

  const linker = new Linker({
    entries: packages.map((pkg) => pkg.main),
    bases: [paths.build_dir.lib, "./node_modules"],
    cache: argv.cache ? join(paths.build_dir.js, "bokeh.json") : undefined,
    target: "ES2020",
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

task("lib:build", ["scripts:bundle"])

export const build_scripts = task("scripts:build", ["lib:build"])
