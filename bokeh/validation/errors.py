''' The errors module defines the error codes and validators for
Bokeh object graphs.

'''

codes = {
    1000: "COLUMN_LENGTHS",
}

for code in codes:
    exec("%s = %d" % (codes[code], code))

texts = {
    COLUMN_LENGTHS: "ColumnDataSource column lengths are not all the same",
}

def error(code):
    def decorator(func):
        def wrapper(models):
            messages = func(models)
            name = codes[code]
            text = texts[code]
            return ["E%d (%s): %s: %s" % (code, name, text, msg) for msg in messages]
        return wrapper
    return decorator

@error(COLUMN_LENGTHS)
def _check_column_lengths(models):
    from ..models.sources import ColumnDataSource
    messages = []
    for model in models:
        if not isinstance(model, ColumnDataSource): continue
        lengths = set(len(x) for x in model.data.values())
        if len(lengths) > 1:
            messages.append(str(model))
    return messages


del error