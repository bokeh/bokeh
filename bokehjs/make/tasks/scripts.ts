import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {rename, write} from "@compiler/sys"
import {compile_typescript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
import * as preludes from "@compiler/prelude"
import * as paths from "../paths"

import pkg from "../../package.json"

task("scripts:version", async () => {
  const js = `export const version = "${pkg.version}";\n`
  write(join(paths.build_dir.lib, "version.js"), js)

  const dts = `export declare const version: string;\n`
  write(join(paths.build_dir.types, "version.d.ts"), dts)
})

task("scripts:compile", ["styles:compile", "scripts:version"], async () => {
  const success = compile_typescript(join(paths.src_dir.lib, "tsconfig.json"), {
    log,
    out_dir: {js: paths.build_dir.lib, dts: paths.build_dir.types},
    css_dir: paths.build_dir.css,
  })

  if (argv.emitError && !success)
    process.exit(1)
})

function min_js(js: string): string {
  return rename(js, {ext: '.min.js'})
}

task("scripts:bundle", ["scripts:compile"], async () => {
  const {bokehjs, gl, api, widgets, tables} = paths.lib
  const packages = [bokehjs, gl, api, widgets, tables]

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

task("scripts:bundle-legacy", ["scripts:compile"], async () => {
  const {bokehjs, gl, api, widgets, tables} = paths.lib_legacy
  const packages = [bokehjs, gl, api, widgets, tables]

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

task("scripts:dev-build", ["scripts:bundle"])

task("scripts:build", ["scripts:bundle", "scripts:bundle-legacy"])

task("scripts", ["scripts:build"])
