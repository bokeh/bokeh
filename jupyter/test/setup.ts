if (globalThis.DragEvent == null) {
  globalThis.DragEvent = class DragEvent extends MouseEvent {} as typeof DragEvent
}

if (window.matchMedia == null) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })
}

if (navigator.clipboard == null) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {writeText: async (_text: string) => undefined},
  })
}
