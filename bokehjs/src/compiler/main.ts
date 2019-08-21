import {argv} from "yargs"
import {resolve} from "path"

import {read} from "./sys"
import {build} from "./build"
import {compile_and_resolve_deps} from "./compile"

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
  if (argv.file != null) {
    const input = {
      code: argv.code != null ? argv.code as string : read(argv.file as string)!,
      lang: (argv.lang as string | undefined) || "coffeescript",
      file: argv.file as string,
      bokehjs_dir: (argv.bokehjsDir as string | undefined) || "./build", // this is what bokeh.settings defaults to
    }
    return await compile_and_resolve_deps(input)
  } else {
    const input = JSON.parse(await read_stdin())
    return await compile_and_resolve_deps(input)
  }
}

async function main() {
  if (argv._[0] == "build") {
    try {
      const base_dir = resolve(argv.baseDir as string)
      const bokehjs_dir = resolve(argv.bokehjsDir as string)
      const rebuild = argv.rebuild as boolean | undefined
      const bokeh_version = argv.bokehVersion as string
      const result = await build(base_dir, bokehjs_dir, {rebuild, bokeh_version})
      process.exit(result ? 0 : 1)
    } catch (error) {
      console.log(error.stack)
      process.exit(1)
    }
  } else {
    try {
      reply(await compile())
    } catch (error) {
      reply({error: error.stack})
    }
  }
}

main()
