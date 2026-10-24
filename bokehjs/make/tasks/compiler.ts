import fs from "node:fs/promises"
import {join} from "node:path"

import * as esbuild from "esbuild"

import {task, passthrough} from "../task.js"
import {base_dir, src_dir, build_dir} from "../paths.js"
import {compile_typescript} from "./_util.js"
import {compiler_notices} from "../licenses.js"

task("compiler:ts", async () => {
  compile_typescript(join(src_dir.compiler, "tsconfig.json"))
})

task("compiler:build", [passthrough("compiler:ts")], async () => {
  const runtime_dir = join(src_dir.compiler, "runtime")
  const {dependencies} = JSON.parse(await fs.readFile(join(runtime_dir, "package.json"), "utf8")) as {
    dependencies: Record<string, string>
  }
  const {packages} = JSON.parse(await fs.readFile(join(runtime_dir, "package-lock.json"), "utf8")) as {
    packages: Record<string, {version?: string, dependencies?: Record<string, string>}>
  }
  const locked_dependencies = packages[""].dependencies ?? {}
  if (Object.keys(dependencies).length != Object.keys(locked_dependencies).length) {
    throw new Error("Compiler runtime manifest and lockfile dependencies differ")
  }
  for (const [name, expected] of Object.entries(dependencies)) {
    const {version} = JSON.parse(await fs.readFile(join(base_dir, "node_modules", name, "package.json"), "utf8")) as {
      version: string
    }
    if (version != expected || locked_dependencies[name] != expected || packages[`node_modules/${name}`]?.version != expected) {
      throw new Error(`Compiler runtime ${name} must match the installed and locked version ${expected}`)
    }
  }

  // Remove artifacts from the former portable compiler before packaging an
  // incremental build. Native tools are installed from the shipped lockfile.
  for (const path of ["portable", "typescript.mjs", "warnings.cjs"]) {
    await fs.rm(join(build_dir.compiler, path), {recursive: true, force: true})
  }
  await fs.rm(join(build_dir.all, "tslib"), {recursive: true, force: true})

  const compiler = await esbuild.build({
    platform: "node",
    target: "node22.13",
    bundle: true,
    minify: true,
    keepNames: true,
    treeShaking: true,
    sourcemap: true,
    metafile: true,
    entryPoints: [join(build_dir.compiler, "main.js")],
    outfile: join(build_dir.compiler, "compiler.mjs"),
    format: "esm",
    external: ["rolldown", "rolldown/*"],
    // Bundled CommonJS dependencies still need Node's require and file globals.
    banner: {js: `\
import {createRequire as __createRequire} from "node:module";
import {fileURLToPath as __fileURLToPath} from "node:url";
import {dirname as __dirnameOf} from "node:path";
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirnameOf(__filename);`},
  })

  await fs.writeFile(join(build_dir.compiler, "THIRD-PARTY-LICENSE.compiler"), await compiler_notices([compiler.metafile]))
  for (const name of ["package.json", "package-lock.json"]) {
    await fs.copyFile(join(runtime_dir, name), join(build_dir.compiler, name))
  }

  // Keep the entry path used by bokeh.ext and bokeh.util.compiler.
  await fs.copyFile(join(src_dir.compiler, "launcher.js"), join(build_dir.js, "compiler.js"))
})
