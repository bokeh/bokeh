import {join, relative} from "path"
import {argv} from "yargs"

import {task, passthrough, BuildError} from "../task"
import {rename, read, write, scan} from "@compiler/sys"
import {compile_typescript} from "@compiler/compiler"
import {Linker, AssemblyOptions} from "@compiler/linker"
import * as preludes from "@compiler/prelude"
import * as paths from "../paths"

import pkg from "../../package.json"

task("scripts:version", async () => {
  const js = `export const version = "${pkg.version}";\n`
  const dts = `export declare const version: string;\n`

  write(join(paths.build_dir.lib, "version.js"), js)
  write(join(paths.build_dir.types, "version.d.ts"), dts)
})

task("scripts:styles", ["styles:compile"], async () => {
  const css_base = paths.build_dir.css

  const js_base = join(paths.build_dir.lib, "styles")
  const dts_base = join(paths.build_dir.types, "styles")

  for (const css_path of scan(css_base, [".css"])) {
    const sub_path = relative(css_base, css_path)

    const js = `\
const css = \`\n${read(css_path)}\`;
export default css;
`
    const dts = `\
declare const css: string;
export default css;
`

    write(rename(join(js_base, sub_path), {ext: ".css.js"}), js)
    write(rename(join(dts_base, sub_path), {ext: ".css.dts"}), dts)
  }
})

task("scripts:compile", ["scripts:styles", "scripts:version"], async () => {
  compile_typescript(join(paths.src_dir.lib, "tsconfig.json"))
})

function min_js(js: string): string {
  return rename(js, {ext: '.min.js'})
}

task("scripts:bundle", [passthrough("scripts:compile")], async () => {
  const {bokehjs, api, widgets, tables} = paths.lib
  const packages = [bokehjs, api, widgets, tables]

  const linker = new Linker({
    entries: packages.map((pkg) => pkg.main),
    bases: [paths.build_dir.lib, "./node_modules"],
    cache: argv.cache !== false ? join(paths.build_dir.js, "bokeh.json") : undefined,
    target: "ES2017",
    exports: ["tslib"],
    detect_cycles: argv.detectCycles === true,
  })

  if (!argv.rebuild) linker.load_cache()
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

  if (!status)
    throw new BuildError("scripts:bundle", "unable to bundle modules")
})

task("scripts:bundle-legacy", [passthrough("scripts:compile")], async () => {
  const {bokehjs, api, widgets, tables} = paths.lib_legacy
  const packages = [bokehjs, api, widgets, tables]

  const linker = new Linker({
    entries: packages.map((pkg) => pkg.main),
    bases: [paths.build_dir.lib, "./node_modules"],
    cache: argv.cache !== false ? join(paths.build_dir.js, "bokeh.legacy.json") : undefined,
    target: "ES5",
  })

  if (!argv.rebuild) linker.load_cache()
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

  function bundle(minified: boolean, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble({prelude, postlude, minified}))
      .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle(false, outputs)
  bundle(true, outputs.map(min_js))

  if (!status)
    throw new BuildError("scripts:bundle", "unable to bundle modules")
})

task("lib:build", ["scripts:bundle"])

task("scripts:build", ["lib:build", "scripts:bundle-legacy"])
