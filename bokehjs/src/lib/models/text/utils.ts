import {TeX} from "./math_text"
import type {BaseText} from "./base_text"
import {PlainText} from "./plain_text"
import {sort_by} from "core/util/array"

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
  return m.split("").map(s => `\\${s}`).join("")
}

export function parse_delimited_string(text: string): BaseText {
  type Match = {index: number, outer: string, inner: string, delim: Delimiter}
  const matches: Match[] = []
  for (const delim of delimiters) {
    const start = add_backslash(delim.start)
    const end = add_backslash(delim.end)

    const re = new RegExp(`${start}([^]*?)${end}`, "gm")
    for (const match of text.matchAll(re)) {
      const {index} = match
      const [outer, inner] = match
      matches.push({index, outer, inner, delim})
    }
  }
  if (matches.length > 0) {
    if (matches.length == 1) {
      const [match] = matches
      const start = match.index
      const end = match.outer.length
      if (start == 0 && end == text.length) {
        const tex_string = match.inner
        return new TeX({text: tex_string, inline: match.delim.inline})
      }
    }

    let tex_string = ""
    let end = 0
    for (const match of sort_by(matches, (match) => match.index)) {
      const start = match.index
      if (end <= start) {
        tex_string += start != 0 ? `\\text{${text.slice(end, start)}}${match.inner}` : `${match.inner}`
        end = start + match.outer.length
      }
    }
    tex_string += end < text.length ? `\\text{${text.slice(end)}}` : ""
    return new TeX({text: tex_string, inline: false})
  } else {
    return new PlainText({text})
  }
}
