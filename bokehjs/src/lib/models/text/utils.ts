import {TeX} from "./math_text"
import {isString} from "core/util/types"
import {BaseText} from "./base_text"
import {find_math, tex2svg} from "./mathjax"

export function process_tex_parts(text: string, math_parts: MathJax.ProtoItem[]): string {
  const parts: string[] = []

  math_parts.reduce((last_index = 0, math_part) => {
    parts.push(text.slice(last_index, math_part.start.n))
    parts.push(tex2svg(math_part.math, {display: math_part.display}).outerHTML)

    return math_part.end.n
  }, 0)

  return parts.join("")
}

export function contains_tex_string(text: unknown): boolean {
  if (!isString(text)) return false

  return Boolean(find_math(text))
};

export function is_tex_string(text: unknown): boolean {
  if (!isString(text)) return false

  const dollars = "^\\$\\$.*?\\$\\$$"
  const braces  = "^\\\[.*?\\\]$"
  const parens  = "^\\\(.*?\\\)$"

  const pat = new RegExp(`${dollars}|${braces}|${parens}`, "i")

  return pat.test(text)
};

export function tex_from_text_like(text: string | BaseText): TeX | null {
  if (text instanceof TeX)
    return text

  if (isString(text) && is_tex_string(text))
    return new TeX({text: text.slice(2, -2)})

  return null
}
