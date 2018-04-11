function is_browser(): boolean {
  return typeof window !== "undefined" && typeof window.document !== "undefined"
}

function bokehjs(): any {
  if (!is_browser()) {
    throw new Error(`\
bokehjs requires a window with a document. If your runtime \
environment doesn't provide those, e.g. pure node.js, you \
can use jsdom library to configure window and document.`)
  }

  const Bokeh = require('./main')
  return Bokeh
}

export = is_browser() ? bokehjs() : bokehjs
