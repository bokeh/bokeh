for item in @items
  _print _safe '\n  '
  _print @contentTag "div", class: "item", =>
    _capture =>
      _print _safe '\n    '
      _print @contentTag "span", class: "price", ->
        _capture ->
          _print _safe '$'
          _print item.price
      _print _safe '\n    '
      _print @contentTag "span", class: "name", ->
        _capture ->
          _print item.name
      _print _safe '\n  '
  _print _safe '\n'
_print _safe '\n'
