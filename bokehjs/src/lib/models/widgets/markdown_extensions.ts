import {Lexer, type MarkedExtension, type Token} from "marked"

type DefinitionItem = {term: Token[], definitions: Token[][]}
type DefinitionList = {type: "definition_list", raw: string, items: DefinitionItem[], tokens: Token[]}

const heading_id = /\s+\{#([A-Za-z][\w-]*)\}\s*$/
const definition = /^ {0,3}:[ \t]+(.*)$/
const block_start = /^(?: {4}|\t)|^ {0,3}(?:#{1,6}\s|>|[-+*]\s|\d+[.)]\s|`{3}|~{3})/

export function dedent(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  let prefix: string | null = null
  for (const line of lines) {
    if (/^[ \t]*$/.test(line)) {
      continue
    }
    const indent = /^[ \t]*/.exec(line)![0]
    if (prefix == null) {
      prefix = indent
    } else {
      let length = 0
      while (length < prefix.length && length < indent.length && prefix[length] == indent[length]) {
        length++
      }
      prefix = prefix.slice(0, length)
    }
  }
  const length = prefix?.length ?? 0
  return lines.map((line) => /^[ \t]*$/.test(line) ? "" : line.slice(length)).join("\n")
}

// Use marked's paragraph boundaries, including headings and fences without blank lines.
// Keep blank-line lookahead for a definition separated from its term.
function first_paragraph(src: string): string {
  const paragraph = Lexer.rules.block.gfm.paragraph.exec(src)?.[0] ?? ""
  const lookahead = /^(?:[ \t]*\n)*[^\n]*(?:\n|$)/.exec(src.slice(paragraph.length))?.[0] ?? ""
  return src.slice(0, paragraph.length + lookahead.length)
}

export function markdown_extensions(marker_prefix = "data"): MarkedExtension {
  return {
    renderer: {
      heading(token) {
        const match = heading_id.exec(token.text)
        if (match == null) {
          return false
        }
        const text = this.parser.parseInline(token.tokens).replace(heading_id, "")
        // Preserve explicit IDs through sanitization without weakening its ID checks.
        return `<h${token.depth} ${marker_prefix}-heading-id="${match[1]}">${text}</h${token.depth}>\n`
      },
    },
    extensions: [{
      name: "bokeh_embed",
      level: "block",
      start(src) {
        return /^ {0,3}::bokeh\[[A-Za-z0-9_.-]+\][ \t]*(?:\n|$)/m.exec(first_paragraph(src))?.index
      },
      tokenizer(src) {
        const match = /^ {0,3}::bokeh\[([A-Za-z0-9_.-]+)\][ \t]*(?:\n|$)/.exec(src)
        return match == null ? undefined : {type: "bokeh_embed", raw: match[0], name: match[1]}
      },
      renderer(token) {
        const name = token.name as string
        return `<div class="bokeh-embed" ${marker_prefix}-bokeh-embed="${name}"></div>\n`
      },
    }, {
      name: "definition_list",
      level: "block",
      start(src) {
        const match = /(?:^|\n)[^\n]+\n(?:\n)* {0,3}:[ \t]+/.exec(first_paragraph(src))
        return match == null ? undefined : match.index + (match[0].startsWith("\n") ? 1 : 0)
      },
      tokenizer(src) {
        // Read only consumed lines and lookahead, rather than splitting the remaining document.
        const lines: string[] = []
        const offsets: number[] = []
        let offset = 0
        const line = (index: number): string | undefined => {
          while (lines.length <= index && offset < src.length) {
            offsets.push(offset)
            const newline = src.indexOf("\n", offset)
            const end = newline < 0 ? src.length : newline
            lines.push(src.slice(offset, end))
            offset = end + 1
          }
          return lines[index]
        }
        const items: DefinitionItem[] = []
        let end = 0
        while (line(end) != null) {
          let cursor = end
          while (line(cursor)?.trim() == "") {
            cursor++
          }
          const term = line(cursor)
          if (term == null || term.trim().length == 0 || block_start.test(term)) {
            break
          }
          cursor++
          while (line(cursor)?.trim() == "") {
            cursor++
          }
          if (!definition.test(line(cursor) ?? "")) {
            break
          }
          const definitions: Token[][] = []
          while (line(cursor) != null) {
            const match = definition.exec(line(cursor) ?? "")
            if (match == null) {
              break
            }
            const content = [match[1]]
            cursor++
            while (line(cursor) != null) {
              if (/^(?: {4}|\t)/.test(line(cursor) ?? "")) {
                content.push(line(cursor)!.replace(/^(?: {4}|\t)/, ""))
                cursor++
              } else if (line(cursor)!.trim().length == 0) {
                let next = cursor + 1
                while (line(next)?.trim() == "") {
                  next++
                }
                if (!/^(?: {4}|\t)/.test(line(next) ?? "")) {
                  break
                }
                content.push(...lines.slice(cursor, next))
                cursor = next
              } else {
                break
              }
            }
            definitions.push(this.lexer.blockTokens(`${content.join("\n")}\n`))
          }
          items.push({term: this.lexer.inline(term.trim()), definitions})
          end = cursor
        }
        if (items.length == 0) {
          return undefined
        }
        const raw = src.slice(0, offsets[end] ?? src.length)
        const tokens = items.flatMap(({term, definitions}) => [...term, ...definitions.flat()])
        return {type: "definition_list", raw, items, tokens} satisfies DefinitionList
      },
      renderer(token) {
        const {items} = token as DefinitionList
        const body = items.map(({term, definitions}) => {
          const dt = `<dt>${this.parser.parseInline(term)}</dt>\n`
          return dt + definitions.map((tokens) => `<dd>${this.parser.parse(tokens)}</dd>\n`).join("")
        }).join("")
        return `<dl>\n${body}</dl>\n`
      },
    }],
  }
}
