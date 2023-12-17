import {join, relative} from "path"
import fs from "fs"

import {task, passthrough, BuildError} from "../task"
import {rename, read, write, scan} from "@compiler/sys"
import {wrap_css_modules} from "@compiler/styles"
import {compile_typescript} from "@compiler/compiler"
import type {AssemblyOptions} from "@compiler/linker"
import {Linker} from "@compiler/linker"
import * as preludes from "@compiler/prelude"

import {argv} from "../main"
import * as paths from "../paths"

import pkg from "../../package.json"

task("scripts:version", async () => {
  const js = `export const version = "${pkg.version}";\n`
  const dts = "export declare const version: string;\n"

  write(join(paths.build_dir.lib, "version.js"), js)
  write(join(paths.build_dir.lib, "version.d.ts"), dts)
})

task("scripts:styles", ["styles:compile"], async () => {
  const css_dir = paths.build_dir.css
  const js_dir = paths.build_dir.lib
  const dts_dir = paths.build_dir.lib
  const dts_internal_dir = join(paths.build_dir.all, "dts")

  wrap_css_modules(css_dir, js_dir, dts_dir, dts_internal_dir)
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

task("scripts:compile", ["scripts:styles", "scripts:glsl", "scripts:version"], async () => {
  compile_typescript(join(paths.src_dir.lib, "tsconfig.json"))
})

function min_js(js: string): string {
  return rename(js, {ext: ".min.js"})
}

task("scripts:bundle", [passthrough("scripts:compile")], async () => {
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

  const esm_prelude = {
    main: preludes.prelude_esm(),
    plugin: preludes.plugin_prelude_esm(),
  }

  const esm_postlude = {
    main: preludes.postlude_esm(),
    plugin: preludes.plugin_postlude_esm(),
  }

  function bundle(options: AssemblyOptions, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble(options))
      .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle({prelude, postlude, minified: false}, outputs)
  bundle({prelude, postlude, minified: true}, outputs.map(min_js))

  const esm = {prelude: esm_prelude, postlude: esm_postlude}
  bundle({...esm, minified: false}, outputs.map((name) => rename(name, {ext: ".esm.js"})))
  bundle({...esm, minified: true}, outputs.map((name) => rename(name, {ext: ".esm.min.js"})))

  if (!status) {
    throw new BuildError("scripts:bundle", "unable to bundle modules")
  }
})

task("lib:build", ["scripts:bundle"])

task("scripts:build", ["lib:build"])

task("packages:prepare", ["scripts:bundle"], async () => {
  const bundles = ["bokeh", "bokeh-api", "bokeh-widgets", "bokeh-tables"]
  const suffixes = ["", ".esm"]
  const pkgs_dir = paths.build_dir.packages

  for (const suffix of suffixes) {
    const root = `@bokeh/bokeh${suffix}`

    for (const bundle of bundles) {
      const name = `@bokeh/${bundle}${suffix}`
      const main = `${bundle}${suffix}.min.js`

      const spec = {
        name,
        version: pkg.version,
        description: pkg.description,
        keywords: pkg.keywords,
        license: pkg.license,
        repository: pkg.repository,
        main,
        module: suffix == ".esm" ? main : undefined,
        // TODO: types
        dependencies: name != root ? [{[root]: `^${pkg.version}`}] : [],
      }

      const pkg_dir = join(pkgs_dir, name)

      const json = JSON.stringify(spec, undefined, 2)
      write(join(pkg_dir, "package.json"), json)

      await fs.promises.copyFile(join(paths.build_dir.js, main), join(pkg_dir, main))
    }
  }
})
