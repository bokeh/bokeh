import {mount, unmount} from "svelte"

import {configure_hmr, install_framework_test, mark_hmr_received} from "../../shared"
import App from "./App.svelte"
import {generation} from "./hmr_state"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("svelte", ({model, mountOptions, onMounted, onError}) => {
  const component = mount(App, {
    target: container,
    props: {model, multiRoot: Array.isArray(model), mountOptions, onMounted, onError},
  })
  return {
    target: () => container.querySelector(".bokeh-target"),
    unmount: () => unmount(component),
  }
})

configure_hmr(import.meta.hot)
void generation
import.meta.hot?.accept("./hmr_state", mark_hmr_received)
