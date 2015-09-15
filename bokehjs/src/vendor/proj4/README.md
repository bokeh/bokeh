# PROJ4JS [![Build Status](https://travis-ci.org/proj4js/proj4js.svg)](https://travis-ci.org/proj4js/proj4js)

Proj4js is a JavaScript library to transform point coordinates from one coordinate system to another, including datum transformations.
Originally a port of [PROJ.4](http://trac.osgeo.org/proj/) and [GCTCP C](http://edcftp.cr.usgs.gov/pub//software/gctpc) it is
a part of the [MetaCRS](http://wiki.osgeo.org/wiki/MetaCRS) group of projects.

## Installing

Depending on your preferences

```bash
npm install proj4
bower install proj4
jam install proj4
component install proj4js/proj4js
```

or just manually grab the file `proj4.js` from the [latest release](https://github.com/proj4js/proj4js/releases).

if you do not want to download anything, Proj4js is also hosted on [cdnjs](http://www.cdnjs.com/libraries/proj4js) for direct use in your browser applications.

## Using

the basic signature is:

```javascript
proj4(fromProjection[, toProjection, coordinates])
```

Projections can be proj or wkt strings.

Coordinates may an object of the form `{x:x,y:y}` or an array of the form `[x,y]`.

When all 3 arguments  are given, the result is that the coordinates are transformed from projection1 to projection 2. And returned in the same format that they were given in.

```javascript
var firstProjection = 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],AUTHORITY["EPSG","26986"],AXIS["X",EAST],AXIS["Y",NORTH]]';
var secondProjection = "+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
//I'm not going to redefine those two in latter examples.
proj4(firstProjection,secondProjection,[2,5]);
// [-2690666.2977344505, 3662659.885459918]
```

If only 1 projection is given then it is assumed that it is being projected *from* WGS84 (fromProjection is WGS84).

```javascript
proj4(firstProjection,[-71,41]);
// [242075.00535055372, 750123.32090043]
```

If no coordinates are given an object with two methods is returned, its methods are `forward` which projects from the first projection to the second and `inverse` which projects from the second to the first.

```javascript
proj4(firstProjection,secondProjection).forward([2,5]);
// [-2690666.2977344505, 3662659.885459918]
proj4(secondProjection,firstProjection).inverse([2,5]);
// [-2690666.2977344505, 3662659.885459918]
```

and as above if only one projection is given, it's assumed to be coming from wgs84

```javascript
proj4(firstProjection).forward([-71,41]);
// [242075.00535055372, 750123.32090043]
proj4(firstProjection).inverse([242075.00535055372, 750123.32090043]);
//[-71, 40.99999999999986]
//the floating points to answer your question
```

## Named Projections

If you prefer to define a projection as a string and reference it that way, you may use the proj4.defs method which can be called 2 ways, with a name and projection:

```js
proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
```

or with an array

```js
proj4.defs([
  [
    'EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
  [
    'EPSG:4269',
    '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees'
  ]
]);
```

you can then do 

```js
proj4('EPSG:4326');
```

instead of writing out the whole proj definition, by default proj4 has the following projections predefined:

- 'EPSG:4326', which has the following alias
    - 'WGS84'
- 'EPSG:4269'
- 'EPSG:3857', which has the following aliases
    - 'EPSG:3785'
    - 'GOOGLE'
    - 'EPSG:900913'
    - 'EPSG:102113'

defined projections can also be accessed through the proj4.defs function (`proj4.defs('EPSG:4326')`).

proj4.defs can also be used to define a named alias:

```javascript
proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
``` 

## Developing
to set up build tools make sure you have node and grunt-cli installed and then run `npm install`

to do the complete build and browser tests run

```bash
grunt
```

to run node tests run

```bash
npm test
```

to run node tests with coverage run

```bash
node test --coverage
```

to create a build with only default projections (latlon and Mercator) run 

```bash
grunt build
```

to create a build with only custom projections include a comma separated list of projections codes (the file name in 'lib/projections' without the '.js') after a colon, e.g.

```bash
grunt build:tmerc
#includes transverse Mercator
grunt build:lcc
#includes lambert conformal conic
grunt build:omerc,moll
#includes oblique Mercator and Mollweide
```
