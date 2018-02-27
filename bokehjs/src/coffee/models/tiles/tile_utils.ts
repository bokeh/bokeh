import {wgs84_mercator} from "core/util/projections"

export function geographic_to_meters(xLon: number, yLat: number): [number, number] {
  return wgs84_mercator.forward([xLon, yLat])
}

export function meters_to_geographic(mx: number, my: number): [number, number] {
  return wgs84_mercator.inverse([mx, my])
}

export type Bounds = [number, number, number, number]

export type Extent = [number, number, number, number]

export function geographic_extent_to_meters(extent: Extent): Extent {
  const [g_xmin, g_ymin, g_xmax, g_ymax] = extent
  const [m_xmin, m_ymin] = geographic_to_meters(g_xmin, g_ymin)
  const [m_xmax, m_ymax] = geographic_to_meters(g_xmax, g_ymax)
  return [m_xmin, m_ymin, m_xmax, m_ymax]
}

export function meters_extent_to_geographic(extent: Extent): Extent {
  const [m_xmin, m_ymin, m_xmax, m_ymax] = extent
  const [g_xmin, g_ymin] = meters_to_geographic(m_xmin, m_ymin)
  const [g_xmax, g_ymax] = meters_to_geographic(m_xmax, m_ymax)
  return [g_xmin, g_ymin, g_xmax, g_ymax]
}
