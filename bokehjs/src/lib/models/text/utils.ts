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
  {start: "\\\[", end: "\\\]", inline: false},
  {start: "\\\(", end: "\\\)", inline: true},
]

function add_backslash(m: string): string {
  return m.split("").map(s => `\\${s}`).join("");
}

export function parse_delimited_string(text: string): BaseText {
  let matches = Array<RegExpMatchArray>()
  for (const delim of delimiters) {
    const r = RegExp(`${add_backslash(delim.start)}(.*?)${add_backslash(delim.end)}`, "g")
    matches = matches.concat([...text.matchAll(r)]);
  }
  if (0 < matches.length) {
    let tex_string = ""
    let _end = 0
    for (const m of matches.sort((a, b) => a.index!- b.index!)) {
      const start = m.index!
      if (_end <= start) {
        tex_string += start != 0 ? `\\text{${text.slice(_end, start)}}${m[1]}` : `${m[1]}`
        _end = start + m[0].length
      }
    }
    tex_string +=  _end < text.length ? `\\text{${text.slice(_end)}}` : ""
    return new TeX({text: tex_string, inline: false})
  }
  else
    return new PlainText({text})
}
