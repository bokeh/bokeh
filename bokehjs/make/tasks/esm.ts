import {join} from "node:path"
import cp from "node:child_process"
import fs from "node:fs"

import * as esbuild from "esbuild"
import type {Plugin} from "esbuild"
import MagicString from "magic-string"

import {task, passthrough, BuildError} from "../task.js"
import * as paths from "../paths.js"

// Don't use imports here, because TS will copy package.json to make/_build
// and that will mess up node's module resolution.
const pkg_file = fs.readFileSync("./make/package.json", {encoding: "utf-8"})
const pkg = JSON.parse(pkg_file) as {version: string}

task("scripts:compile:tsgo", ["scripts:styles", "scripts:glsl", "scripts:grammar"], async () => {
  const is_windows = process.platform == "win32"
  const npx = is_windows ? "npx.cmd" : "npx"
  const {status} = cp.spawnSync(npx, ["tsgo", "--project", "./src/lib/tsconfig.esm.json"], {stdio: "inherit", shell: is_windows})
  if (status != 0) {
    throw new BuildError("typescript", "compilation failed with tsgo")
  }
})

//import * as oxc from "oxc-parser"
//const result = oxc.parseSync("file.js", "source", {})
//result.module.staticImports

task("scripts:version:esm", async () => {
  function version(lib_dir: string) {
    const version_js = "version.js"
    const version_js_path = join(lib_dir, version_js)
    const version_map_path = join(lib_dir, `${version_js}.map`)

    const source = fs.readFileSync(version_js_path, {encoding: "utf-8"})
    const str = new MagicString(source, {filename: version_js})
    str.replace("VERSION", pkg.version)

    const map = str.generateMap({
      source: version_js,
      file: `${version_js}.map`,
      includeContent: true,
    })

    fs.writeFileSync(version_js_path, str.toString())
    fs.writeFileSync(version_map_path, map.toString())
  }
  version(join(paths.build_dir.esm, "lib"))
})

task("scripts:bundle:esm", [passthrough("scripts:compile:tsgo"), passthrough("scripts:version:esm")], async () => {
  const packages = [paths.bundles.esm]

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

const is_dir = (path: string) => fs.lstatSync(path).isDirectory()
const is_file = (path: string) => fs.lstatSync(path).isFile()
const exists = (path: string) => fs.existsSync(path)

export function TSConfigPathsPlugin(): Plugin {
  return {
    name: "tsconfig-paths",
    setup({onResolve}) {
      onResolve({filter: /.*/}, async (args) => {
        const {path} = args

        if (path.startsWith("./") || path.startsWith("../")) {
          return null
        }

        let resolved = join(paths.build_dir.esm, "lib", path)
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

task("lib:build", ["scripts:bundle:esm", "scripts:bundle"])
