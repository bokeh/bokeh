import {isString} from "core/util/types"
import {TeX} from "models/text/index"
import {BaseText} from "./base_text"

export function is_tex_string(text: unknown): boolean {
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
  if (text instanceof TeX)
    return text

  if (isString(text) && is_tex_string(text))
    return new TeX({text: text.slice(2, -2)})

  return null
}
