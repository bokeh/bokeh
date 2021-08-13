import {basename, relative, join} from "path"
import lesscss from "less"
import chalk from "chalk"

import {scan, read, write, rename} from "./sys"

export async function compile_styles(styles_dir: string, css_dir: string): Promise<boolean> {
  let success = true

  for (const src of scan(styles_dir, [".less", ".css"])) {
    if (basename(src).startsWith("_"))
      continue

    try {
      const style = read(src)!
      const {css} = await lesscss.render(style, {filename: src})
      const dst = rename(src, {base: styles_dir, dir: css_dir, ext: ".css"})
      write(dst, css)
    } catch (error) {
      success = false
      console.log(`${chalk.red("\u2717")} failed to compile ${chalk.magenta(src)}:`)
      console.log(`${error}`)
    }
  }

  return success
}

export function wrap_css_modules(css_dir: string, js_dir: string, dts_dir: string): void {
  for (const css_path of scan(css_dir, [".css"])) {
    const js = `\
const css = \`\n${read(css_path)}\`;
export default css;
`
    const dts = `\
declare const css: string;
export default css;
`

    const sub_path = relative(css_dir, css_path)
    write(`${join(js_dir, "styles", sub_path)}.js`, js)
    write(`${join(dts_dir, "styles", sub_path)}.d.ts`, dts)
  }
}
