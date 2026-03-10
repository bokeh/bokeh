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

  await esbuild.build({
    entryPoints: entries,
    outdir: join(paths.build_dir.esm),
    platform: "browser",
    format: "esm",
    target: "ES2024",
    bundle: true,
    minify: false,
    keepNames: true,
    treeShaking: true,
    sourcemap: true,
    metafile: true,
  })
})

task("lib:build", ["scripts:bundle", "scripts:bundle:esm"])
