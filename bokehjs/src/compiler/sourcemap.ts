import {SourceMapConsumer, SourceMapGenerator} from "source-map"
import type {Mapping, MappingItem, RawSourceMap} from "source-map"

import {BuildError} from "./error.js"

export type SourceMap = {
  version: number
  file?: string
  sourceRoot?: string
  sources: string[]
  sourcesContent?: string[]
  names: string[]
  mappings: string
}

// `file` is optional in practice, but not in source-map's typings.
function as_raw(map: SourceMap): RawSourceMap {
  return map as RawSourceMap
}

type RuntimeMapping = Omit<MappingItem, "source" | "name"> & {
  source: string | null
  name: string | null
}

// Mappings that only locate generated code, without an origin, are valid input
// to `addMapping()`, but not according to source-map's typings.
function add_mapping(generator: SourceMapGenerator, mapping: Partial<Mapping>): void {
  generator.addMapping(mapping as Mapping)
}

// Name given to the file that `compose()` maps through and then discards. Note
// that source names are URLs, so this has to survive percent-encoding intact to
// remain comparable to itself.
const intermediate = "bokehjs-intermediate-source"

/**
 * Composes two source maps into a single one.
 *
 * `outer` maps generated code onto an intermediate file, and `inner` maps that
 * same intermediate file onto the original sources. The result maps the
 * generated code directly onto `inner`'s sources, keeping their paths and
 * contents verbatim, so that consumers never observe the intermediate file.
 *
 * `outer` is expected to come from a single-file transpilation, i.e. to have
 * exactly one source, which is the file `inner` was generated for.
 */
export async function compose(outer: SourceMap, inner: SourceMap): Promise<SourceMap> {
  if (outer.sources.length == 0) {
    // nothing was mapped in the first place, e.g. an empty or comment-only
    // module, so there is nothing to redirect onto `inner`'s sources
    return outer
  }

  if (outer.sources.length != 1) {
    throw new BuildError("sourcemap", `expected a single source, got ${outer.sources.length}`)
  }

  // `applySourceMap()` pairs up the two maps by source name, but they don't
  // necessarily spell the intermediate file the same way (tsc names it by its
  // basename, whereas the map emitted next to it uses a path relative to its
  // own directory), so rename both ends to one agreed upon name first.
  const from = await new SourceMapConsumer(as_raw({...outer, sources: [intermediate], sourceRoot: undefined}))
  const onto = await new SourceMapConsumer(as_raw({...inner, file: intermediate}))

  try {
    const generator = SourceMapGenerator.fromSourceMap(from)
    generator.applySourceMap(onto, intermediate)

    // Mappings `inner` doesn't cover keep pointing at the intermediate file,
    // which isn't a file anyone can resolve. Nothing can be recovered for
    // those, but they must not end up in the output either.
    return await remove_source(generator.toJSON(), intermediate)
  } finally {
    from.destroy()
    onto.destroy()
  }
}

async function remove_source(map: RawSourceMap, source: string): Promise<SourceMap> {
  if (!map.sources.includes(source)) {
    return map
  }

  const consumer = await new SourceMapConsumer(map)

  try {
    const generator = new SourceMapGenerator({file: map.file, sourceRoot: map.sourceRoot})

    consumer.eachMapping((item) => {
      // A mapping that only locates generated code has no origin, and arrives with
      // `source` and `name` null, which source-map's typings don't admit to.
      const mapping = item as RuntimeMapping

      if (mapping.source == source) {
        return
      }

      add_mapping(generator, {
        generated: {line: mapping.generatedLine, column: mapping.generatedColumn},
        original: mapping.source != null ? {line: mapping.originalLine, column: mapping.originalColumn} : undefined,
        source: mapping.source ?? undefined,
        name: mapping.name ?? undefined,
      })
    })

    for (const each of map.sources) {
      if (each == source) {
        continue
      }

      const content = consumer.sourceContentFor(each, true)
      if (content != null) {
        generator.setSourceContent(each, content)
      }
    }

    return generator.toJSON()
  } finally {
    consumer.destroy()
  }
}
