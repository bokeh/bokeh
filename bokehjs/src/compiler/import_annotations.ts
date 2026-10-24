import MagicString from "magic-string"
import {parseSync} from "rolldown/experimental"
import type {OutputChunk, Plugin} from "rolldown"
import {TraceMap, originalPositionFor} from "@jridgewell/trace-mapping"
import type {EncodedSourceMap} from "@jridgewell/trace-mapping"
import remapping from "@jridgewell/remapping"

const is_annotation = (text: string) => /@vite-ignore|webpackIgnore\s*:/.test(text)
type Parsed = ReturnType<typeof parseSync>
type ImportExpression = Parsed["module"]["dynamicImports"][number]

function import_comments(parsed: Parsed, expression: ImportExpression) {
  return parsed.comments.filter(({start, end}) =>
    start > expression.start && end < expression.end &&
    !parsed.module.dynamicImports.some((nested) =>
      nested.start > expression.start && nested.end < expression.end && start > nested.start && end < nested.end,
    ),
  )
}

// These comments affect subsequent consumer builds. Preserve them through the
// final minification and place them before the specifier for consumer tools.
// Source maps identify the original import; unrelated dynamic imports stay intact.
export function restore_import_annotations(file: string, code: string, map: EncodedSourceMap): {code: string, map: EncodedSourceMap} {
  if (map.sourcesContent == null || !map.sourcesContent.some((source) => source != null && is_annotation(source))) {
    return {code, map}
  }

  const trace = new TraceMap(map)
  const generated = parseSync(file, code)
  const originals = new Map<number, Parsed>()
  const edits = new MagicString(code)
  for (const expression of generated.module.dynamicImports) {
    // Trace the import keyword: its argument may itself contain another import.
    const prefix = code.slice(0, expression.start).split("\n")
    const position = originalPositionFor(trace, {line: prefix.length, column: prefix.at(-1)!.length})
    if (position.source == null) {
      continue
    }
    const index = trace.resolvedSources.indexOf(position.source)
    const source = map.sourcesContent[index]
    if (source == null || !is_annotation(source)) {
      continue
    }
    let original = originals.get(index)
    if (original == null) {
      original = parseSync(position.source, source)
      originals.set(index, original)
    }
    const lines = source.split("\n")
    const offset = lines.slice(0, position.line - 1).reduce((length, line) => length + line.length + 1, 0) + position.column
    const origin = original.module.dynamicImports.filter(({start, end}) => start <= offset && offset < end)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start)).at(0)
    if (origin == null) {
      continue
    }
    const existing = import_comments(generated, expression)
    const annotations = import_comments(original, origin).filter(({value}) => {
      if (!is_annotation(value)) {
        return false
      }
      const present = existing.find((comment) => comment.value.trim() == value.trim())
      if (present == null) {
        return true
      } else if (present.end > expression.moduleRequest.start) {
        // Recent Oxc versions retain trailing comments. Move those, rather
        // than duplicating them or leaving consumer placement inconsistent.
        edits.remove(present.start, present.end)
        return true
      } else {
        return false
      }
    })
    if (annotations.length != 0) {
      const text = annotations.map(({start, end, type}) => `${source.slice(start, end)}${type == "Line" ? "\n" : " "}`).join("")
      edits.appendLeft(expression.moduleRequest.start, text)
    }
  }
  if (!edits.hasChanged()) {
    return {code, map}
  }
  const edit_map = edits.generateMap({source: file, file, includeContent: true, hires: true})
  const composed = remapping([edit_map.toString(), map], () => null)
  return {code: edits.toString(), map: JSON.parse(composed.toString()) as EncodedSourceMap}
}

export function preserve_import_annotations(): Plugin {
  return {
    name: "bokeh-preserve-import-annotations",
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type != "chunk" || output.map == null) {
          continue
        }
        const original_map = JSON.parse(output.map.toString()) as EncodedSourceMap
        const restored = restore_import_annotations(output.fileName, output.code, original_map)
        output.code = restored.code
        // Rolldown validates its map setters immediately. Replace atomically:
        // the composed mappings can refer to a differently ordered source list.
        const json = JSON.stringify(restored.map)
        output.map = {
          ...restored.map,
          toString: () => json,
          toUrl: () => `data:application/json;charset=utf-8;base64,${Buffer.from(json).toString("base64")}`,
        } as NonNullable<OutputChunk["map"]>
        const asset = Object.values(bundle).find((item) => item.fileName == `${output.fileName}.map`)
        if (asset != null && asset.type == "asset") {
          asset.source = json
        }
      }
    },
  }
}
