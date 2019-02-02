import {LayoutDOM, LayoutDOMView} from "models/layouts/layout_dom"
import * as plotting from "api/plotting"
import {div} from "core/dom"
import {isString} from "core/util/types"

export type Suite = {description: string, suites: Suite[], tests: Test[]}
export type Test = {description: string, fn: () => Promise<void>, view?: LayoutDOMView, el?: HTMLElement}

export const top_level: Suite = {description: "top-level", suites: [], tests: []}
const stack: Suite[] = [top_level]

export function describe(description: string, fn: () => void): void {
  const suite = {description, suites: [], tests: []}
  stack[0].suites.push(suite)
  stack.unshift(suite)
  try {
    fn()
  } finally {
    stack.shift()
  }
}

export function it(description: string, fn: () => Promise<void>): void {
  stack[0].tests.push({description, fn})
}

export async function run_suite(suite: Suite, grep?: string | RegExp) {

  async function _run_suite(suite: Suite, seq: Suite[]) {
    for (const sub_suite of suite.suites) {
      await _run_suite(sub_suite, seq.concat(sub_suite))
    }

    for (const test of suite.tests) {
      const {fn, description} = test

      if (grep != null) {
        const descriptions = seq.map((s) => s.description).concat(description)

        if (isString(grep)) {
          if (!descriptions.some((d) => d.includes(grep)))
            continue
        } else {
          if (!descriptions.some((d) => d.search(grep) != -1))
            continue
        }
      }

      current_test = test
      await fn()
      current_test = null
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
  current_test = test
  await fn()
  current_test = null
  const end = Date.now()
  const state = test.view!.serializable_state()
  const {x, y, width, height} = test.el!.getBoundingClientRect() as DOMRect
  return JSON.stringify({state, bbox: {x, y, width, height}, time: end - start})
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
const {empty} = require("core/dom")
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
