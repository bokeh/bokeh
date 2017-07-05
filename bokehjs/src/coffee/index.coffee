bokehjs = () ->
  if not window?.document?
    throw new Error("bokehjs requires a window with a document. If your
      runtime environment doesn't provide those, e.g. pure node.js, you
      can use jsdom library to configure window and document.")

  Bokeh = require './main'
  return Bokeh

module.exports = if window?.document? then bokehjs() else bokehjs
