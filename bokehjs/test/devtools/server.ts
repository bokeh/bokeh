import fs from "fs"
import {spawn} from "child_process"
import {join, resolve, dirname} from "path"

import yargs from "yargs"
import express from "express"
import cors from "cors"
import nunjucks from "nunjucks"

import * as sys from "./sys"

const app = express()

nunjucks.configure(".", {
  autoescape: true,
  express: app,
  noCache: true,
})

app.use(cors())
app.use("/static", express.static("build/"))
app.use("/assets", express.static("test/assets/"))
app.use("/cases", express.static("../tests/baselines/cross/"))

const js_path = (name: string): string => {
  return `/static/js/${name}.js`
}

const test = (main: string, title: string) => {
  return (run: boolean = false) => {
    return (_req: express.Request, res: express.Response) => {
      const js = (name: string) => js_path(name)
      res.render("test/devtools/test.html", {main, title, run, js})
    }
  }
}

type Base64 = string
type Report = {
  results: [string[], {failure: boolean, image?: Base64, image_diff?: Base64, reference?: Base64}][]
  metrics: {[key: string]: number[]}
}

function using_report(fn: (report: Report, req: express.Request, res: express.Response) => void) {
  return async (req: express.Request, res: express.Response) => {
    const platform = typeof req.query.platform == "string" ? req.query.platform : sys.platform
    switch (platform) {
      case "linux":
      case "macos":
      case "windows": {
        const report_path = join("test", "baselines", platform, "report.json")
        try {
          const json = await fs.promises.readFile(report_path, {encoding: "utf-8"})
          fn(JSON.parse(json), req, res)
        } catch {
          res.status(404).send("Report unavailable")
        }
        break
      }
      default:
        res.status(404).send("Invalid platform specifier")
    }
  }
}

const unit = test("unit.js", "Unit Tests")
const defaults = test("defaults.js", "Defaults Tests")
const integration = test("integration.js", "Integration Tests")

app.get("/unit", unit())
app.get("/defaults", defaults())
app.get("/integration", integration())

app.get("/unit/run", unit(true))
app.get("/defaults/run", defaults(true))
app.get("/integration/run", integration(true))

app.get("/integration/report", using_report(({results}, req, res) => {
  const full = req.query.full == ""
  res.render("test/devtools/report.html", {title: "Integration Tests Report", results, full})
}))

app.get("/integration/metrics", using_report(({metrics}, _, res) => {
  res.render("test/devtools/metrics.html", {title: "Integration Tests Metrics", metrics, js: js_path})
}))

app.post("/ajax/dummy_data", async (_req, res) => {
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify({x: [0, 1, 2], y: [1, 2, 3], radius: [0.5, 0.7, 1.1], color: ["red", "green", "blue"]}))
})

app.get("/examples", async (_req, res) => {
  const dir = await fs.promises.opendir("examples")
  const entries = []
  for await (const dirent of dir) {
    if (!dirent.isDirectory()) {
      continue
    }
    const {name} = dirent
    if (name.startsWith(".") || name.startsWith("_")) {
      continue
    }
    entries.push(name)
  }
  entries.sort()
  res.render("test/devtools/examples.html", {entries})
})

app.get("/examples/:name", async (req, res) => {
  const {name} = req.params
  const template = join("examples", name, `${name}.html`)
  try {
    const stat = await fs.promises.stat(template)
    if (stat.isFile()) {
      res.render(template)
      return
    }
  } catch {}
  res.status(404).send("No such example")
})

type Resources = "server" | "cdn"
type BuildOptions = {dev?: boolean, resources?: Resources}

async function build_example(path: string, options: BuildOptions = {}): Promise<string | null> {
  const code = `\
__file__ = "${path}"

import random
random.seed(1)

import numpy as np
np.random.seed(1)

import warnings
warnings.filterwarnings("ignore", ".*", UserWarning, "matplotlib.font_manager")

with open(__file__, "rb") as example:
    exec(compile(example.read(), __file__, "exec"))
`

  const env = {
    ...process.env,
    BOKEH_DEV: (options.dev ?? true) ? "true" : "false",
    BOKEH_RESOURCES: options.resources ?? "server",
    BOKEH_DEFAULT_SERVER_HOST: host,
    BOKEH_DEFAULT_SERVER_PORT: `${port}`,
  }

  const cwd = dirname(path)

  console.log(`Building ${path}`)
  const proc = spawn("python", ["-c", code], {stdio: "pipe", env, cwd, timeout: 10000})

  let output = ""
  proc.stdout.on("data", (data) => {
    output += `${data}`
  })
  proc.stderr.on("data", (data) => {
    output += `${data}`
  })

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code, signal) => {
      if (code === 0 && signal == null) {
        if (output.trim().length != 0) {
          console.log(output)
        }
        resolve(null)
      } else {
        let text = `Process exited with code ${code ?? 0}`
        if (signal != null) {
          text += ` and signal ${signal}`
        }
        if (output.trim().length != 0) {
          text += `:\n\n${output}`
        }
        resolve(text)
      }
    })
  })
}

app.get("/bokeh/examples/:path(*)", async (req, res) => {
  const {path} = req.params

  function not_found(): void {
    res.status(404).send("No such example")
  }

  if (path.includes(".")) {
    not_found()
    return
  }

  const examples_dir = resolve("../examples")

  const dir_path = join(examples_dir, path)
  if (fs.existsSync(dir_path) && fs.statSync(dir_path).isDirectory()) {
    if (!path.endsWith("/") && path.length != 0) {
      res.redirect(`/bokeh/examples/${path}/`)
      return
    }

    console.log(`Listing ${dir_path}`)
    const entries = fs.readdirSync(dir_path, {encoding: "utf-8"})

    const dirs = []
    const files = []
    for (const entry of entries) {
      const entry_path = join(dir_path, entry)
      const stat = fs.statSync(entry_path)
      if (stat.isDirectory()) {
        dirs.push(entry)
      } else if (stat.isFile() && entry.endsWith(".py")) {
        files.push(entry.replace(/\.py$/, ""))
      }
    }

    res.status(200).render("test/devtools/bokeh_examples.html", {directory: dir_path, dirs, files})
    return
  }

  const py_path = join(examples_dir, `${path}.py`)
  if (!(fs.existsSync(py_path) && fs.statSync(py_path).isFile())) {
    not_found()
    return
  }

  const error = await build_example(py_path, {dev: argv.dev, resources: argv.resources as Resources})
  if (error != null) {
    res.status(200).render("test/devtools/bokeh_example.html", {title: py_path, contents: error})
    return
  }

  const html_path = join(examples_dir, `${path}.html`)
  if (!(fs.existsSync(html_path) && fs.statSync(html_path).isFile())) {
    not_found()
    return
  }

  const html = await fs.promises.readFile(html_path, {encoding: "utf-8"})
  res.status(200).send(html)
})

process.once("SIGTERM", () => {
  process.exit(0)
})

const argv = yargs(process.argv.slice(2)).options({
  host: {type: "string", default: "127.0.0.1"},
  port: {type: "number", default: 5777},
  dev: {type: "boolean", default: true},
  resources: {type: "string", choices: ["server", "cdn"] as const, default: "server"},
}).parseSync()

const {host, port} = argv
const server = app.listen(port, host)

server.on("listening", () => {
  console.log(`listening on http://${host}:${port}`)
  process.send?.("ready")
})
server.on("error", (error) => {
  console.log(`unable to listen on ${host}:${port}\n  ${error}`)
  process.exit(1)
})
