import {argv} from "yargs"
import express from "express"
import nunjucks from "nunjucks"

const app = express()

nunjucks.configure(__dirname, {
  autoescape: true,
  express: app,
})

app.use("/static", express.static("build/"))

app.get("/unit", (_req, res) => {
  res.render("template.html", {title: "Unit Tests", main: "unit.js"})
})
app.get("/integration", (_req, res) => {
  res.render("template.html", {title: "Integration Tests", main: "integration.js"})
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
