renderItem = (item) ->
  _capture ->
    _print _safe '\n  <div class="item">\n    <span class="name">'
    _print item.name
    _print _safe '</span>\n    <span class="price">$'
    _print item.price
    _print _safe '</span>\n  </div>\n'
_print _safe '\n\n'
for item in @items
  _print _safe '\n  '
  _print renderItem item
  _print _safe '\n'
_print _safe '\n'
