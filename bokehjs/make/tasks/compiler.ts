import {join} from "path"
import {argv} from "yargs"

import {task} from "../task"
import {compile_typescript} from "@compiler/compiler"
import {Linker} from "@compiler/linker"
import {src_dir, build_dir} from "../paths"

task("compiler:ts", async () => {
  compile_typescript(join(src_dir.compiler, "tsconfig.json"), {out_dir: build_dir.compiler})
})

task("compiler:build", ["compiler:ts"], async () => {
  const entries = [join(build_dir.compiler, "main.js")]
  const bases = [build_dir.compiler, "./node_modules"]
  const externals = ["@microsoft/typescript-etw", "fsevents"]
  const builtins = true
  const minify = false
  const es_modules = false
  const cache = argv.cache !== false ? join(build_dir.js, "compiler.json") : undefined

  const linker = new Linker({entries, bases, externals, builtins, minify, es_modules, cache})

  if (!argv.rebuild) linker.load_cache()
  const [bundle] = linker.link()
  linker.store_cache()

  bundle.assemble().write(join(build_dir.js, "compiler.js"))
})
