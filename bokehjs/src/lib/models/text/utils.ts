import {TeX} from "./math_text"
import type {BaseText} from "./base_text"
import {PlainText} from "./plain_text"

type Delimiter = {
  start: string
  end: string
  inline: boolean
}

const delimiters: Delimiter[] = [
  {start: "$$", end: "$$", inline: false},
  {start: "\\[", end: "\\]", inline: false},
  {start: "\\(", end: "\\)", inline: true},
]

export function parse_delimited_string(text: string): BaseText {
  for (const delim of delimiters) {
    const n0 = text.indexOf(delim.start)
    const m0 = n0 + delim.start.length
    if (n0 == 0) {
      const n1 = text.indexOf(delim.end, m0)
      const m1 = n1
      if (n1 == text.length - delim.end.length)
        return new TeX({text: text.slice(m0, m1), inline: delim.inline})
      else
        break
    }
  }

  return new PlainText({text})
}
