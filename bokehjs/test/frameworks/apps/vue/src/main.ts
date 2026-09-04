import {createApp, h} from "vue"

import {Bokeh} from "@bokeh/vue"

import {configure_hmr, install_framework_test, mark_hmr_received} from "../../shared"
import {generation} from "./hmr_state"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("vue", ({model, mountOptions, onMounted, onError}) => {
  const app = createApp({
    render: () => h(Bokeh, {model, mountOptions, onMounted, onMountError: onError, class: "bokeh-target"}),
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
