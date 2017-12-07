export function get_indices(data_source: any): any {
  const selected = data_source.selected

  if (selected['0d'].glyph)
    return selected['0d'].indices
  else if (selected['1d'].indices.length > 0)
    return selected['1d'].indices
  else if (selected['2d'].indices.length > 0)
    return selected['2d'].indices
  else
    return []
}
