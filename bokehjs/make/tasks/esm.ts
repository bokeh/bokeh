import {join} from "node:path"

import * as esbuild from "esbuild"

import {task, passthrough} from "../task.js"
import * as paths from "../paths.js"

task("scripts:bundle:esm", [passthrough("scripts:compile")], async () => {
  const packages = [paths.bundles.all]

  const entries = packages.map((pkg) => {
    return {
      in: pkg.main,
      out: pkg.output.replace(/\.js$/, ""),
    }
  })

  async function build(minify: boolean) {
    await esbuild.build({
      entryPoints: entries,
      outdir: join(paths.build_dir.esm),
      outExtension: {".js": minify ? ".min.js" : ".js"},
      platform: "browser",
      format: "esm",
      target: "ES2024",
      bundle: true,
      minify,
      keepNames: true,
      treeShaking: true,
      sourcemap: true,
      metafile: true,
      logOverride: {
        "direct-eval": "silent",
      },
    })
  }

  await build(false)
  await build(true)
})

task("lib:build", ["scripts:bundle", "scripts:bundle:esm"])
