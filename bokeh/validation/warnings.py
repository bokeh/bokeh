''' The warnings module defines the warning codes and validators for
Bokeh object graphs.

'''

codes = {
    1000: "MISSING_RENDERERS",
    1001: "NO_GLYPH_RENDERERS",
}

for code in codes:
    exec("%s = %d" % (codes[code], code))

texts = {
    MISSING_RENDERERS : "Plot object has no renderers",
    NO_GLYPH_RENDERERS : "Plot object has no glyph renderers",
}

def warning(code):
    def decorator(func):
        def wrapper(models):
            messages = func(models)
            name = codes[code]
            text = texts[code]
            return ["W%d (%s): %s: %s" % (code, name, text, msg) for msg in messages]
        return wrapper
    return decorator

@warning(MISSING_RENDERERS)
def _check_missing_renderers(models):
    from bokeh.models.plots import Plot
    messages = []
    for model in models:
        if not isinstance(model, Plot): continue
        if not hasattr(model, "renderers"): continue
        if len(model.renderers) == 0:
            messages.append(str(model))
    return messages

@warning(NO_GLYPH_RENDERERS)
def _check_no_glyph_renderers(models):
    from bokeh.models.plots import Plot
    from bokeh.models.renderers import GlyphRenderer
    messages = []
    for model in models:
        if not isinstance(model, Plot): continue
        if not hasattr(model, "renderers"): continue
        grs = [x for x in model.renderers if isinstance(x, GlyphRenderer)]
        if len(grs) == 0:
            messages.append(str(model))
    return messages


del warning