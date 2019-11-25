import {LayoutDOM, LayoutDOMView} from "@bokehjs/models/layouts/layout_dom"
import * as plotting from "@bokehjs/api/plotting"
import {div} from "@bokehjs/core/dom"
import {isString} from "@bokehjs/core/util/types"

export type Func = () => void
export type AsyncFunc = () => Promise<void>

export type Decl = {
  fn: Func | AsyncFunc
  description?: string
}

export type Test = Decl & {
  skip: boolean
  view?: LayoutDOMView
  el?: HTMLElement
}

export type Suite = {
  description: string
  suites: Suite[]
  tests: Test[]
  before: Decl[]
  after: Decl[]
  beforeEach: Decl[]
  afterEach: Decl[]
}

export const top_level: Suite = {description: "top-level", suites: [], tests: [], before: [], after: [], beforeEach: [], afterEach: []}
const stack: Suite[] = [top_level]

export function describe(description: string, fn: Func/* | AsyncFunc*/): void {
  const suite = {description, suites: [], tests: [], before: [], after: [], beforeEach: [], afterEach: []}
  stack[0].suites.push(suite)
  stack.unshift(suite)
  try {
    fn()
  } finally {
    stack.shift()
  }
}

type _It = {(description: string, fn: AsyncFunc): void} & {skip: Fn}

export function skip(description: string, fn: AsyncFunc): void {
  stack[0].tests.push({description, fn, skip: true})
}

export const it: _It = ((description: string, fn: AsyncFunc): void => {
  stack[0].tests.push({description, fn, skip: false})
}) as _It
it.skip = skip as any

export function before(fn: Func): void {
  stack[0].before.push({fn})
}

export function after(fn: Func): void {
  stack[0].after.push({fn})
}

export function beforeEach(fn: Func): void {
  stack[0].beforeEach.push({fn})
}

export function afterEach(fn: Func): void {
  stack[0].afterEach.push({fn})
}

const _globalThis: any = globalThis

_globalThis.describe = describe
_globalThis.it = it
_globalThis.before = before
_globalThis.after = after
_globalThis.beforeEach = beforeEach
_globalThis.afterEach = afterEach

export async function run_suite(suite: Suite, grep?: string | RegExp) {

  async function _run_suite(suite: Suite, seq: Suite[]) {
    for (const sub_suite of suite.suites) {
      await _run_suite(sub_suite, seq.concat(sub_suite))
    }

    for (const test of suite.tests) {
      const {fn, description} = test

      if (grep != null) {
        const descriptions = seq.map((s) => s.description).concat(description ?? "")

        if (isString(grep)) {
          if (!descriptions.some((d) => d.includes(grep)))
            continue
        } else {
          if (!descriptions.some((d) => d.search(grep) != -1))
            continue
        }
      }

      current_test = test
      try {
        await fn()
      } finally {
        current_test = null
      }
    }
  }

  await _run_suite(suite, [suite])
}

export async function run_all(grep?: string | RegExp) {
  await run_suite(top_level, grep)
}

//export type TestResult = {state: any, bbox:
let current_test: Test | null = null

export async function run_test(seq: number[]) {
  let current = top_level
  for (let j = 0; j < seq.length - 1; j++) {
    current = current.suites[seq[j]]
  }
  const test = current.tests[seq[seq.length-1]]
  const {fn} = test
  const start = Date.now()
  let error: string | null = null
  current_test = test
  try {
    await fn()
  } catch (err) {
    error = err.toString()
  } finally {
    current_test = null
  }
  const end = Date.now()
  const time = end - start
  const result = (() => {
    if (error == null && test.view != null) {
      try {
        const {x, y, width, height} = test.view.el.getBoundingClientRect()
        const bbox = {x, y, width, height}
        const state = test.view.serializable_state()
        return {error, time, state, bbox}
      } catch (err) {
        error = err
      }
    }
    return {error, time}
  })()
  return JSON.stringify(result)
}

export function display(obj: LayoutDOM, viewport: [number, number] = [1000, 1000]): Promise<LayoutDOMView> {
  const [width, height] = viewport
  const el = div({style: {width: `${width}px`, height: `${height}px`, overflow: "hidden"}})
  document.body.appendChild(el)
  return plotting.show(obj, el).then((view) => {
    current_test!.view = view
    current_test!.el = el
    return view
  })
}

/*
const {empty} = require("@bokehjs/core/dom")
let view = null

function show(model) {
  const root = document.getElementById("root")

  if (view != null) {
    try {
      view.remove()
    } finally {
      delete Bokeh.index[view.model.id]
      empty(root)
      view = null
    }
  }

  view = new model.default_view({model, parent: null})
  Bokeh.index[view.model.id] = view
  view.renderTo(root)
  return view
}

function run(test) {
  const [,fn] = test
  fn(show)
}
*/
