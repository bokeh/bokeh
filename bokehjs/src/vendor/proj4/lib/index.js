var proj4 = require('./core');
proj4.defaultDatum = 'WGS84'; //default datum
proj4.Proj = require('./Proj');
proj4.WGS84 = new proj4.Proj('WGS84');
proj4.Point = require('./Point');
proj4.toPoint = require("./common/toPoint");
proj4.defs = require('./defs');
proj4.transform = require('./transform');
proj4.mgrs = require('mgrs');
proj4.version = require('../package.json').version;
require('./includedProjections')(proj4);
module.exports = proj4;