import {join, relative} from "path"
import {argv} from "yargs"

import {task, passthrough} from "../task"
import {rename, read, write, scan} from "@compiler/sys"
import {compile_typescript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
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
  compile_typescript(join(paths.src_dir.lib, "tsconfig.json"), {
    out_dir: {js: paths.build_dir.lib, dts: paths.build_dir.types},
  })
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
    prelude: preludes.prelude,
    plugin_prelude: () => preludes.plugin_prelude({version: pkg.version}),
    target: "ES2017",
    exports: ["tslib"],
  })

  if (!argv.rebuild) linker.load_cache()
  const bundles = linker.link()
  linker.store_cache()

  const outputs = packages.map((pkg) => pkg.output)

  function bundle(minified: boolean, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble(minified))
      .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle(false, outputs)
  bundle(true, outputs.map(min_js))
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
  const bundles = linker.link()
  linker.store_cache()

  const outputs = packages.map((pkg) => pkg.output)

  function bundle(minified: boolean, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble(minified))
      .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle(false, outputs)
  bundle(true, outputs.map(min_js))
})

task("lib:build", ["scripts:bundle"])

task("scripts:build", ["lib:build", "scripts:bundle-legacy"])
