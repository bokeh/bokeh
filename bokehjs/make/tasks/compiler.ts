import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {compile_typescript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
import {src_dir, build_dir} from "../paths"

task("compiler:ts", async () => {
  const success = compile_typescript(join(src_dir.compiler, "tsconfig.json"), {
    log,
    out_dir: build_dir.compiler,
  })

  if (argv.emitError && !success)
    process.exit(1)
})

task("compiler:build", ["compiler:ts"], async () => {
  const entries = [join(build_dir.compiler, "main.js")]
  const bases = [build_dir.compiler, "./node_modules"]
  const ignores = ["babel-core", "@babel/core"] // XXX: remove together with coffeescript
  const builtins = true
  const minify = false
  const cache = argv.cache !== false ? join(build_dir.js, "compiler-cache.json") : undefined

  const linker = new Linker({entries, bases, ignores, builtins, minify, cache})
  const [bundle] = linker.link()
  linker.store_cache()

  bundle.assemble().write(join(build_dir.js, "compiler.js"))
})
