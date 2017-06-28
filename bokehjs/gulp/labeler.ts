import * as fs from "fs"
import * as path from "path"
import * as resolve from "resolve"
import * as through from "through2"
import * as gutil from "gulp-util"
import {argv} from "yargs"
import * as paths from "./paths"

const pkg = require("../package.json")

type Bundle = {pipeline: any}
export type Labels = {[key: string]: string}

function customLabeler(bundle: Bundle, parentLabels: Labels, fn: (row: any) => string): Labels {
  const labels: Labels = {}

  const namer = through.obj(function(this: any, row, _enc, next) {
    labels[row.id] = fn(row)
    this.push(row)
    next()
  })

  const labeler = through.obj(function(this: any, row, _enc, next) {
    row.id = labels[row.id]

    const opts = {
      basedir: path.dirname(row.file),
      extensions: ['.js', '.coffee'],
      paths: ['./node_modules', paths.buildDir.jsTree],
    }

    for (const name in row.deps) {
      let dep = row.deps[name]

      if (dep == null) {
        dep = resolve.sync(name, opts)
      }

      row.deps[name] = labels[dep] || parentLabels[dep]
    }

    this.push(row)
    next()
  })

  bundle.pipeline.get('deps').push(namer)
  bundle.pipeline.get('label').splice(0, 1, labeler)

  return labels
}

export function namedLabeler(bundle: Bundle, parentLabels: Labels) {
  return customLabeler(bundle, parentLabels, (row) => {
    const cwd = process.cwd()
    const depModMap: {[key: string]: string} = {}

    for (const dep in pkg.dependencies) {
      const depPkg = require(path.resolve(path.join("node_modules", dep, "package.json")))
      if (depPkg.main != null) {
        let depPath = path.resolve(path.join("node_modules", dep, depPkg.main))
        if (!fs.existsSync(depPath)) {
          depPath = `${depPath}.js`
        }
        depModMap[depPath] = dep
      }
    }

    const modPath = row.id
    let modName  = depModMap[modPath]

    if (modName == null)
      modName = path
        .relative(cwd, modPath)
        .replace(/\.(coffee|js)$/, "")
        .split(path.sep).join("/")
        .replace(/^(src\/coffee|node_modules|build\/js\/tree)\//, "")

    if (modName.indexOf("process/browser") != -1)
      modName = "_process"

    if (argv.verbose)
      gutil.log(`Processing ${modName}`)

    return modName
  })
}
