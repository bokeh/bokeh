import {compile_styles} from "@compiler/styles"
import {task, BuildError} from "../task"
import * as paths from "../paths"

task("styles:compile", async () => {
  const less_dir = paths.src_dir.less
  const css_dir = paths.build_dir.css
  if (!await compile_styles(less_dir, css_dir))
    throw new BuildError("styles:compile", "failed to compile *.less and *.css source files")
})
