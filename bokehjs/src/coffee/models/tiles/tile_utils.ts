import {proj4, mercator, wgs84} from "core/util/proj4"

export function geographic_to_meters(xLon: number, yLat: number): [number, number] {
  return proj4(wgs84, mercator, [xLon, yLat])
}

export function meters_to_geographic(mx: number, my: number): [number, number] {
  return proj4(mercator, wgs84, [mx, my])
}

export type Bounds = [number, number, number, number]

export type Extent = [number, number, number, number]

export function geographic_extent_to_meters(extent: Extent): Extent {
  let [xmin, ymin, xmax, ymax] = extent;
  [xmin, ymin] = geographic_to_meters(xmin, ymin);
  [xmax, ymax] = geographic_to_meters(xmax, ymax);
  return [xmin, ymin, xmax, ymax]
}

export function meters_extent_to_geographic(extent: Extent): Extent {
  let [xmin, ymin, xmax, ymax] = extent;
  [xmin, ymin] = meters_to_geographic(xmin, ymin);
  [xmax, ymax] = meters_to_geographic(xmax, ymax);
  return [xmin, ymin, xmax, ymax]
}
