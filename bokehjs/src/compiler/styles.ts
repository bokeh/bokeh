import {basename, relative, join} from "path"
import lesscss from "less"
import chalk from "chalk"
import CSS from "css"

import {scan, read, write, rename} from "./sys"

export function collect_styles(styles_dir: string): string[] {
  const paths = []
  for (const path of scan(styles_dir, [".less", ".css"])) {
    if (basename(path).startsWith("_")) {
      continue
    }
    paths.push(path)
  }
  return paths
}

export async function compile_styles(paths: string[], styles_dir: string, css_dir: string): Promise<boolean> {
  let success = true

  for (const path of paths) {
    try {
      const style = read(path)!
      const {css} = await lesscss.render(style, {filename: path})
      const dst = rename(path, {base: styles_dir, dir: css_dir, ext: ".css"})
      write(dst, css)
    } catch (error) {
      success = false
      console.log(`${chalk.red("\u2717")} failed to compile ${chalk.magenta(path)}:`)
      console.log(`${error}`)
    }
  }

  return success
}

export function wrap_css_modules(css_dir: string, js_dir: string, dts_dir: string, dts_internal_dir: string): void {

  function* collect_classes(ast: CSS.Stylesheet) {
    const {stylesheet} = ast
    if (stylesheet == null) {
      return
    }

    for (const rule of stylesheet.rules) {
      if (rule.type == "rule") {
        const {selectors} = rule as CSS.Rule

        for (const selector of selectors ?? []) {
          const classes = selector.match(/\.[A-Za-z0-9_-]+/g)
          if (classes != null) {
            for (const cls of classes) {
              yield cls.substring(1)
            }
          }
        }
      }
    }
  }

  for (const css_path of scan(css_dir, [".css"])) {
    const sub_path = relative(css_dir, css_path)

    const css_in = read(css_path)!
    const ast = CSS.parse(css_in)

    const js: string[] = []
    const dts: string[] = []
    const dts_internal: string[] = []

    dts_internal.push(`declare module "styles/${sub_path.replace(/\\/g, "/")}" {`)

    const classes = new Set(collect_classes(ast))
    for (const cls of classes) {
      if (!cls.startsWith("bk-")) {
        continue
      }
      const ident = cls.replace(/^bk-/, "").replace(/-/g, "_")
      js.push(`export const ${ident} = "${cls}"`)
      dts.push(`export const ${ident}: string`)
      dts_internal.push(`  export const ${ident}: string`)
    }

    const css_out = CSS.stringify(ast, {compress: true})
    js.push(`export default \`${css_out}\``)
    dts.push("export default \"\"")
    dts_internal.push("  export default \"\"")
    dts_internal.push("}")

    const js_file = `${join(js_dir, "styles", sub_path)}.js`
    const dts_file = `${join(dts_dir, "styles", sub_path)}.d.ts`
    const dts_internal_file = `${join(dts_internal_dir, "styles", sub_path)}.d.ts`

    write(js_file, `${js.join("\n")}\n`)
    write(dts_file, `${dts.join("\n")}\n`)
    write(dts_internal_file, `${dts_internal.join("\n")}\n`)
  }
}
