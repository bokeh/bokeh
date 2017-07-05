import * as path from "path"
import * as resolve from "resolve"
import * as through from "through2"
import * as gutil from "gulp-util"
import {argv} from "yargs"
import * as paths from "./paths"

type Bundle = {pipeline: any}
export type Labels = {[key: string]: string}

function customLabeler(bundle: Bundle, parentLabels: Labels, fn: (row: any) => string): Labels {
  const labels: Labels = {}

  const namer = through.obj(function(row, _enc, next) {
    labels[row.id] = fn(row)
    this.push(row)
    next()
  })

  const labeler = through.obj(function(row, _enc, next) {
    row.id = labels[row.id]

    const opts = {
      basedir: path.dirname(row.file),
      extensions: ['.js'],
      paths: [paths.build_dir.tree_js, './node_modules'],
    }

    for (const name in row.deps) {
      const dep = row.deps[name] || resolve.sync(name, opts)
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
    const mod_path = row.id
    const mod_name = path
        .relative(paths.base_dir, mod_path)
        .replace(/\.js$/, "")
        .split(path.sep)
        .join("/")
        .replace(/^(node_modules|build\/js\/tree)\//, "")

    if (argv.verbose)
      gutil.log(`Processing ${mod_name}`)

    return mod_name
  })
}
