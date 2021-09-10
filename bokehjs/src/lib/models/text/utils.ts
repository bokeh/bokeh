import {PlainText, TeX} from "../index"

export function find_math_parts(text: string): (PlainText | TeX)[] {
  type Delimiter = {
    start: string
    end: string
    inline: boolean
    nextIndex?: number
  }

  const delimiters: Delimiter[] = [
    {start: "$$", end: "$$", inline: false},
    {start: "\\[", end: "\\]", inline: false},
    {start: "\\(", end: "\\)", inline: true},
  ]

  const result: (PlainText | TeX)[] = []
  let remaining_text = text

  const find_end = (delimiter?: Delimiter) => {
    if (!delimiter) {
      result.push(new PlainText({text: remaining_text}))
      remaining_text = ""
      return
    }

    if (remaining_text.includes(delimiter.start)) {
      const index = remaining_text.indexOf(delimiter.start)

      if (remaining_text.slice(index + 2).includes(delimiter.end)) {
        result.push(new PlainText({text: remaining_text.slice(0, index)}))
        remaining_text = remaining_text.slice(index + 2)

        const closing_index = remaining_text.indexOf(delimiter.end)
        result.push(
          new TeX({
            text: remaining_text.slice(0, closing_index),
            inline: delimiter.inline,
          })
        )
        remaining_text = remaining_text.slice(closing_index + 2)
      }
    }
  }

  const find_next_delimiter = () =>
    delimiters
      .map((delimiter) => ({
        ...delimiter,
        nextIndex: remaining_text.indexOf(delimiter.start),
      }))
      .sort((a, b) => a.nextIndex - b.nextIndex)
      .filter((delimiter) => delimiter.nextIndex >= 0)[0]

  while (remaining_text) {
    console.log(find_next_delimiter())
    find_end(find_next_delimiter())
  }

  return result.filter(Boolean).filter(el => el.text)
}
