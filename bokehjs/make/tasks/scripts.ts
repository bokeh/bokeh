import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {rename} from "@compiler/sys"
import {compile_typescript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
import * as paths from "../paths"

task("scripts:compile", ["styles:compile"], async () => {
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

task("scripts:bundle-es6", ["scripts:compile"], async () => {
  const {bokehjs, gl, api, widgets, tables} = paths.lib
  const packages = [bokehjs, gl, api, widgets, tables]

  const linker = new Linker({
    entries: packages.map((pkg) => pkg.main),
    bases: [paths.build_dir.lib, "./node_modules"],
    cache: argv.cache !== false ? join(paths.build_dir.js, "cache-es6.json") : undefined,
    externals: ["@jupyter-widgets/base"],
  })

  const bundles = linker.link()
  linker.store_cache()

  const outputs = packages.map((pkg) => {
    return rename(pkg.output, {name: (name) => name + "-es6"})
  })

  function bundle(minified: boolean, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble(minified))
      .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle(false, outputs)
  bundle(true, outputs.map(min_js))
})

task("scripts:bundle-es5", ["scripts:compile"], async () => {
  const {bokehjs, gl, api, widgets, tables} = paths.lib
  const packages = [bokehjs, gl, api, widgets, tables]

  const linker = new Linker({
    entries: packages.map((pkg) => pkg.legacy || pkg.main),
    bases: [paths.build_dir.lib, "./node_modules"],
    cache: argv.cache !== false ? join(paths.build_dir.js, "cache-es5.json") : undefined,
    externals: ["@jupyter-widgets/base"],
    transpile: true,
  })

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

task("scripts:build", ["scripts:bundle-es6", "scripts:bundle-es5"])

task("scripts:minify", ["scripts:build"])

task("scripts", ["scripts:build", "scripts:minify"])
