import fs from "fs"
import {join} from "path"

import {argv} from "yargs"
import express from "express"
import nunjucks from "nunjucks"

import * as sys from "./sys"

const app = express()

nunjucks.configure(".", {
  autoescape: true,
  express: app,
  noCache: true,
})

app.use("/static", express.static("build/"))
app.use("/fonts", express.static("test/fonts/"))

const js_path = (name: string): string => {
  return `/static/js/${name}.js`
}

const test = (main: string, title: string) => {
  return (run: boolean = false) => {
    return (req: express.Request, res: express.Response) => {
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

app.get("/integration/report", using_report(({results}, _, res) => {
  res.render("test/devtools/report.html", {title: "Integration Tests Report", results})
}))

app.get("/integration/metrics", using_report(({metrics}, _, res) => {
  res.render("test/devtools/metrics.html", {title: "Integration Tests Metrics", metrics, js: js_path})
}))

app.get("/examples", async (_req, res) => {
  const dir = await fs.promises.opendir("examples")
  const entries = []
  for await (const dirent of dir) {
    if (!dirent.isDirectory())
      continue
    const {name} = dirent
    if (name.startsWith(".") || name.startsWith("_"))
      continue
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

process.once("SIGTERM", () => {
  process.exit(0)
})

const host = argv.host as string | undefined ?? "127.0.0.1"
const port = parseInt(argv.port as string | undefined ?? "5777")

const server = app.listen(port, host)

server.on("listening", () => {
  console.log(`listening on ${host}:${port}`)
  process.send?.("ready")
})
server.on("error", (error) => {
  console.log(`unable to listen on ${host}:${port}\n  ${error}`)
  process.exit(1)
})
