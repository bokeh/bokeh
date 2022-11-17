import "./setup"

import {UIElement, UIElementView} from "@bokehjs/models/ui/ui_element"
import {View} from "@bokehjs/core/view"
import {LayoutDOM} from "@bokehjs/models/layouts/layout_dom"
import {show} from "@bokehjs/api/plotting"
import {Document} from "@bokehjs/document"
import {HasProps} from "@bokehjs/core/has_props"
import {div, empty, offset_bbox} from "@bokehjs/core/dom"
import {ViewOf} from "@bokehjs/core/view"
import {isNumber, isString, isArray, isPlainObject} from "@bokehjs/core/util/types"
import {entries} from "@bokehjs/core/util/object"
import {assert, unreachable} from "@bokehjs/core/util/assert"
import {defer} from "@bokehjs/core/util/defer"
import {BBox} from "@bokehjs/core/util/bbox"

let ready: () => Promise<void> = defer
export function set_ready(fn: () => Promise<void>): void {
  ready = fn
}

export type Func = () => void
export type AsyncFunc = () => Promise<void>

export type Decl = {
  fn: Func | AsyncFunc
  description?: string
}

export type Test = Decl & {
  description: string
  skip: boolean
  views: View[]
  el?: HTMLElement
  viewport?: [number, number]
  threshold?: number
  retries?: number
  dpr?: number
}

export type Suite = {
  description: string
  suites: Suite[]
  tests: Test[]
  before_each: Decl[]
  after_each: Decl[]
}

export const top_level: Suite = {description: "top-level", suites: [], tests: [], before_each: [], after_each: []}
const stack: Suite[] = [top_level]

export function describe(description: string, fn: Func/* | AsyncFunc*/): void {
  const suite = {description, suites: [], tests: [], before_each: [], after_each: []}
  stack[0].suites.push(suite)
  stack.unshift(suite)
  try {
    fn()
  } finally {
    stack.shift()
  }
}

type ItFn = (description: string, fn: Func | AsyncFunc) => Test
type _It = ItFn & {
  skip: ItFn
  allowing: (settings: number | TestSettings) => ItFn
  dpr: (dpr: number) => ItFn
}

function _it(description: string, fn: Func | AsyncFunc, skip: boolean): Test {
  const test = {description, fn, skip, views: []}
  stack[0].tests.push(test)
  return test
}

export type TestSettings = {
  threshold?: number
  retries?: number
}

export function allowing(settings: number | TestSettings): ItFn {
  return (description: string, fn: Func | AsyncFunc): Test => {
    const test = it(description, fn)
    if (isNumber(settings)) {
      test.threshold = settings
    } else {
      test.threshold = settings.threshold
      test.retries = settings.retries
    }
    return test
  }
}

export function dpr(dpr: number): ItFn {
  return (description: string, fn: Func | AsyncFunc): Test => {
    const test = it(description, fn)
    test.dpr = dpr
    return test
  }
}

export function skip(description: string, fn: Func | AsyncFunc): Test {
  return _it(description, fn, true)
}

export const it: _It = ((description: string, fn: Func | AsyncFunc): Test => {
  return _it(description, fn, false)
}) as _It
it.skip = skip
it.allowing = allowing
it.dpr = dpr

export function before_each(fn: Func | AsyncFunc): void {
  stack[0].before_each.push({fn})
}

export function after_each(fn: Func | AsyncFunc): void {
  stack[0].after_each.push({fn})
}

const _globalThis: any = globalThis

_globalThis.describe = describe
_globalThis.it = it
_globalThis.before_each = before_each
_globalThis.after_each = after_each

function* iter_from({suites, tests}: Suite, parents: Suite[] = []): Iterable<[Suite[], Test]> {
  for (const suite of suites) {
    yield* iter_from(suite, parents.concat(suite))
  }

  for (const test of tests) {
    yield [parents, test]
  }
}

function* iter_tests(): Iterable<[Suite[], Test]> {
  yield* iter_from(top_level)
}

function descriptions(suites: Suite[], test: Test): string[] {
  return [...suites, test].map((obj) => obj.description)
}

function description(suites: Suite[], test: Test, sep: string = " "): string {
  return descriptions(suites, test).join(sep)
}

export async function run_all(query?: string | string[] | RegExp): Promise<void> {
  for await (const result of yield_all(query)) {
    if (result.error != null) {
      console.error(result.error)
    }
  }
}

export async function* yield_all(query?: string | string[] | RegExp): AsyncGenerator<PartialResult> {
  const matches = ((): (desc: string) => boolean => {
    if (query == null)
      return () => true
    else if (isString(query))
      return (desc) => desc.includes(query)
    else if (isArray(query))
      return (desc) => query.every((q) => desc.includes(q))
    else if (query instanceof RegExp)
      return (desc) => desc.match(query) != null
    else
      unreachable()
  })()

  for (const [parents, test] of iter_tests()) {
    if (test.skip || !matches(description(parents, test))) {
      continue
    }

    yield await _run_test(parents, test)
  }
}

export async function clear_all(): Promise<void> {
  for (const [, test] of iter_tests()) {
    _clear_test(test)
  }
}

type Box = {x: number, y: number, width: number, height: number}
type State = {type: string, bbox?: Box, children?: State[]}

type PartialResult = {error: Error | null, time: number, state?: State, bbox?: Box}
type Result = {error: {str: string, stack?: string} | null, time: number, state?: State, bbox?: Box}
type TestSeq = [number[], number]

let current_test: Test | null = null

function from_seq([si, ti]: TestSeq): [Suite[], Test] {
  let current = top_level
  const suites = [current]
  for (const i of si) {
    current = current.suites[i]
    suites.push(current)
  }
  const test = current.tests[ti]
  return [suites, test]
}

function _handle_error(err: Error | null): {str: string, stack?: string} | null {
  return err == null ? null : {str: err.toString(), stack: err.stack}
}

export async function run(seq: TestSeq): Promise<Result> {
  const [suites, test] = from_seq(seq)
  const result = await _run_test(suites, test)
  return {...result, error: _handle_error(result.error)}
}

export async function clear(seq: TestSeq): Promise<void> {
  const [, test] = from_seq(seq)
  _clear_test(test)
}

const container = document.querySelector(".container")!

function _clear_test(test: Test): void {
  for (const view of test.views) {
    const {model} = view
    if (model.document != null) {
      model.document.remove_root(model)
    } else {
      view.remove()
    }
  }
  test.views = []
  if (test.el != null) {
    test.el.remove()
    test.el = undefined
  }
  empty(container)
}

function _resolve_bbox(val: unknown): unknown {
  if (isArray(val)) {
    return val.map((v) => _resolve_bbox(v))
  } else if (isPlainObject(val)) {
    const result: {[key: string]: unknown} = {}
    for (const [k, v] of entries(val)) {
      result[k] = _resolve_bbox(v)
    }
    return result
  } else if (val instanceof BBox) {
    return val.box
  } else {
    return val
  }
}

async function _run_test(suites: Suite[], test: Test): Promise<PartialResult> {
  const {fn} = test
  const start = Date.now()
  let error: Error | null = null

  const desc = div({class: "description"}, description(suites, test, " ⇒ "))
  container.appendChild(desc)

  current_test = test

  try {
    for (const suite of suites) {
      for (const {fn} of suite.before_each)
        await fn()
    }

    try {
      await fn()
      await ready()
    } catch (err) {
      error = err instanceof Error ? err : new Error(`${err}`)
    } finally {
      for (const suite of suites) {
        for (const {fn} of suite.after_each)
          await fn()
      }
    }
  } finally {
    current_test = null
  }

  const end = Date.now()
  const time = end - start

  if (error == null) {
    for (const view of test.views) {
      if (!(view instanceof UIElementView))
        continue
      try {
        const {width, height} = view.bbox
        if (test.viewport != null) {
          const [vw, vh] = test.viewport
          if (width > vw || height > vh)
            error = new Error(`viewport size exceeded [${width}, ${height}] > [${vw}, ${vh}]`)
        }
        const bbox = offset_bbox(test.el!).box
        const state = _resolve_bbox(view.serializable_state()) as State
        return {error, time, state, bbox}
      } catch (err) {
        error = err instanceof Error ? err : new Error(`${err}`)
      }
    }
  }
  return {error, time}
}

export async function display(obj: Document, viewport?: [number, number] | "auto" | null, el?: HTMLElement): Promise<{views: ViewOf<HasProps>[], el: HTMLElement}>
export async function display<T extends UIElement>(obj: T, viewport?: [number, number] | "auto" | null, el?: HTMLElement): Promise<{view: ViewOf<T>, el: HTMLElement}>

export async function display(obj: Document | UIElement, viewport: [number, number] | "auto" | null = "auto",
    el?: HTMLElement): Promise<{view: ViewOf<HasProps>, el: HTMLElement} | {views: ViewOf<HasProps>[], el: HTMLElement}> {
  const test = current_test
  assert(test != null, "display() must be called in it(...) or before*() blocks")

  const margin = 50
  const size: [number, number] | null = (() => {
    if (viewport == null)
      return null
    else if (viewport == "auto") {
      const model = obj instanceof Document ? obj.roots()[0] : obj
      if (model instanceof LayoutDOM) {
        const {width, height} = _infer_viewport(model)
        if (isFinite(width) && isFinite(height))
          return [width + margin, height + margin]
      }
    } else {
      return viewport
    }

    throw new Error("unable to infer viewport size")
  })()

  const viewport_el = (() => {
    if (size == null)
      return div({class: "viewport", style: {width: "max-content", height: "max-content", overflow: "visible"}}, el)
    else {
      const [width, height] = size
      return div({class: "viewport", style: {width: `${width}px`, height: `${height}px`, overflow: "hidden"}}, el)
    }
  })()

  const doc = (() => {
    if (obj instanceof Document)
      return obj
    else {
      const doc = new Document()
      doc.add_root(obj)
      return doc
    }
  })()

  container.appendChild(viewport_el)
  const views = await show(doc, el ?? viewport_el)
  test.views = views
  test.el = viewport_el
  test.viewport = size ?? undefined
  if (obj instanceof Document)
    return {views: test.views, el: viewport_el}
  else
    return {view: test.views[0], el: viewport_el}
}

export async function compare_on_dom(fn: (ctx: CanvasRenderingContext2D) => void, svg: SVGSVGElement, {width, height}: {width: number, height: number}): Promise<void> {
  const canvas = document.createElement("canvas")
  canvas.height = height
  canvas.width = width

  container.appendChild(canvas)

  const ctx = canvas.getContext("2d")!

  fn(ctx)

  container.appendChild(svg)

  await defer()
}

import {sum} from "@bokehjs/core/util/array"
import {Size} from "@bokehjs/core/layout"
import {Row, Column, GridBox} from "@bokehjs/models/layouts"
import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {GridPlot} from "@bokehjs/models/plots"
import {Button, Div} from "@bokehjs/models/widgets"

function _infer_viewport(obj: UIElement): Size {
  if (obj instanceof LayoutDOM)
    return _infer_layoutdom_viewport(obj)
  else
    return {width: Infinity, height: Infinity}
}

function _infer_layoutdom_viewport(obj: LayoutDOM): Size {
  const {sizing_mode, width_policy, height_policy} = obj

  let width = 0
  let height = 0
  if (sizing_mode == "fixed" || (width_policy == "fixed" && height_policy == "fixed")) {
    width = obj.width ?? Infinity
    height = obj.height ?? Infinity
  } else if (width_policy == "max" || height_policy == "max") {
    width = Infinity
    height = Infinity
  } else {
    if (obj instanceof Row) {
      for (const child of obj.children) {
        const size = _infer_viewport(child)
        width += size.width
        height = Math.max(height, size.height)
      }

      width += obj.spacing*(obj.children.length - 1)
    } else if (obj instanceof Column) {
      for (const child of obj.children) {
        const size = _infer_viewport(child)
        width = Math.max(width, size.width)
        height += size.height
      }

      height += obj.spacing*(obj.children.length - 1)
    } else if (obj instanceof GridBox || obj instanceof GridPlot) {
      let nrow = 0
      let ncol = 0
      for (const [, row, col] of obj.children) {
        nrow = Math.max(nrow, row)
        ncol = Math.max(ncol, col)
      }
      nrow += 1
      ncol += 1
      const widths = new Array(ncol).fill(0)
      const heights = new Array(nrow).fill(0)
      for (const [child, row, col] of obj.children) {
        const size = _infer_viewport(child)
        widths[col] = Math.max(widths[col], size.width)
        heights[row] = Math.max(heights[row], size.height)
      }
      width = sum(widths)
      height = sum(heights)

      if (obj instanceof GridPlot) {
        switch (obj.toolbar_location) {
          case "above":
          case "below":
            height += 30
            break
          case "left":
          case "right":
            width += 30
            break
        }
      }
    } else if (obj instanceof Toolbar) {
      switch (obj.location) {
        case "above":
        case "below":
          width = 0
          height = 30
          break
        case "left":
        case "right":
          width = 30
          height = 0
          break
      }
    } else if (obj instanceof Button) {
      width = 300
      height = 50
    } else if (obj instanceof Div) {
      width = 300
      height = 100
    } else {
      width = obj.width ?? Infinity
      height = obj.height ?? Infinity
    }
  }

  return {width, height}
}

import {Figure, figure} from "@bokehjs/api/plotting"

export function fig([width, height]: [number, number], attrs?: Partial<Figure.Attrs>): Figure {
  return figure({width, height, title: null, toolbar_location: null, ...attrs})
}
