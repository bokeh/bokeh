// Source maps of linked modules, chained down to the original sources (e.g. `*.ts`).
//
// Within modules, sources are `file://` URLs, so that they survive remapping (which
// resolves sources as URLs) on all platforms. Bundles rename them with `name()`.
import {dirname, resolve} from "node:path"
import {pathToFileURL, fileURLToPath} from "node:url"

import type MagicString from "magic-string"
import remapping from "@jridgewell/remapping"
import type {EncodedSourceMap} from "@jridgewell/remapping"
import {FlattenMap, encodedMap} from "@jridgewell/trace-mapping"
import * as convert from "convert-source-map"

import {read} from "./sys.js"

export type SourceMap = EncodedSourceMap

export const file_url = (file: string): string => pathToFileURL(file).href

/**
 * Returns a map of edits in `str` of `file`'s code. Word boundaries are as precise
 * as tsc's maps, which these maps are chained with, and much cheaper than characters.
 */
export function edits_map(str: MagicString, file: string): SourceMap {
  return {...str.generateMap({hires: "boundary", source: file_url(file), includeContent: true}), version: 3}
}

const is_url = (source: string) => /^[a-z][a-z0-9+.-]*:/i.test(source)
const is_file_url = (source: string | null): source is string => source != null && source.startsWith("file:")

/**
 * Loads the source map referenced by `code` of `file` (inline or a map file), with
 * contents of all sources, or returns `null`, if there is no complete source map.
 */
export function load_source_map(file: string, code: string): SourceMap | null {
  let map_dir = dirname(file)
  let map: SourceMap
  try {
    const converter = convert.fromSource(code) ?? convert.fromMapFileSource(code, (map_file) => {
      const path = resolve(dirname(file), map_file)
      map_dir = dirname(path)
      return read(path) ?? ""
    })
    if (converter == null) {
      return null
    }
    map = converter.toObject() as SourceMap
  } catch {
    return null
  }

  const sources = map.sources.map((source) => {
    if (source == null || is_url(source)) {
      return source
    } else {
      return file_url(resolve(map_dir, map.sourceRoot ?? "", source))
    }
  })
  const sources_content = sources.map((source, i) => {
    return map.sourcesContent?.[i] ?? (is_file_url(source) ? read(fileURLToPath(source)) : null) ?? null
  })
  if (sources_content.includes(null)) {
    return null
  }

  return {...map, sourceRoot: undefined, sources, sourcesContent: sources_content}
}

/** Chains `maps`, where each map's (only) source is the output of the next one. */
export function chain(...maps: (SourceMap | null)[]): SourceMap {
  const {file, mappings, names, sources, sourcesContent, ignoreList} = remapping(maps.filter((map) => map != null), () => null)
  return {version: 3, file, mappings: mappings as string, names, sources, sourcesContent, ignoreList}
}

export type Section = {line: number, column: number, map: SourceMap}

/** Concatenates source maps of consecutive pieces of code and renames their sources. */
export function concat(sections: Section[], name: (file: string) => string): SourceMap {
  const flat = encodedMap(new FlattenMap({
    version: 3,
    sections: sections.map(({line, column, map}) => ({offset: {line, column}, map})),
  }))
  const sources = flat.sources.map((source) => is_file_url(source) ? name(fileURLToPath(source)) : source)
  return {...flat, sources}
}

/** Moves code mapped by `map` by `lines` down, e.g. below a prelude. */
export function shift_lines(map: SourceMap, lines: number): SourceMap {
  return {...map, mappings: `${";".repeat(lines)}${map.mappings}`}
}

export type Contents = {[source: string]: string}

/** Moves contents of `map`'s sources to `contents`, e.g. to store them only once. */
export function extract_contents(map: SourceMap, contents: Contents): SourceMap {
  map.sources.forEach((source, i) => {
    const content = map.sourcesContent?.[i]
    if (source != null && content != null) {
      contents[source] = content
    }
  })
  return {...map, sourcesContent: undefined}
}

/** Reverses `extract_contents()`. */
export function restore_contents(map: SourceMap, contents: Contents): SourceMap {
  return {...map, sourcesContent: map.sources.map((source) => source != null ? contents[source] ?? null : null)}
}
