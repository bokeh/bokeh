import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {compileTypeScript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
import {src_dir, build_dir} from "../paths"

task("compiler:ts", async () => {
  const success = compileTypeScript(join(src_dir.compiler, "tsconfig.json"), {
    log,
    out_dir: build_dir.compiler,
  })

  if (argv.emitError && !success)
    process.exit(1)
})

task("compiler:build", ["compiler:ts"], async () => {
  const entries = [join(build_dir.compiler, "compile.js")]
  const bases = [build_dir.compiler, "./node_modules"]
  const ignores = ["babel-core", "@babel/core"] // XXX: remove together with coffeescript
  const builtins = true
  const minify = false
  const cache = join(build_dir.js, "compiler-cache.json")

  const linker = new Linker({entries, bases, ignores, builtins, minify, cache})
  const [bundle] = linker.link()
  linker.store_cache()

  bundle.assemble().write(join(build_dir.js, "compiler.js"))
})
