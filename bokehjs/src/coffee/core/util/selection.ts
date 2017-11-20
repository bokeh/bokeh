export get_indices = (data_source) ->
  selected = data_source.selected

  if selected['0d'].glyph
    selected['0d'].indices
  else if selected['1d'].indices.length > 0
    selected['1d'].indices
  else if selected['2d'].indices.length > 0
    selected['2d'].indices
  else
    []
