import "./setup"

import {LayoutDOM, LayoutDOMView} from "@bokehjs/models/layouts/layout_dom"
import {show} from "@bokehjs/api/plotting"
import {div} from "@bokehjs/core/dom"
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

type _It = {(description: string, fn: AsyncFunc): void} & {skip: Fn, with_server: Fn}

export function skip(description: string, fn: Func | AsyncFunc): void {
  stack[0].tests.push({description, fn, skip: true})
}

export const it: _It = ((description: string, fn: Func | AsyncFunc): void => {
  stack[0].tests.push({description, fn, skip: false})
}) as _It
it.skip = skip as any
it.with_server = skip as any

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

const _defer = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setImmediate

function defer(): Promise<void> {
  return new Promise((resolve) => {
    _defer(() => resolve())
  })
}

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

export async function run_all(grep?: string | RegExp): Promise<void> {
  for (const [parents, test] of iter_tests()) {
    if (test.skip)
      continue

    if (grep != null) {
      const descriptions = [...parents, test].map((s) => s.description)

      const macher: (d: string) => boolean =
        isString(grep) ? (d) => d.includes(grep) : (d) => d.search(grep) != -1
      if (!descriptions.some(macher))
        continue
    }

    await _run_test(parents, test)
  }
}

export async function clear_all(): Promise<void> {
  for (const [, test] of iter_tests()) {
    _clear_test(test)
  }
}

type Box = {x: number, y: number, width: number, height: number}
type State = {type: string, bbox?: Box, children?: State[]}

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

export async function run(seq: TestSeq): Promise<Result> {
  const [suites, test] = from_seq(seq)
  return await _run_test(suites, test)
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
}

async function _run_test(suites: Suite[], test: Test): Promise<Result> {
  const {fn} = test
  const start = Date.now()
  let error: {str: string, stack?: string} | null = null
  function _handle(err: unknown): void {
    if (err instanceof Error) {
      error = {str: err.toString(), stack: err.stack}
    } else {
      error = {str: `${err}`}
    }
  }

  for (const suite of suites) {
    for (const {fn} of suite.before_each)
      await fn()
  }
  current_test = test
  try {
    await fn()
    await defer()
  } catch (err) {
    //throw err
    _handle(err)
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
      const rect = test.el!.getBoundingClientRect()
      const left = rect.left + window.pageXOffset - document.documentElement!.clientLeft
      const top = rect.top + window.pageYOffset - document.documentElement!.clientTop
      const bbox = {x: left, y: top, width: rect.width, height: rect.height}
      const state = test.view.serializable_state() as any
      return {error, time, state, bbox}
    } catch (err) {
      //throw err
      _handle(err)
    }
  }
  return {error, time}
}

export async function display(obj: LayoutDOM, viewport: [number, number] = [1000, 1000]): Promise<LayoutDOMView> {
  const [width, height] = viewport
  const el = div({style: {width: `${width}px`, height: `${height}px`, overflow: "hidden"}})
  document.body.appendChild(el)
  const view = await show(obj, el)
  current_test!.view = view
  current_test!.el = el
  return view
}
