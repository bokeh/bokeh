import {DataRenderer} from "./renderers/data_renderer"
import {includes} from "core/util/array"
import {PlainText} from "models/plain_text"
import {MathText} from "models/math_text"
import {TextLike} from "core/types"
import {isString} from "core/util/types"
import {last} from "core/util/array"

export type RendererSpec = DataRenderer[] | "auto" | null

export function compute_renderers(renderers: RendererSpec, all_renderers: DataRenderer[], names: string[]): DataRenderer[] {
  if (renderers == null)
    return []

  let result: DataRenderer[] = renderers == "auto" ? all_renderers : renderers

  if (names.length > 0)
    result = result.filter((r) => includes(names, r.name))

  return result
}

export function convert_text_like(text_like: TextLike): MathText | PlainText {
  if (isString(text_like)) {
    if (text_like[0] == `$` && last(text_like) == `$`)
      return new MathText({text: text_like})

    return new PlainText({text: text_like})
  }

  return text_like
}
