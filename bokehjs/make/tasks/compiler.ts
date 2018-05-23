import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {compileTypeScript} from "../compiler"
import {Linker} from "../linker"
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
  const ignores = ["babel-core"]
  const builtins = true

  const linker = new Linker({entries, bases, ignores, builtins})
  const [bundle] = linker.link()

  bundle.write(join(build_dir.js, "compiler.js"))
})
