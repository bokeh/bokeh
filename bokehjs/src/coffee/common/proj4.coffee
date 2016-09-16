module.exports = proj4 = require('proj4/lib/core')
proj4.defaultDatum = 'WGS84' # default datum
proj4.Proj = require('proj4/lib/Proj')
proj4.WGS84 = new proj4.Proj('WGS84')
proj4.toPoint = require('proj4/lib/common/toPoint')
proj4.defs = require('proj4/lib/defs')
proj4.transform = require('proj4/lib/transform')

###
projs = [
  require('proj4/lib/projections/tmerc')
  require('proj4/lib/projections/utm')
  require('proj4/lib/projections/sterea')
  require('proj4/lib/projections/stere')
  require('proj4/lib/projections/somerc')
  require('proj4/lib/projections/omerc')
  require('proj4/lib/projections/lcc')
  require('proj4/lib/projections/krovak')
  require('proj4/lib/projections/cass')
  require('proj4/lib/projections/laea')
  require('proj4/lib/projections/aea')
  require('proj4/lib/projections/gnom')
  require('proj4/lib/projections/cea')
  require('proj4/lib/projections/eqc')
  require('proj4/lib/projections/poly')
  require('proj4/lib/projections/nzmg')
  require('proj4/lib/projections/mill')
  require('proj4/lib/projections/sinu')
  require('proj4/lib/projections/moll')
  require('proj4/lib/projections/eqdc')
  require('proj4/lib/projections/vandg')
  require('proj4/lib/projections/aeqd')
]

for proj in projs
  proj4.Proj.projections.add(proj)
###
