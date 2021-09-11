import {PlainText} from "./plain_text"
import {TeX} from "./math_text"
import {isString} from "core/util/types"
import {BaseText} from "./base_text"

type Delimiter = {
  start: string
  end: string
  inline: boolean
  nextIndex?: number
}

export function find_math_parts(mathstring: string): (PlainText | TeX)[] {
  const delimiters: Delimiter[] = [
    {start: "$$", end: "$$", inline: false},
    {start: "\\[", end: "\\]", inline: false},
    {start: "\\(", end: "\\)", inline: true},
  ]

  const result: (PlainText | TeX)[] = []

  // for each delimiter
  const find_next_delimiter = (text: string) =>
    delimiters
      // get their position on text
      .map((delimiter) => ({
        ...delimiter,
        nextIndex: text.indexOf(delimiter.start),
      }))
      // remove delimiters not found
      .filter((delimiter) => delimiter.nextIndex >= 0)
      // return the delimiter closer to start of text
      .sort((a, b) => a.nextIndex - b.nextIndex)[0]

  const find_end = (text: string, delimiter?: Delimiter): string => {
    // if there is no delimiter then the whole text is a plain string
    if (!delimiter) {
      result.push(new PlainText({text}))

      return ""
    }

    const index = text.indexOf(delimiter.start)

    // first delimiter is the end of the string
    if (index === text.length - 2) {
      result.push(new PlainText({text}))
      return ""
    }

    // end delimiter found
    if (text.slice(index + 2).includes(delimiter.end)) {
      // string before open delimiter is plain text
      result.push(new PlainText({text: text.slice(0, index)}))

      const text_after_delimiter = text.slice(index + 2)
      const closing_index = text_after_delimiter.indexOf(delimiter.end)

      // from open delimiter to end delimiter is input
      result.push(
        new TeX({
          text: text_after_delimiter.slice(0, closing_index),
          inline: delimiter.inline,
        })
      )

      // remove end delimiter from return
      return text_after_delimiter.slice(closing_index + 2)
    }

    // if there is not a closing delimiter
    // check if there are other open delimiters
    if (find_next_delimiter(text.slice(index + 2))) {
      while (text) {
        text = find_end(text, find_next_delimiter(text.slice(index + 2)))
      }

      return text
    }

    // no ending delimiter was found then its a plain text
    result.push(new PlainText({text}))
    return ""
  }

  let remaining_text = mathstring

  while (remaining_text) {
    remaining_text = find_end(
      remaining_text,
      find_next_delimiter(remaining_text)
    )
  }

  return result.filter((el) => el.text)
}

export function contains_tex_string(text: unknown): boolean {
  if (!isString(text)) return false

  if (text.includes("$$"))
    if (text.slice(text.indexOf("$$")+2).includes("$$"))
      return true

  if (text.includes("\\["))
    if (text.slice(text.indexOf("\\[")+2).includes("\\]"))
      return true

  if (text.includes("\\("))
    if (text.slice(text.indexOf("\\(")+2).includes("\\)"))
      return true

  return false
};

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
