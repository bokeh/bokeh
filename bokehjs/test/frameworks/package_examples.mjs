import {spawn} from "node:child_process"
import {cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from "node:fs"
import {join, relative, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const frameworks_dir = fileURLToPath(new URL(".", import.meta.url))
const bokehjs_dir = resolve(frameworks_dir, "../..")
const examples_dir = join(bokehjs_dir, "examples/frameworks")
const build_dir = join(bokehjs_dir, "build/test/frameworks/packaged")
const packages_dir = join(build_dir, "packages")
const workspace_dir = join(build_dir, "workspace")

const examples = [
  "angular-ng",
  "react-vite",
  "node-ssr-compat",
  "svelte-vite",
  "vanilla-rspack",
  "vanilla-vite",
  "vanilla-webpack",
  "vue-vite",
  "web-component-webpack",
]

// Keep the published examples concise; specialized lifecycle controls belong in
// test-only entry points that are overlaid when the packed-package matrix runs.
const applications = [
  ...examples.map((name) => ({
    name,
    source: name,
    package_name: `@bokeh-example/${name}`,
    entry_point: null,
  })),
  {
    name: "angular-lifecycle",
    source: "angular-ng",
    package_name: "@bokeh-test/angular-lifecycle",
    entry_point: join(frameworks_dir, "apps/angular/src/main.ts"),
  },
]

const npm_packages = JSON.parse(readFileSync(join(bokehjs_dir, "npm_packages.json"), "utf-8"))
const package_dirs = new Map(npm_packages.map(({name, workspace}) => [name, join(bokehjs_dir, workspace)]))

function command(name) {
  return process.platform == "win32" ? `${name}.cmd` : name
}

async function run(executable, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command(executable), args, {cwd, stdio: "inherit"})
    child.on("error", reject)
    child.on("exit", (code, signal) => {
      if (code == 0) {
        resolve()
      } else {
        reject(new Error(`${executable} ${args.join(" ")} failed with ${signal ?? `exit code ${code}`}`))
      }
    })
  })
}

async function pack(name, cwd) {
  await run("npm", ["pack", "--silent", "--ignore-scripts", `--pack-destination=${packages_dir}`], cwd)
  const {version} = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"))
  const filename = `${name.replace("@", "").replace("/", "-")}-${version}.tgz`
  return join(packages_dir, filename)
}

function verify_bundle_budget(example, root) {
  const files = readdirSync(root, {recursive: true})
    .filter((file) => typeof file == "string" && file.endsWith(".js") && !file.replaceAll("\\", "/").startsWith("node_modules/"))
    .map((file) => ({file, bytes: statSync(join(root, file)).size}))
  if (files.length == 0) {
    return
  }

  const largest = files.reduce((left, right) => left.bytes >= right.bytes ? left : right)
  const total = files.reduce((sum, file) => sum + file.bytes, 0)
  const max_chunk_bytes = 2_100_000
  const max_total_bytes = 4_000_000
  if (largest.bytes > max_chunk_bytes || total > max_total_bytes) {
    throw new Error(`${example} exceeded its JavaScript bundle budget: largest=${largest.file} (${largest.bytes}), total=${total}`)
  }
  console.log(`bundle budget passed: ${example} (largest ${largest.bytes} bytes, total ${total} bytes)`)
}

rmSync(build_dir, {recursive: true, force: true})
mkdirSync(packages_dir, {recursive: true})
mkdirSync(workspace_dir, {recursive: true})

const tarballs = new Map()
for (const [name, cwd] of package_dirs) {
  tarballs.set(name, await pack(name, cwd))
}

for (const {name, source, package_name, entry_point} of applications) {
  const destination = join(workspace_dir, name)
  cpSync(join(examples_dir, source), destination, {recursive: true})
  if (entry_point != null) {
    cpSync(entry_point, join(destination, "src/main.ts"))
  }

  const package_path = join(destination, "package.json")
  const pkg = JSON.parse(readFileSync(package_path, "utf-8"))
  pkg.name = package_name
  for (const section of ["dependencies", "devDependencies"]) {
    for (const name of Object.keys(pkg[section] ?? {})) {
      const tarball = tarballs.get(name)
      if (tarball != null) {
        pkg[section][name] = `file:${relative(destination, tarball)}`
      }
    }
  }
  writeFileSync(package_path, `${JSON.stringify(pkg, null, 2)}\n`)
}

writeFileSync(join(workspace_dir, "package.json"), `${JSON.stringify({
  name: "bokeh-framework-examples",
  private: true,
  version: "0.0.0",
  workspaces: applications.map(({name}) => name),
  dependencies: Object.fromEntries(
    [...tarballs].map(([name, tarball]) => [name, `file:${relative(workspace_dir, tarball)}`]),
  ),
}, null, 2)}\n`)

await run("npm", ["install", "--no-audit", "--no-fund"], workspace_dir)
for (const {name, package_name} of applications) {
  await run("npm", ["run", "build", "--workspace", package_name], workspace_dir)
  verify_bundle_budget(name, join(workspace_dir, name))
}

console.log(`packed framework examples built in ${workspace_dir}`)
