import fs from "fs"

import express from "express"
import {argv} from "yargs"

const app = express()
app.engine("html", (path, options, callback) => {
  fs.readFile(path, (err, content) => {
    if (err)
      return callback(err, "")

    const rendered = content
      .toString()
      .replace(/{{ (\w+) }}/g, (_, key) => (options as any)[key])

    return callback(null, rendered)
  })
})
app.set("views", __dirname)
app.set("view engine", "html")

app.use("/static", express.static("build/"))

app.get("/unit", (_req, res) => {
  res.render("template", {title: "Unit Tests", main: "unit.js"})
})
app.get("/integration", (_req, res) => {
  res.render("template", {title: "Integration Tests", main: "integration.js"})
})

process.once("SIGTERM", () => {
  process.exit(0)
})

const host = argv.host as string | undefined ?? "127.0.0.1"
const port = 5777

const server = app.listen(port, host)

server.on("listening", () => {
  console.log(`listening on ${host}:${port}`)
  process.send?.("ready")
})
server.on("error", (error) => {
  console.log(`unable to listen on ${host}:${port}\n  ${error}`)
  process.exit(1)
})
