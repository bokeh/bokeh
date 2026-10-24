import {rolldown} from "rolldown"

import {task, passthrough} from "../task.js"
import * as paths from "../paths.js"
import {bundle_log, input_sourcemaps, output_options} from "#compiler/bundle.js"
import {preserve_import_annotations} from "#compiler/import_annotations.js"

task("scripts:bundle:esm", [passthrough("scripts:compile")], async () => {
  const build = await rolldown({
    input: paths.bundles.all.main,
    platform: "browser",
    transform: {target: "es2024"},
    plugins: [input_sourcemaps()],
    onLog: bundle_log,
  })
  try {
    for (const minify of [false, true]) {
      await build.write({
        ...output_options,
        file: paths.bundles.all.output.replace(/\.js$/, minify ? ".min.js" : ".js"),
        format: "esm",
        codeSplitting: false,
        minify,
        plugins: [preserve_import_annotations()],
      })
    }
  } finally {
    await build.close()
  }
})

task("lib:build", ["scripts:bundle", "scripts:bundle:esm"])
