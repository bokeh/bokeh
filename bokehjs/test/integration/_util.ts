import sinon from "sinon"

export {describe, it, display} from "../framework"

import {Matrix} from "@bokehjs/core/util/matrix"
import {Figure, figure} from "@bokehjs/api/plotting"
import {LayoutDOM, Row, Column, GridBox} from "@bokehjs/models/layouts/index"

import {wait} from "@bokehjs/core/util/defer"
import {tex2svg, mathml2svg} from "@bokehjs/models/text/mathjax"
import {MathJaxProvider, NoProvider} from "@bokehjs/models/text/providers"
import {MathTextView} from "@bokehjs/models/text/math_text"

export function grid(items: Matrix<LayoutDOM> | LayoutDOM[][], opts?: Partial<GridBox.Attrs>): GridBox {
  const children = Matrix.from(items).to_sparse()
  return new GridBox({...opts, children})
}

export function row(children: LayoutDOM[], opts?: Partial<Row.Attrs>): Row {
  return new Row({...opts, children})
}

export function column(children: LayoutDOM[], opts?: Partial<Column.Attrs>): Column {
  return new Column({...opts, children})
}

export function fig([width, height]: [number, number], attrs?: Partial<Figure.Attrs>): Figure {
  return figure({width, height, title: null, toolbar_location: null, ...attrs})
}

export class DelayedInternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {tex2svg, mathml2svg} : null
  }

  async fetch() {
    this.status = "loading"
    wait(50).then(() => {
      this.status = "loaded"
      this.ready.emit()
    })
  }
}

export class InternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {tex2svg, mathml2svg} : null
  }
  async fetch() {
    this.status = "loaded"
  }
}

export function with_provider(provider: MathJaxProvider) {
  return async (fn: () => Promise<void>) => {
    const stub = sinon.stub(MathTextView.prototype, "provider")
    stub.value(provider)
    try {
      await fn()
    } finally {
      stub.restore()
    }
  }
}

export const with_internal = with_provider(new InternalProvider())
export const with_delayed = with_provider(new DelayedInternalProvider())
export const with_none = with_provider(new NoProvider())
