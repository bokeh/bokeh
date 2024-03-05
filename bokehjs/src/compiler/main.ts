import yargs from "yargs"
import {resolve} from "path"

import {read} from "./sys"
import {init, build} from "./build"
import {compile_and_resolve_deps} from "./compile"

const argv = yargs(process.argv.slice(2)).options({
  code: {type: "string"},
  file: {type: "string"},
  lang: {type: "string", choices: ["typescript", "javascript"], default: "typescript"},
  "base-dir": {type: "string"},
  "bokehjs-dir": {type: "string", default: "./build"}, // this is what bokeh.settings defaults to
  "bokeh-version": {type: "string"},
  "bokehjs-version": {type: "string"},
  verbose: {type: "boolean", default: false},
  rebuild: {type: "boolean", default: false},
  interactive: {type: "boolean", default: false},
}).parseSync()

async function read_stdin() {
  const stdin = process.stdin

  stdin.setEncoding("utf-8")
  stdin.resume()

  let data = ""
  for await (const chunk of stdin) {
    data += chunk
  }

  return data
}

function reply(data: unknown): void {
  process.stdout.write(JSON.stringify(data))
  process.stdout.write("\n")
}

async function compile() {
  const input = await (async () => {
    if (argv.file != null) {
      return {
        code: argv.code != null ? argv.code : read(argv.file)!,
        lang: argv.lang,
        file: argv.file,
        bokehjs_dir: argv.bokehjsDir,
      }
    } else {
      return JSON.parse(await read_stdin())
    }
  })()
  return await compile_and_resolve_deps(input)
}

async function main() {
  const cmd = argv._[0]
  if (cmd == "build") {
    try {
      const base_dir = resolve(argv.baseDir!)
      const bokehjs_dir = resolve(argv.bokehjsDir)
      const verbose = argv.verbose
      const rebuild = argv.rebuild
      const bokeh_version = argv.bokehVersion!
      const result = await build(base_dir, bokehjs_dir, {verbose, rebuild, bokeh_version})
      process.exit(result ? 0 : 1)
    } catch (error) {
      const msg = error instanceof Error && error.stack != null ? error.stack : `${error}`
      console.log(msg)
      process.exit(1)
    }
  } else if (cmd == "init") {
    try {
      const base_dir = resolve(argv.baseDir!)
      const bokehjs_dir = resolve(argv.bokehjsDir)
      const interactive = argv.interactive
      const bokehjs_version = argv.bokehjsVersion
      const bokeh_version = argv.bokehVersion!
      const result = await init(base_dir, bokehjs_dir, {interactive, bokehjs_version, bokeh_version})
      process.exit(result ? 0 : 1)
    } catch (error) {
      const msg = error instanceof Error && error.stack != null ? error.stack : `${error}`
      console.log(msg)
      process.exit(1)
    }
  } else {
    try {
      reply(await compile())
    } catch (error) {
      const msg = error instanceof Error && error.stack != null ? error.stack : `${error}`
      reply({error: msg})
    }
  }
}

void main()
