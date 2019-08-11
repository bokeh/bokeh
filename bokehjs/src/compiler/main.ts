import * as ts from "typescript"
import {argv} from "yargs"

import {join, basename} from "path"

import {read, rename, file_exists, glob} from "./sys"
import {compile_files, read_tsconfig, parse_tsconfig, is_failed, default_transformers, compiler_host, report_diagnostics} from "./compiler"
import {compile_and_resolve_deps} from "./compile"
import {Linker} from "./linker"

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

import * as tsconfig_json from "./tsconfig.ext.json"

async function build() {
  const base_dir =  argv.baseDir as string
  const bokehjs_dir = argv.bokehjsDir as string

  const tsconfig = (() => {
    const tsconfig_path = join(base_dir, "tsconfig.json")

    const preconfigure: ts.CompilerOptions = {
      paths: {
        "*": [
          join(bokehjs_dir, "js/lib/*"),
          join(bokehjs_dir, "js/types/*"),
        ],
      },
    }

    if (file_exists(tsconfig_path))
      return read_tsconfig(tsconfig_path, preconfigure)
    else
      return parse_tsconfig(tsconfig_json, base_dir, preconfigure)
  })()

  if (is_failed(tsconfig)) {
    return {failure: report_diagnostics(tsconfig.diagnostics)}
  }

  const {files, options} = tsconfig

  const transformers = default_transformers(options)
  const host = compiler_host(new Map(), options, bokehjs_dir)

  const tsoutput = compile_files(files, options, transformers, host)

  if (is_failed(tsoutput) && options.noEmitOnError)
    return {failure: report_diagnostics(tsoutput.diagnostics)}

  const dist_dir = options.outDir || join(base_dir, "dist")

  const linker = new Linker({
    entries: glob(join(dist_dir, "**", "*.js")),
    bases: [dist_dir, join(base_dir, "node_modules")],
    cache: join(dist_dir, "cache.json"),
  })

  const bundles = linker.link()
  linker.store_cache()
  const outputs = [join(dist_dir, `${basename(base_dir)}.js`)]

  const min_js = (js: string) => rename(js, {ext: '.min.js'})

  function bundle(minified: boolean, outputs: string[]) {
    bundles.map((bundle) => bundle.assemble(minified))
           .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle(false, outputs)
  bundle(true, outputs.map(min_js))

  if (is_failed(tsoutput)) {
    const failure = report_diagnostics(tsoutput.diagnostics)
    return {outputs, failure}
  } else
    return {outputs}
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
  try {
    if (argv._[0] == "build") {
      reply(await build())
    } else {
      reply(await compile())
    }
  } catch (error) {
    reply({error: error.stack})
  }
}

main()
