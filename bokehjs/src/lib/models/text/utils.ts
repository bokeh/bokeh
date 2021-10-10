import {TeXAndText} from "./math_and_text"
import {BaseText} from "./base_text"
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

    if (n0 > -1)
      if (text.indexOf(delim.end, m0) > -1)
        return new TeXAndText({text})
  }

  return new PlainText({text})
}
