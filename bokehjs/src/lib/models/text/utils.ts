import {isString} from "core/util/types"
import {TeX} from "models/text/index"
import {BaseText} from "./base_text"

export function is_tex_string(text: unknown): text is string {
  if (!isString(text)) return false

  if (text.startsWith("$$") && text.endsWith("$$"))
    return true

  else if (text.startsWith("\\[") && text.endsWith("\\]"))
    return true

  else if (text.startsWith("\\(") && text.endsWith("\\)"))
    return true

  return false
};

export function tex_from_text_like(text: string | BaseText): TeX | null {
  let math_text: TeX = new TeX()

  if (text instanceof TeX)
    math_text = text
  else if (is_tex_string(text))
    math_text.text = text.slice(2, -2)
  else
    return null

  return math_text
}
