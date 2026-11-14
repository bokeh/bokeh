import lesscss from "less"

import {rename} from "./sys.js"
import {strip_types} from "./strip.js"
import {to_cjs} from "./esm_to_cjs.js"
import * as transforms from "./transforms.js"

/** Converts ES modules to CommonJS (like the linker does) and leaves other code as is. */
function compile_javascript(file: string, code: string): {code: string, deps: string[]} | {error: string} {
  const {program, module, errors} = transforms.parse(file, code, {sourceType: "unambiguous"})
  if (errors.length != 0) {
    return {error: errors.map((error) => error.codeframe ?? `${file}: ${error.message}`).join("\n")}
  }
  if (module.hasModuleSyntax) {
    try {
      const {code: output, deps} = to_cjs(file, code)
      // include existing `require()` calls, like the linker does for extensions' own modules
      const requires = transforms.collect_deps(transforms.parse_script(file, output))
      return {code: output, deps: [...new Set([...deps, ...requires])]}
    } catch (error) {
      return {error: error instanceof Error ? error.message : `${error}`}
    }
  } else {
    return {code, deps: transforms.collect_deps(program)}
  }
}

function normalize(path: string): string {
  return path.replace(/\\/g, "/")
}

export async function compile_and_resolve_deps(input: {code: string, lang: string, file: string, bokehjs_dir: string}) {
  const {code, file, lang} = input

  switch (lang) {
    case "typescript": {
      // inline models aren't type-checked, so only strip types
      const result = strip_types(file, code)
      if ("errors" in result) {
        return {error: result.errors.join("\n")}
      }
      return compile_javascript(normalize(rename(file, {ext: ".js"})), result.code)
    }
    case "javascript":
      return compile_javascript(file, code)
    case "less":
      try {
        const {css} = await lesscss.render(code, {filename: file, compress: true})
        return {code: css}
      } catch (error) {
        return {error: `${error}`}
      }
    default:
      throw new Error(`unsupported input type: ${lang}`)
  }
}
