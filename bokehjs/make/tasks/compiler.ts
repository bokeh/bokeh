import {join} from "path"
import {argv} from "yargs"

import {task, BuildError} from "../task"
import {compile_typescript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
import * as preludes from "@compiler/prelude"
import {src_dir, build_dir} from "../paths"

task("compiler:ts", async () => {
  compile_typescript(join(src_dir.compiler, "tsconfig.json"))
})

task("compiler:build", ["compiler:ts"], async () => {
  const compiler = {
    name: "compiler",
    main: join(build_dir.compiler, "main.js"),
    output: join(build_dir.js, "compiler.js"),
  }
  const bases = [build_dir.compiler, "./node_modules"]
  const externals = ["@microsoft/typescript-etw", "fsevents"]
  const builtins = true
  const minify = false
  const es_modules = false
  const cache = argv.cache !== false ? join(build_dir.js, "compiler.json") : undefined

  const linker = new Linker({entries: [compiler], bases, externals, builtins, minify, es_modules, cache})

  if (!argv.rebuild) linker.load_cache()
  const {bundles: [bundle], status} = await linker.link()
  linker.store_cache()

  const prelude = {
    main: preludes.prelude(),
    plugin: preludes.plugin_prelude(),
  }

  const postlude = {
    main: preludes.postlude(),
    plugin: preludes.plugin_postlude(),
  }

  bundle.assemble({prelude, postlude}).write(compiler.output)

  if (!status)
    throw new BuildError("compiler:build", "unable to bundle modules")
})
