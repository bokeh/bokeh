import * as proj4 from "proj4/lib/core";

import * as Proj from "proj4/lib/Proj";
import * as toPoint from "proj4/lib/common/toPoint";
import * as defs from "proj4/lib/defs";
import * as transform from "proj4/lib/transform"
;

proj4.defaultDatum = 'WGS84'; // default datum
proj4.WGS84 = new Proj('WGS84');

proj4.Proj = Proj;
proj4.toPoint = toPoint;
proj4.defs = defs;
proj4.transform = transform;

export {proj4};

export const mercator = defs('GOOGLE');
export const wgs84    = defs('WGS84');

export const mercator_bounds = {
  lon: [-20026376.39, 20026376.39],
  lat: [-20048966.10, 20048966.10]
};

const latlon_bounds = {
  lon: [-180, 180],
  lat: [-85.06, 85.06]
};

export const clip_mercator = function(low, high, dimension) {
  const [min, max] = mercator_bounds[dimension];
  return [Math.max(low, min), Math.min(high, max)];
};

export const in_bounds = (value, dimension) => (value > latlon_bounds[dimension][0]) && (value < latlon_bounds[dimension][1]);
