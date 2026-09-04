import {createApp, h} from "vue"

import {Bokeh, BokehDocument, BokehRoot} from "@bokeh/vue"

import {configure_hmr, install_framework_test, mark_hmr_received} from "../../shared"
import {generation} from "./hmr_state"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("vue", ({model, mountOptions, onMounted, onError}) => {
  const app = createApp({
    render: () => Array.isArray(model)
      ? h(BokehDocument, {models: model, mountOptions, onMounted, onMountError: onError}, {
        default: () => [
          h("section", null, h(BokehRoot, {model: model[0], class: "bokeh-target"})),
          h("p", null, "ordinary Vue content between roots"),
          h("aside", null, h(BokehRoot, {model: model[1], class: "bokeh-target"})),
        ],
      })
      : h(Bokeh, {model, mountOptions, onMounted, onMountError: onError, class: "bokeh-target"}),
  })
  app.mount(container)
  return {
    target: () => container.querySelector(".bokeh-target"),
    unmount: () => app.unmount(),
  }
})

configure_hmr(import.meta.hot)
void generation
import.meta.hot?.accept("./hmr_state", mark_hmr_received)
