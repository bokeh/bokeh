import sinon from "sinon"

import {display as _display} from "../framework"
export {describe, it, display, fig} from "../framework"

import {Matrix} from "@bokehjs/core/util/matrix"
import type {UIElement} from "@bokehjs/models/ui/ui_element"
import type {OutputBackend} from "@bokehjs/core/enums"
import {Row, Column, GridBox} from "@bokehjs/models/layouts/index"

import {delay} from "@bokehjs/core/util/defer"
import {tex2svg, mathml2svg} from "@bokehjs/models/text/mathjax"
import {MathJaxProvider, NoProvider} from "@bokehjs/models/text/providers"
import {MathTextView} from "@bokehjs/models/text/math_text"

export function grid(items: Matrix<UIElement> | UIElement[][], opts?: Partial<GridBox.Attrs>): GridBox {
  const children = Matrix.from(items).to_sparse()
  return new GridBox({...opts, children})
}

export function row(children: UIElement[], opts?: Partial<Row.Attrs>): Row {
  return new Row({...opts, children})
}

export function column(children: UIElement[], opts?: Partial<Column.Attrs>): Column {
  return new Column({...opts, children})
}

export async function cross_display(
  make_plot: (output_backend: OutputBackend) => UIElement,
  backends: [OutputBackend, OutputBackend] = ["canvas", "webgl"],
): Promise<void> {
  await _display(new Row({children: backends.map((b) => make_plot(b))}))
}

export class DelayedInternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {tex2svg, mathml2svg} : null
  }

  async fetch() {
    this.status = "loading"
    void delay(50).then(() => {
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
