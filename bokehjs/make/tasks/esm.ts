import {join} from "node:path"

import * as esbuild from "esbuild"
import type {Plugin} from "esbuild"

import {task, passthrough} from "../task.js"
import * as paths from "../paths.js"
import {exists, is_file, is_dir} from "./_util.js"

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
    plugins: [
      TSConfigPathsPlugin(),
    ],
  })
})

export function TSConfigPathsPlugin(): Plugin {
  return {
    name: "tsconfig-paths",
    setup({onResolve}) {
      onResolve({filter: /.*/}, async (args) => {
        const {path} = args

        if (path.startsWith("./") || path.startsWith("../")) {
          return null
        }

        let resolved = join(paths.build_dir.lib, path)
        if (!exists(resolved)) {
          resolved = `${resolved}.js`
          if (!exists(resolved) || !is_file(resolved)) {
            return null
          }
        } else if (is_dir(resolved)) {
          resolved = join(resolved, "index.js")
          if (!exists(resolved) || !is_file(resolved)) {
            return null
          }
        }

        return {path: resolved}
      })
    },
  }
}

task("lib:build", ["scripts:bundle", "scripts:bundle:esm"])
