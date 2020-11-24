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

app.get("/unit", (_req, res) => {
  res.render("test/devtools/test.html", {title: "Unit Tests", main: "unit.js"})
})
app.get("/defaults", (_req, res) => {
  res.render("test/devtools/test.html", {title: "Defaults Tests", main: "defaults.js"})
})
app.get("/integration", (_req, res) => {
  res.render("test/devtools/test.html", {title: "Integration Tests", main: "integration.js"})
})

app.get("/unit/run", (_req, res) => {
  res.render("test/devtools/test.html", {title: "Unit Tests", main: "unit.js", run: true})
})
app.get("/defaults/run", (_req, res) => {
  res.render("test/devtools/test.html", {title: "Defaults Tests", main: "defaults.js", run: true})
})
app.get("/integration/run", (_req, res) => {
  res.render("test/devtools/test.html", {title: "Integration Tests", main: "integration.js", run: true})
})

app.get("/integration/report", async (req, res) => {
  const platform = typeof req.query.platform == "string" ? req.query.platform : sys.platform
  switch (platform) {
    case "linux":
    case "macos":
    case "windows": {
      const report_path = join("test", "baselines", platform, "report.json")
      const json = await fs.promises.readFile(report_path, {encoding: "utf-8"})
      res.render("test/devtools/report.html", {title: "Integration Tests Report", tests: JSON.parse(json)})
      break
    }
    default:
      res.status(404).send("Invalid platform specifier")
  }
})

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
