
define [
  "common/logging"
  "common/plot"
], (Logging, Plot) ->

  logger = Logging.logger

  make_plot = (options) ->
    "pass"

  make_sources = (data) ->
    "pass"

  add_glyphs = (plot, sources, glyphs) ->
    "pass"

  add_guides = (plot, guides) ->
    "pass"

  add_annotations = (plot, annotations) ->
    "pass"

  add_tools = (plot, tools) ->
    "pass"

  figure = ({options, data, glyphs, guides, annotations, tools}) ->
    options ?= {}
    data ?= {}
    glyphs ?= []
    guides ?= {}
    annotations ?= {}
    tools ?= []

    plot = make_plot(options)

    sources = make_sources(data)

    add_glyphs(plot, sources, glyphs)
    add_guides(plot, guides)
    add annotations(plot, annotations)
    add_tools(plot, tools)

    return plot

