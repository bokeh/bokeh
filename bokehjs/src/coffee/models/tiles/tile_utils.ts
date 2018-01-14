/* XXX: partial */
import {proj4, mercator, wgs84} from "core/util/proj4"

export class ProjectionUtils {

  constructor() {
    this.origin_shift = (2 * Math.PI * 6378137) / 2.0;
  }

  geographic_to_meters(xLon, yLat) {
    return  proj4(wgs84, mercator, [xLon, yLat]);
  }

  meters_to_geographic(mx, my) {
    return  proj4(mercator, wgs84, [mx, my]);
  }

  geographic_extent_to_meters(extent) {
    let [xmin, ymin, xmax, ymax] = extent;
    [xmin, ymin] = this.geographic_to_meters(xmin, ymin);
    [xmax, ymax] = this.geographic_to_meters(xmax, ymax);
    return [xmin, ymin, xmax, ymax];
  }

  meters_extent_to_geographic(extent) {
    let [xmin, ymin, xmax, ymax] = extent;
    [xmin, ymin] = this.meters_to_geographic(xmin, ymin);
    [xmax, ymax] = this.meters_to_geographic(xmax, ymax);
    return [xmin, ymin, xmax, ymax];
  }
}
