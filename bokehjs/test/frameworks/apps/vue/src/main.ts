import {createApp, h, shallowRef} from "vue"

import {Bokeh, BokehDocument, BokehRoot, BokehSession} from "@bokeh/vue"

import {install_framework_test} from "../../shared"

const container = document.querySelector<HTMLElement>("#app")!

install_framework_test("vue", (request) => {
  const current = shallowRef(request)
  const app = createApp({
    render: () => {
      const {model, mountOptions, onMounted, onError} = current.value
      return Array.isArray(model)
        ? h(BokehDocument, {models: model, mountOptions, onMounted, onMountError: onError}, {
          default: () => [
            h("section", null, h(BokehRoot, {model: model[0], class: "bokeh-target"})),
            h("p", null, "ordinary Vue content between roots"),
            h("aside", null, h(BokehRoot, {model: model[1], class: "bokeh-target"})),
          ],
        })
        : h(Bokeh, {model, mountOptions, onMounted, onMountError: onError, class: "bokeh-target"})
    },
  })
  app.mount(container)
  return {
    target: () => container.querySelector(".bokeh-target"),
    update: (next) => current.value = next,
    unmount: () => app.unmount(),
  }
}, ({source, onSession, onMounted, onError}) => {
  const visible = shallowRef(true)
  const app = createApp({
    render: () => h(BokehSession, {source, onSession, onMounted, onMountError: onError}, {
      default: () => [
        h("section", null, visible.value ? [h(BokehRoot, {model: "first", class: "first"})] : []),
        h("p", null, "ordinary Vue content between session roots"),
        h("aside", null, h(BokehRoot, {model: "second", class: "second"})),
        h(BokehRoot, {model: "late", class: "late"}),
      ],
    }),
  })
  app.mount(container)
  return {
    target: (name) => container.querySelector(`.${name}`),
    showFirst: (value) => { visible.value = value },
    unmount: () => app.unmount(),
  }
})
