import {StrictMode, createElement} from "react"
import {createRoot} from "react-dom/client"

import {Bokeh, BokehDocument, BokehRoot} from "@bokeh/react"

import {install_framework_test} from "../../shared"
import type {FrameworkRenderRequest} from "../../shared"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("react", ({model, mountOptions, onMounted, onError}) => {
  const root = createRoot(container)
  const render = ({model, mountOptions, onMounted, onError}: FrameworkRenderRequest) => {
    const content = Array.isArray(model)
      ? createElement(BokehDocument, {models: model, mountOptions, onMounted, onError},
        createElement("section", null, createElement(BokehRoot, {model: model[0], className: "bokeh-target"})),
        createElement("p", null, "ordinary React content between roots"),
        createElement("aside", null, createElement(BokehRoot, {model: model[1], className: "bokeh-target"})),
      )
      : createElement(Bokeh, {model, mountOptions, onMounted, onError, className: "bokeh-target"})
    root.render(createElement(StrictMode, null, content))
  }
  render({model, mountOptions, onMounted, onError})
  return {
    target: () => container.querySelector(".bokeh-target"),
    update: render,
    unmount: () => root.unmount(),
  }
})
