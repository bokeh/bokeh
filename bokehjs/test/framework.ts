import "./setup"
import defer from "./defer"

import {LayoutDOM, LayoutDOMView} from "@bokehjs/models/layouts/layout_dom"
import {show} from "@bokehjs/api/plotting"
import {div, empty} from "@bokehjs/core/dom"
import {ViewOf} from "@bokehjs/core/view"
import {isString} from "@bokehjs/core/util/types"

export type Func = () => void
export type AsyncFunc = () => Promise<void>

export type Decl = {
  fn: Func | AsyncFunc
  description?: string
}

export type Test = Decl & {
  description: string
  skip: boolean
  view?: LayoutDOMView
  el?: HTMLElement
  threshold?: number
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
  with_server: ItFn
  allowing: (threshold: number) => ItFn
  dpr: (dpr: number) => ItFn
}

function _it(description: string, fn: Func | AsyncFunc, skip: boolean): Test {
  const test = {description, fn, skip}
  stack[0].tests.push(test)
  return test
}

export function allowing(threshold: number): ItFn {
  return (description: string, fn: Func | AsyncFunc): Test => {
    const test = it(description, fn)
    test.threshold = threshold
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
it.with_server = skip
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

export async function run_all(query?: string | RegExp): Promise<void> {
  for await (const result of yield_all(query)) {
    if (result.error != null) {
      console.error(result.error)
    }
  }
}

export async function* yield_all(query?: string | RegExp): AsyncGenerator<PartialResult> {
  const matches: (d: string) => boolean =
    query == null ? (_d) => true : (isString(query) ? (d) => d.includes(query) : (d) => d.match(query) != null)

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
  if (err instanceof Error)
    return {str: err.toString(), stack: err.stack}
  else if (err != null)
    return {str: `${err}`}
  else
    return null
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

function _clear_test(test: Test): void {
  if (test.view != null) {
    const {model} = test.view
    if (model.document != null) {
      model.document.remove_root(model)
    } else {
      test.view.remove()
    }
    test.view = undefined
  }
  if (test.el != null) {
    test.el.remove()
    test.el = undefined
  }
  empty(document.body)
}

async function _run_test(suites: Suite[], test: Test): Promise<PartialResult> {
  const {fn} = test
  const start = Date.now()
  let error: Error | null = null

  for (const suite of suites) {
    for (const {fn} of suite.before_each)
      await fn()
  }

  current_test = test
  try {
    await fn()
    await defer()
  } catch (err: unknown) {
    error = err instanceof Error ? err : new Error(`${err}`)
  } finally {
    current_test = null

    for (const suite of suites) {
      for (const {fn} of suite.after_each)
        await fn()
    }
  }

  const end = Date.now()
  const time = end - start

  if (error == null && test.view != null) {
    try {
      const {width, height} = test.view.layout.bbox
      const rect = test.el!.getBoundingClientRect()
      if (width > rect.width || height > rect.height)
        throw new Error(`viewport size exceeded [${width}, ${height}] > [${rect.width}, ${rect.height}]`)
      const left = rect.left + window.pageXOffset - document.documentElement!.clientLeft
      const top = rect.top + window.pageYOffset - document.documentElement!.clientTop
      const bbox = {x: left, y: top, width: rect.width, height: rect.height}
      const state = test.view.serializable_state()
      return {error, time, state, bbox}
    } catch (err: unknown) {
      error = err instanceof Error ? err : new Error(`${err}`)
    }
  }
  return {error, time}
}

export async function display<T extends LayoutDOM>(obj: T, viewport?: [number, number], el?: HTMLElement): Promise<{view: ViewOf<T>, el: HTMLElement}> {
  const margin = 50
  const [width, height] = (() => {
    if (viewport != null)
      return viewport
    else {
      const {width, height} = _infer_viewport(obj)
      if (width != Infinity && height != Infinity) {
        return [width + margin, height + margin]
      } else {
        throw new Error("unable to infer viewport size")
      }
    }
  })()
  const vp = div({style: {width: `${width}px`, height: `${height}px`, overflow: "hidden"}}, el)
  document.body.appendChild(vp)
  const view = await show(obj, el ?? vp)
  current_test!.view = view
  current_test!.el = vp
  return {view, el: vp}
}

import {sum} from "@bokehjs/core/util/array"
import {Size} from "@bokehjs/core/layout"
import {Row, Column, GridBox} from "@bokehjs/models/layouts"

function _infer_viewport(obj: LayoutDOM): Size {
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
    } else if (obj instanceof GridBox) {
      let nrow = 0
      let ncol = 0
      for (const [, row, col] of obj.children) {
        nrow = Math.max(nrow, row)
        ncol = Math.max(ncol, col)
      }
      const widths = new Array(ncol)
      const heights = new Array(nrow)
      for (const [child, row, col] of obj.children) {
        const size = _infer_viewport(child)
        widths[col] = Math.max(widths[col], size.width)
        heights[col] = Math.max(heights[row], size.height)
      }
      width = sum(widths)
      height = sum(heights)
    } else {
      width = obj.width ?? Infinity
      height = obj.height ?? Infinity
    }
  }

  return {width, height}
}
