import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {rename} from "@compiler/fs"
import {compileTypeScript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
import * as paths from "../paths"

task("scripts:compile", ["styles:compile"], async () => {
  const success = compileTypeScript(join(paths.src_dir.lib, "tsconfig.json"), {
    log,
    out_dir: {js: paths.build_dir.lib, dts: paths.build_dir.types},
    css_dir: paths.build_dir.css,
  })

  if (argv.emitError && !success)
    process.exit(1)
})

task("scripts:bundle", ["scripts:compile"], async () => {
  const {bokehjs, gl, api, widgets, tables} = paths.lib
  const packages = [bokehjs, gl, api, widgets, tables]

  const linker = new Linker({
    entries: packages.map((pkg) => pkg.main),
    bases: [paths.build_dir.lib, "./node_modules"],
    cache: join(paths.build_dir.js, "cache.json"),
  })

  const bundles = linker.link()
  linker.store_cache()
  const outputs = packages.map((pkg) => pkg.output)

  const min_js = (js: string) => rename(js, {ext: '.min.js'})

  function bundle(minified: boolean, outputs: string[]) {
    bundles.map((bundle) => bundle.assemble(minified))
           .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle(false, outputs)
  bundle(true, outputs.map(min_js))
})

task("scripts:build", ["scripts:bundle"])

task("scripts:minify", ["scripts:bundle"])

task("scripts", ["scripts:build", "scripts:minify"])
