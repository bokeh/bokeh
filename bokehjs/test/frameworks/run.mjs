import {spawn} from "node:child_process"
import {createReadStream, existsSync, readFileSync, statSync, writeFileSync} from "node:fs"
import {createServer as createHttpServer} from "node:http"
import {extname, join, normalize, relative, resolve} from "node:path"
import {fileURLToPath} from "node:url"

import CDP from "chrome-remote-interface"
import {build as viteBuild, createServer as createViteServer} from "vite"
import webpack from "webpack"

const frameworks_dir = fileURLToPath(new URL(".", import.meta.url))
const bokehjs_dir = resolve(frameworks_dir, "../..")
const apps_dir = join(frameworks_dir, "apps")
const packaged_dir = join(bokehjs_dir, "build/test/frameworks/packaged/workspace")

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

  await import("../../frameworks/ssr.mjs")
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

async function evaluate(client, expression) {
  const result = await client.Runtime.evaluate({expression, awaitPromise: true, returnByValue: true})
  if (result.exceptionDetails != null) {
    const description = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text
    throw new Error(description)
  }
  return result.result.value
}

async function open_page(url) {
  const target = await CDP.New({port: devtools_port, url: "about:blank"})
  const client = await CDP({port: devtools_port, target})
  await Promise.all([client.Page.enable(), client.Runtime.enable(), client.Network.enable()])
  const exceptions = []
  const network_errors = []
  client.Runtime.exceptionThrown(({exceptionDetails}) => {
    const description = exceptionDetails.exception?.description ?? exceptionDetails.text
    const location = `${exceptionDetails.url}:${exceptionDetails.lineNumber + 1}:${exceptionDetails.columnNumber + 1}`
    exceptions.push(`${description} (${location})`)
  })
  const checked_resource_types = new Set(["Document", "Script", "Stylesheet", "XHR", "Fetch", "Wasm"])
  client.Network.loadingFailed(({type, errorText, canceled}) => {
    if (!canceled && checked_resource_types.has(type)) {
      network_errors.push(`${type} failed: ${errorText}`)
    }
  })
  client.Network.responseReceived(({type, response}) => {
    if (checked_resource_types.has(type) && response.status >= 400) {
      network_errors.push(`${type} returned ${response.status}: ${response.url}`)
    }
  })
  const loaded = new Promise((resolve) => client.Page.loadEventFired(resolve))
  await client.Page.navigate({url})
  await loaded
  return {client, target, exceptions, network_errors}
}

function assert_page_clean(exceptions, network_errors, context) {
  if (exceptions.length != 0) {
    throw new Error(`${context} raised a browser exception:\n${exceptions.join("\n")}`)
  }
  if (network_errors.length != 0) {
    throw new Error(`${context} had a failed application resource:\n${network_errors.join("\n")}`)
  }
}

async function run_page(url, expected_framework, hmr_source = null) {
  const {client, target, exceptions, network_errors} = await open_page(url)
  try {
    const result = await evaluate(client, `(async () => {
      const deadline = Date.now() + 30000
      while (window.__bokeh_framework_test__ == null) {
        if (Date.now() > deadline) throw new Error("framework test didn't start")
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
      return await window.__bokeh_framework_test__
    })()`)
    if (result.framework != expected_framework || result.mounts != 3 || result.streams != 3) {
      throw new Error(`unexpected framework result: ${JSON.stringify(result)}`)
    }

    if (hmr_source == null) {
      const hmr = await evaluate(client, "window.__bokeh_hmr__")
      if (hmr != "disabled") {
        throw new Error(`production application unexpectedly enabled HMR: ${hmr}`)
      }
    } else {
      const original = readFileSync(hmr_source, "utf-8")
      try {
        writeFileSync(hmr_source, `export const generation = ${Date.now()}\n`)
        const hmr = await evaluate(client, `(async () => {
          const deadline = Date.now() + 10000
          while (window.__bokeh_hmr__ != "received") {
            if (Date.now() > deadline) throw new Error("Vite didn't apply a source-module HMR update")
            await new Promise((resolve) => setTimeout(resolve, 20))
          }
          return window.__bokeh_hmr__
        })()`)
        if (hmr != "received") {
          throw new Error(`unexpected HMR state: ${hmr}`)
        }
      } finally {
        writeFileSync(hmr_source, original)
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
    assert_page_clean(exceptions, network_errors, expected_framework)
    console.log(`passed: ${expected_framework} at ${url}`)
  } finally {
    await client.close()
    await CDP.Close({port: devtools_port, id: target.id})
  }
}

async function run_smoke_page(url, name) {
  console.log(`testing packed example: ${name} at ${url}`)
  const {client, target, exceptions, network_errors} = await open_page(url)
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
        throw new Error(`packed example raised a browser exception:\n${exceptions.join("\n")}`)
      }
      if (Date.now() > deadline) {
        throw new Error("packed example didn't render a Bokeh figure")
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
    assert_page_clean(exceptions, network_errors, `packed example ${name}`)
    console.log(`passed packed example: ${name} at ${url}`)
  } finally {
    await client.close()
    await CDP.Close({port: devtools_port, id: target.id})
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
      await run_page(url, name, join(root, "src/hmr_state.ts"))
    } finally {
      await server.close()
    }
  }
}

async function test_packaged_apps() {
  const applications = [
    ["angular-ng", join(packaged_dir, "angular-ng/dist/browser")],
    ["react-vite", join(packaged_dir, "react-vite/dist")],
    ["svelte-vite", join(packaged_dir, "svelte-vite/dist")],
    ["vanilla-rspack", join(packaged_dir, "vanilla-rspack")],
    ["vanilla-vite", join(packaged_dir, "vanilla-vite/dist")],
    ["vanilla-webpack", join(packaged_dir, "vanilla-webpack")],
    ["vue-vite", join(packaged_dir, "vue-vite/dist")],
    ["web-component-webpack", join(packaged_dir, "web-component-webpack")],
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
await test_production_apps()
await test_development_apps()
await test_packaged_apps()
