import {spawn} from "node:child_process"
import {createReadStream, existsSync, statSync} from "node:fs"
import {createServer as createHttpServer} from "node:http"
import {extname, join, normalize, relative, resolve} from "node:path"
import {fileURLToPath} from "node:url"

import {chromium} from "playwright-core"
import {build as viteBuild, createServer as createViteServer} from "vite"
import webpack from "webpack"

const frameworks_dir = fileURLToPath(new URL(".", import.meta.url))
const bokehjs_dir = resolve(frameworks_dir, "../..")
const apps_dir = join(frameworks_dir, "apps")
const examples_dir = join(bokehjs_dir, "examples/frameworks")
const packaged_root = join(bokehjs_dir, "build/test/frameworks/packaged")
const workspace_dir = join(packaged_root, "workspace")

const devtools_arg = process.argv.find((arg) => arg.startsWith("--devtools-port="))
if (devtools_arg == null) {
  throw new Error("--devtools-port is required")
}
const devtools_port = Number(devtools_arg.split("=", 2)[1])

function command(name) {
  return process.platform == "win32" ? `${name}.cmd` : name
}

async function run(executable, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command(executable), args, {cwd: bokehjs_dir, stdio: "inherit"})
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

async function build_fixtures() {
  await run("npx", ["tsc", "-p", "test/frameworks/tsconfig.json"])
  await run("npx", ["tsc", "-p", "test/frameworks/types/tsconfig.json"])
  await run("npx", ["tsc", "-p", "test/frameworks/types/tsconfig.nodenext.json"])

  for (const name of ["react", "vue", "svelte"]) {
    const root = join(apps_dir, name)
    await viteBuild({
      root,
      configFile: join(root, "vite.config.ts"),
      logLevel: "error",
    })
  }

  const {default: config} = await import("./apps/webpack/webpack.config.mjs")
  await new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error != null) {
        reject(error)
      } else if (stats?.hasErrors()) {
        reject(new Error(stats.toString({all: false, errors: true, errorDetails: true})))
      } else {
        console.log(stats?.toString({all: false, assets: true, timings: true}))
        resolve()
      }
    })
  })

  await import("./ssr.mjs")
}

const mime_types = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".map", "application/json"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
])

async function static_server(root) {
  const server = createHttpServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname)
    const requested = pathname.endsWith("/") ? `${pathname}index.html` : pathname
    const file = normalize(join(root, requested))
    if (relative(root, file).startsWith("..") || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end("Not found")
      return
    }
    response.setHeader("content-type", mime_types.get(extname(file)) ?? "application/octet-stream")
    response.setHeader("connection", "close")
    createReadStream(file).pipe(response)
  })
  await new Promise((resolve, reject) => {
    server.on("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const address = server.address()
  if (address == null || typeof address == "string") {
    throw new Error("static server didn't allocate a TCP port")
  }
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error == null ? resolve() : reject(error))
      server.closeAllConnections()
    }),
  }
}

async function evaluate(page, expression) {
  return await page.evaluate(expression)
}

async function open_page(url) {
  const context = browser.contexts()[0] ?? await browser.newContext()
  const client = await context.newPage()
  const exceptions = []
  const network_errors = []
  client.on("pageerror", (error) => {
    exceptions.push(error.stack ?? error.message)
  })
  const checked_resource_types = new Set(["document", "script", "stylesheet", "xhr", "fetch", "websocket"])
  client.on("requestfailed", (request) => {
    const type = request.resourceType()
    if (checked_resource_types.has(type)) {
      network_errors.push(`${type} failed: ${request.failure()?.errorText ?? "unknown error"}`)
    }
  })
  client.on("response", (response) => {
    const type = response.request().resourceType()
    if (checked_resource_types.has(type) && response.status() >= 400) {
      network_errors.push(`${type} returned ${response.status()}: ${response.url()}`)
    }
  })
  await client.goto(url, {waitUntil: "load"})
  return {client, exceptions, network_errors}
}

function assert_page_clean(exceptions, network_errors, context) {
  if (exceptions.length != 0) {
    throw new Error(`${context} raised a browser exception:\n${exceptions.join("\n")}`)
  }
  if (network_errors.length != 0) {
    throw new Error(`${context} had a failed application resource:\n${network_errors.join("\n")}`)
  }
}

async function run_page(url, expected_framework) {
  const {client, exceptions, network_errors} = await open_page(url)
  try {
    const result = await evaluate(client, `(async () => {
      const deadline = Date.now() + 30000
      while (window.__bokeh_framework_test__ == null) {
        if (Date.now() > deadline) throw new Error("framework test didn't start")
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
      return await window.__bokeh_framework_test__
    })()`)
    if (result.framework != expected_framework || result.mounts != 4 || result.streams != 3) {
      throw new Error(`unexpected framework result: ${JSON.stringify(result)}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
    assert_page_clean(exceptions, network_errors, expected_framework)
    console.log(`passed: ${expected_framework} at ${url}`)
  } finally {
    await client.close()
  }
}

async function run_smoke_page(url, name, kind = "packed example") {
  console.log(`testing ${kind}: ${name} at ${url}`)
  const {client, exceptions, network_errors} = await open_page(url)
  try {
    const deadline = Date.now() + 30000
    while (!await evaluate(client, `(() => {
      const roots = [document]
      for (let i = 0; i < roots.length; i++) {
        const root = roots[i]
        for (const element of root.querySelectorAll("*")) {
          if (element.shadowRoot != null) roots.push(element.shadowRoot)
        }
        for (const canvas of root.querySelectorAll("canvas")) {
          if (canvas.width >= 200 && canvas.height >= 100) return true
        }
      }
      return false
    })()`)) {
      if (exceptions.length != 0) {
        throw new Error(`${kind} raised a browser exception:\n${exceptions.join("\n")}`)
      }
      if (Date.now() > deadline) {
        throw new Error(`${kind} didn't render a Bokeh figure`)
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    await new Promise((resolve) => setTimeout(resolve, 50))

    const state = async () => await evaluate(client, `(() => {
      const roots = [document]
      const canvases = []
      for (let i = 0; i < roots.length; i++) {
        const root = roots[i]
        for (const element of root.querySelectorAll("*")) {
          if (element.shadowRoot != null) roots.push(element.shadowRoot)
        }
        for (const canvas of root.querySelectorAll("canvas")) {
          if (canvas.width >= 200 && canvas.height >= 100) canvases.push(canvas)
        }
      }

      let fingerprint = 2166136261
      for (const canvas of canvases) {
        const data = canvas.toDataURL()
        for (let i = 0; i < data.length; i++) {
          fingerprint = Math.imul(fingerprint ^ data.charCodeAt(i), 16777619)
        }
      }

      const control = document.querySelector("[data-bokeh-control]")
      const output = document.querySelector("[data-bokeh-output]")
      return {
        control: control instanceof HTMLInputElement ? control.value : null,
        output: output?.textContent ?? null,
        fingerprint: canvases.length == 0 ? null : fingerprint >>> 0,
      }
    })()`)

    const before = await state()
    if (before.control == null || before.output == null || before.fingerprint == null) {
      throw new Error(`${kind} ${name} didn't expose its interactive plot contract`)
    }

    const selected = await evaluate(client, `(() => {
      const control = document.querySelector("[data-bokeh-control]")
      if (!(control instanceof HTMLInputElement)) throw new Error("missing native plot control")
      control.value = control.max
      control.dispatchEvent(new Event("input", {bubbles: true, composed: true}))
      control.dispatchEvent(new Event("change", {bubbles: true, composed: true}))
      return control.value
    })()`)

    const interaction_deadline = Date.now() + 5000
    while (true) {
      const after = await state()
      if (after.control == selected && after.output != before.output && after.fingerprint != before.fingerprint) {
        break
      }
      if (exceptions.length != 0) {
        throw new Error(`${kind} raised a browser exception:\n${exceptions.join("\n")}`)
      }
      if (Date.now() > interaction_deadline) {
        throw new Error(`${kind} ${name} control didn't update its output and rendered plot`)
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    assert_page_clean(exceptions, network_errors, `${kind} ${name}`)
    console.log(`passed ${kind}: ${name} at ${url}`)
  } finally {
    await client.close()
  }
}

async function test_production_apps() {
  for (const name of ["react", "vue", "svelte"]) {
    const server = await static_server(join(apps_dir, name, "dist"))
    try {
      await run_page(server.url, name)
    } finally {
      await server.close()
    }
  }

  const webpack_server = await static_server(join(apps_dir, "webpack"))
  try {
    await run_page(webpack_server.url, "web-component-webpack")
  } finally {
    await webpack_server.close()
  }
}

async function test_development_apps() {
  for (const name of ["react", "vue", "svelte"]) {
    const root = join(apps_dir, name)
    const server = await createViteServer({
      root,
      configFile: join(root, "vite.config.ts"),
      logLevel: "warn",
      server: {host: "127.0.0.1", port: 0},
    })
    await server.listen()
    try {
      const url = server.resolvedUrls?.local[0]
      if (url == null) {
        throw new Error(`Vite didn't publish a URL for ${name}`)
      }
      await run_page(url, name)
    } finally {
      await server.close()
    }
  }
}

async function test_local_development_example() {
  const name = "react-vite"
  const root = join(examples_dir, name)
  const server = await createViteServer({
    root,
    logLevel: "warn",
    optimizeDeps: {force: true},
    server: {host: "127.0.0.1", port: 0},
  })
  await server.listen()
  try {
    const url = server.resolvedUrls?.local[0]
    if (url == null) {
      throw new Error(`Vite didn't publish a URL for ${name}`)
    }
    await run_smoke_page(url, name, "local development example")
  } finally {
    await server.close()
  }
}

async function test_packaged_apps() {
  const applications = [
    ["react-next", join(workspace_dir, "react-next/out")],
    ["react-vite", join(workspace_dir, "react-vite/dist")],
    ["svelte-vite", join(workspace_dir, "svelte-vite/dist")],
    ["vanilla-rspack", join(workspace_dir, "vanilla-rspack")],
    ["vanilla-vite", join(workspace_dir, "vanilla-vite/dist")],
    ["vanilla-webpack", join(workspace_dir, "vanilla-webpack")],
    ["vue-vite", join(workspace_dir, "vue-vite/dist")],
    ["vue-minimum", join(packaged_root, "vue-minimum/dist")],
    ["web-component-webpack", join(workspace_dir, "web-component-webpack")],
  ]

  for (const [name, root] of applications) {
    const server = await static_server(root)
    try {
      await run_smoke_page(server.url, name)
    } finally {
      await server.close()
    }
  }
}

await build_fixtures()
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${devtools_port}`)
try {
  await test_production_apps()
  await test_development_apps()
  await test_local_development_example()
  await test_packaged_apps()
} finally {
  await browser.close()
}
