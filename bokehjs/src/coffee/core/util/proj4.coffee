import * as proj4 from "proj4/lib/core"

import * as Proj from "proj4/lib/Proj"
import * as toPoint from "proj4/lib/common/toPoint"
import * as defs from "proj4/lib/defs"
import * as transform from "proj4/lib/transform"

proj4.defaultDatum = 'WGS84' # default datum
proj4.WGS84 = new Proj('WGS84')

proj4.Proj = Proj
proj4.toPoint = toPoint
proj4.defs = defs
proj4.transform = transform

export {proj4}

export mercator = defs('GOOGLE')
export wgs84    = defs('WGS84')
