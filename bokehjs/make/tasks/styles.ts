import {collect_styles, compile_styles} from "#compiler/styles.js"
import {task, BuildError} from "../task.js"
import * as paths from "../paths.js"

task("styles:compile", async () => {
  const less_dir = paths.src_dir.less
  const css_dir = paths.build_dir.css
  const styles = collect_styles(less_dir)
  if (!await compile_styles(styles, less_dir, css_dir)) {
    throw new BuildError("styles:compile", "failed to compile *.less and *.css source files")
  }
})
