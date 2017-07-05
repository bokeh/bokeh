import * as path from "path"
import * as resolve from "resolve"
import * as through from "through2"
import * as gutil from "gulp-util"
import {argv} from "yargs"
import * as paths from "./paths"

export function canonical(mod_path: string): string {
  return path
    .relative(paths.base_dir, mod_path)
    .replace(/\.js$/, "")
    .split(path.sep)
    .join("/")
    .replace(/^(node_modules|build\/js\/tree)\//, "")
}

type Bundle = {pipeline: any}
export type Labels = {[key: string]: string}

function custom_labeler(bundle: Bundle, fn: (mod_path: string) => string): Labels {
  const labels: Labels = {}

  const namer = through.obj(function(row, _enc, next) {
    labels[row.id] = fn(row.id)
    if (argv.verbose) gutil.log(`Processing ${labels[row.id]}`)
    this.push(row)
    next()
  })

  const labeler = through.obj(function(row, _enc, next) {
    row.id = fn(row.id)

    const opts = {
      basedir: path.dirname(row.file),
      paths: [paths.build_dir.tree_js, './node_modules'],
    }

    for (const dep_name in row.deps) {
      const dep_path = row.deps[dep_name] || resolve.sync(dep_name, opts)
      row.deps[dep_name] = fn(dep_path)
    }

    this.push(row)
    next()
  })

  bundle.pipeline.get('deps').push(namer)
  bundle.pipeline.get('label').splice(0, 1, labeler)

  return labels
}

export function named_labeler(bundle: Bundle) {
  return custom_labeler(bundle, canonical)
}
