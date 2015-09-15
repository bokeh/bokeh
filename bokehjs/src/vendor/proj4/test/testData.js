var testPoints = [
  {code: 'testmerc',
    xy: [-45007.0787624, 4151725.59875],
    ll: [5.364315,46.623154]
  },
  {code: 'testmerc2',
    xy: [4156404,7480076.5],
    ll: [37.33761240175515, 55.60447049026976]
  },
  {code: 'PROJCS["CH1903 / LV03",GEOGCS["CH1903",DATUM["D_CH1903",SPHEROID["Bessel_1841",6377397.155,299.1528128]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"],PARAMETER["latitude_of_center",46.95240555555556],PARAMETER["longitude_of_center",7.439583333333333],PARAMETER["azimuth",90],PARAMETER["scale_factor",1],PARAMETER["false_easting",600000],PARAMETER["false_northing",200000],UNIT["Meter",1]]',
  xy: [660389.4751110513, 185731.68482649108],
    ll: [8.23, 46.82],
    acc:{
      xy:0.1
    }
  },
   {code: 'PROJCS["CH1903 / LV03",GEOGCS["CH1903",DATUM["CH1903",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],TOWGS84[674.374,15.056,405.346,0,0,0,0],AUTHORITY["EPSG","6149"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4149"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Hotine_Oblique_Mercator"],PARAMETER["latitude_of_center",46.95240555555556],PARAMETER["longitude_of_center",7.439583333333333],PARAMETER["azimuth",90],PARAMETER["rectified_grid_angle",90],PARAMETER["scale_factor",1],PARAMETER["false_easting",600000],PARAMETER["false_northing",200000],AUTHORITY["EPSG","21781"],AXIS["Y",EAST],AXIS["X",NORTH]]',
    xy: [660389.4751110513, 185731.68482649108],
    ll: [8.23, 46.82],
    acc:{
      xy:0.1
    }
  },
  {code: 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],AUTHORITY["EPSG","26986"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    xy: [ 231394.84,902621.11],
    ll: [-71.11881762742996,42.37346263960867]
  },
  {code: 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],UNIT["Meter",1]]',
    xy: [ 231394.84,902621.11],
    ll: [-71.11881762742996,42.37346263960867]
  },
  {code:'["PROJCS","NAD83 / Massachusetts Mainland", GEOGCS["NAD83", DATUM["North American Datum 1983", SPHEROID["GRS 1980", 6378137.0, 298.257222101, AUTHORITY["EPSG","7019"]], TOWGS84[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], AUTHORITY["EPSG","6269"]], PRIMEM["Greenwich", 0.0, AUTHORITY["EPSG","8901"]], UNIT["degree", 0.017453292519943295], AXIS["Geodetic longitude", EAST], AXIS["Geodetic latitude", NORTH], AUTHORITY["EPSG","4269"]], PROJECTION["Lambert_Conformal_Conic_2SP", AUTHORITY["EPSG","9802"]], PARAMETER["central_meridian", -71.5], PARAMETER["latitude_of_origin", 41.0], PARAMETER["standard_parallel_1", 42.68333333333334], PARAMETER["false_easting", 200000.0], PARAMETER["false_northing", 750000.0], PARAMETER["scale_factor", 1.0], PARAMETER["standard_parallel_2", 41.71666666666667], UNIT["m", 1.0], AXIS["Easting", EAST], AXIS["Northing", NORTH], AUTHORITY["EPSG","26986"]]',
   xy: [ 231394.84,902621.11],
    ll: [-71.11881762742996,42.37346263960867]
  },
  {code: 'PROJCS["Asia_North_Equidistant_Conic",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Equidistant_Conic"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",95],PARAMETER["Standard_Parallel_1",15],PARAMETER["Standard_Parallel_2",65],PARAMETER["Latitude_Of_Origin",30],UNIT["Meter",1]]',
    xy: [88280.59904432714, 111340.90165417176],
    ll: [96,31]
  },
  {code: 'PROJCS["Asia_North_Equidistant_Conic",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Equidistant_Conic"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",95],PARAMETER["Standard_Parallel_1",15],PARAMETER["Standard_Parallel_2",65],PARAMETER["Latitude_Of_Origin",30],UNIT["Meter",1],AUTHORITY["EPSG","102026"]]',
    xy: [88280.59904432714, 111340.90165417176],
    ll: [96,31]
  },
  {code: 'PROJCS["World_Sinusoidal",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Sinusoidal"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","54008"]]',
    xy: [738509.49,5874620.38],
    ll: [11.0, 53.0]
  },
  {code: 'PROJCS["World_Sinusoidal",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Sinusoidal"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    xy: [738509.49,5874620.38],
    ll: [11.0, 53.0]
  },
  {code: 'PROJCS["ETRS89 / ETRS-LAEA",GEOGCS["ETRS89",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Azimuthal_Equal_Area"],PARAMETER["latitude_of_origin",52],PARAMETER["central_meridian",10],PARAMETER["false_easting",4321000],PARAMETER["false_northing",3210000],UNIT["Meter",1]]',
    xy: [4388138.60, 3321736.46],
    ll: [11.0, 53.0]
  },
  {code: 'PROJCS["ETRS89 / ETRS-LAEA",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6258"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4258"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Azimuthal_Equal_Area"],PARAMETER["latitude_of_center",52],PARAMETER["longitude_of_center",10],PARAMETER["false_easting",4321000],PARAMETER["false_northing",3210000],AUTHORITY["EPSG","3035"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    xy: [4388138.60, 3321736.46],
    ll: [11.0, 53.0]
  },
  {code: 'EPSG:102018',
    xy: [350577.5930806119, 4705857.070634324],
    ll: [-75,46]
  }, {code: '+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
    xy: [350577.5930806119, 4705857.070634324],
    ll: [-75,46]
  },
  {code: 'PROJCS["NAD83(CSRS) / UTM zone 17N",GEOGCS["NAD83(CSRS)",DATUM["D_North_American_1983_CSRS98",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-81],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    xy: [411461.807497, 4700123.744402],
    ll: [-82.07666015625, 42.448388671875]
  },{code: 'PROJCS["NAD83(CSRS) / UTM zone 17N",GEOGCS["NAD83(CSRS)",DATUM["NAD83_Canadian_Spatial_Reference_System",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6140"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4617"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-81],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],AUTHORITY["EPSG","2958"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    xy: [411461.807497, 4700123.744402],
    ll: [-82.07666015625, 42.448388671875]
  },
  {code: 'PROJCS["World_Mollweide",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mollweide"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","54009"]]',
    xy: [3891383.58309223, 6876758.9933288],
    ll: [60,60]
  },
   {code: 'PROJCS["World_Mollweide",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mollweide"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    xy: [3891383.58309223, 6876758.9933288],
    ll: [60,60]
  },
  {
    code:'PROJCS["NAD83 / BC Albers",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Albers_Conic_Equal_Area"],PARAMETER["standard_parallel_1",50],PARAMETER["standard_parallel_2",58.5],PARAMETER["latitude_of_center",45],PARAMETER["longitude_of_center",-126],PARAMETER["false_easting",1000000],PARAMETER["false_northing",0],AUTHORITY["EPSG","3005"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll:[-126.54, 54.15],
    xy:[964813.103719, 1016486.305862]
  }, {
    code:'PROJCS["NAD83 / BC Albers",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Albers"],PARAMETER["standard_parallel_1",50],PARAMETER["standard_parallel_2",58.5],PARAMETER["latitude_of_origin",45],PARAMETER["central_meridian",-126],PARAMETER["false_easting",1000000],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll:[-126.54, 54.15],
    xy:[964813.103719, 1016486.305862]
  },
  {
    code:'PROJCS["North_Pole_Azimuthal_Equidistant",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Latitude_Of_Origin",90],UNIT["Meter",1]]',
    ll:[50.977303830208, 30.915260093747],
    xy:[5112279.911077, -4143196.76625]
  },
  {
    code:'PROJCS["North_Pole_Azimuthal_Equidistant",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Latitude_Of_Origin",90],UNIT["Meter",1],AUTHORITY["EPSG","102016"]]',
    ll:[50.977303830208, 30.915260093747],
    xy:[5112279.911077, -4143196.76625]
  },
  {
    code:'PROJCS["Mount Dillon / Tobago Grid",GEOGCS["Mount Dillon",DATUM["Mount_Dillon",SPHEROID["Clarke 1858",6378293.645208759,294.2606763692654,AUTHORITY["EPSG","7007"]],AUTHORITY["EPSG","6157"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4157"]],UNIT["Clarke\'s link",0.201166195164,AUTHORITY["EPSG","9039"]],PROJECTION["Cassini_Soldner"],PARAMETER["latitude_of_origin",11.25217861111111],PARAMETER["central_meridian",-60.68600888888889],PARAMETER["false_easting",187500],PARAMETER["false_northing",180000],AUTHORITY["EPSG","2066"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll:[-60.676753018, 11.2487234308],
    xy:[192524.3061766178, 178100.2740019509],
    acc:{
      ll:1,
      xy:-4
    }
  }, {
    code:'PROJCS["Mount Dillon / Tobago Grid",GEOGCS["Mount Dillon",DATUM["D_Mount_Dillon",SPHEROID["Clarke_1858",6378293.645208759,294.2606763692654]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Cassini"],PARAMETER["latitude_of_origin",11.25217861111111],PARAMETER["central_meridian",-60.68600888888889],PARAMETER["false_easting",187500],PARAMETER["false_northing",180000],UNIT["Clarke\'s link",0.201166195164]]',
    ll:[-60.676753018, 11.2487234308],
    xy:[192524.3061766178, 178100.2740019509],
    acc:{
      ll:1,
      xy:-4
    }
  },
    /*{
    code:'EPSG:3975',
    ll:[-9.764450683, 25.751953],
    xy:[-942135.525095996, 3178441.8667094777]
  },*/
   {
    code:'PROJCS["World Equidistant Cylindrical (Sphere)",GEOGCS["Unspecified datum based upon the GRS 1980 Authalic Sphere",DATUM["Not_specified_based_on_GRS_1980_Authalic_Sphere",SPHEROID["GRS 1980 Authalic Sphere",6371007,0,AUTHORITY["EPSG","7048"]],AUTHORITY["EPSG","6047"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4047"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Equirectangular"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AUTHORITY["EPSG","3786"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll:[-1.7539371169976, 12.632997701986],
    xy:[-195029.12334755991, 1395621.9368162225],
    acc:{
      ll:2
    }
  }, {
    code:'PROJCS["World Equidistant Cylindrical (Sphere)",GEOGCS["Unspecified datum based upon the GRS 1980 Authalic Sphere",DATUM["D_",SPHEROID["GRS_1980_Authalic_Sphere",6371007,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Equidistant_Cylindrical"],PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll:[-1.7539371169976, 12.632997701986],
    xy:[-195029.12334755991, 1395621.9368162225],
    acc:{
      ll:2
    }
  },
  {
    code:'PROJCS["Segara / NEIEZ",GEOGCS["Segara",DATUM["Gunung_Segara",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],AUTHORITY["EPSG","6613"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4613"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",110],PARAMETER["scale_factor",0.997],PARAMETER["false_easting",3900000],PARAMETER["false_northing",900000],AUTHORITY["EPSG","3000"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll:[116.65547897884308 , -0.6595605286983485],
    xy:[4638523.040740433, 827245.2586932715]
  }, {
    code:'PROJCS["Segara / NEIEZ",GEOGCS["Segara",DATUM["D_Gunung_Segara",SPHEROID["Bessel_1841",6377397.155,299.1528128]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mercator"],PARAMETER["central_meridian",110],PARAMETER["scale_factor",0.997],PARAMETER["false_easting",3900000],PARAMETER["false_northing",900000],UNIT["Meter",1]]',
    ll:[116.65547897884308 , -0.6595605286983485],
    xy:[4638523.040740433, 827245.2586932715]
  },
  {
    code:'PROJCS["Beduaram / TM 13 NE",GEOGCS["Beduaram",DATUM["Beduaram",SPHEROID["Clarke 1880 (IGN)",6378249.2,293.4660212936269,AUTHORITY["EPSG","7011"]],TOWGS84[-106,-87,188,0,0,0,0],AUTHORITY["EPSG","6213"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4213"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",13],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],AUTHORITY["EPSG","2931"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll:[5, 25],
    xy:[-308919.1462828873, 2788738.252386554],
    acc:{
      ll:5
    }
  },
   {
    code:'PROJCS["Beduaram / TM 13 NE",GEOGCS["Beduaram",DATUM["D_Beduaram",SPHEROID["Clarke_1880_IGN",6378249.2,293.4660212936269]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",13],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll:[5, 25],
    xy:[-308919.1462828873, 2788738.252386554],
    acc:{
      ll:5
    }
  }
  ,{
    code:'PROJCS["S-JTSK (Ferro) / Krovak",GEOGCS["S-JTSK (Ferro)",DATUM["S_JTSK_Ferro",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],AUTHORITY["EPSG","6818"]],PRIMEM["Ferro",-17.66666666666667,AUTHORITY["EPSG","8909"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4818"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Krovak"],PARAMETER["latitude_of_center",49.5],PARAMETER["longitude_of_center",42.5],PARAMETER["azimuth",30.28813972222222],PARAMETER["pseudo_standard_parallel_1",78.5],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AUTHORITY["EPSG","2065"],AXIS["Y",WEST],AXIS["X",SOUTH]]',
    ll:[17.323583231075897, 49.39440725405376],
    xy:[-544115.474379, -1144058.330762]
  },{
    code:'PROJCS["S-JTSK (Ferro) / Krovak",GEOGCS["S-JTSK (Ferro)",DATUM["D_S_JTSK",SPHEROID["Bessel_1841",6377397.155,299.1528128]],PRIMEM["Ferro",-17.66666666666667],UNIT["Degree",0.017453292519943295]],PROJECTION["Krovak"],PARAMETER["latitude_of_center",49.5],PARAMETER["longitude_of_center",42.5],PARAMETER["azimuth",30.28813972222222],PARAMETER["pseudo_standard_parallel_1",78.5],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll:[17.323583231075897, 49.39440725405376],
    xy:[-544115.474379, -1144058.330762]
  },{
    code:'PROJCS["Sphere_Miller_Cylindrical",GEOGCS["GCS_Sphere",DATUM["D_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Miller_Cylindrical"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    ll:[-1.3973289073953, 12.649176474268513  ],
    xy:[-155375.88535614178, 1404635.2633403721],
    acc:{
      ll:3
    }
  },{
    code:'PROJCS["Sphere_Miller_Cylindrical",GEOGCS["GCS_Sphere",DATUM["Not_specified_based_on_Authalic_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Miller_Cylindrical"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","53003"]]',
    ll:[-1.3973289073953, 12.649176474268513  ],
    xy:[-155375.88535614178, 1404635.2633403721],
    acc:{
      ll:3
    }
  },{
    code:'PROJCS["NZGD49 / New Zealand Map Grid",GEOGCS["NZGD49",DATUM["D_New_Zealand_1949",SPHEROID["International_1924",6378388,297]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["New_Zealand_Map_Grid"],PARAMETER["latitude_of_origin",-41],PARAMETER["central_meridian",173],PARAMETER["false_easting",2510000],PARAMETER["false_northing",6023150],UNIT["Meter",1]]',
    ll:[172.465, -40.7],
    xy:[2464770.343667, 6056137.861919]
  },{
    code:'PROJCS["NZGD49 / New Zealand Map Grid",GEOGCS["NZGD49",DATUM["New_Zealand_Geodetic_Datum_1949",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993],AUTHORITY["EPSG","6272"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4272"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["New_Zealand_Map_Grid"],PARAMETER["latitude_of_origin",-41],PARAMETER["central_meridian",173],PARAMETER["false_easting",2510000],PARAMETER["false_northing",6023150],AUTHORITY["EPSG","27200"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll:[172.465, -40.7],
    xy:[2464770.343667, 6056137.861919]
  },{
    code:'PROJCS["Rassadiran / Nakhl e Taqi",GEOGCS["Rassadiran",DATUM["Rassadiran",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[-133.63,-157.5,-158.62,0,0,0,0],AUTHORITY["EPSG","6153"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4153"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Hotine_Oblique_Mercator"],PARAMETER["latitude_of_center",27.51882880555555],PARAMETER["longitude_of_center",52.60353916666667],PARAMETER["azimuth",0.5716611944444444],PARAMETER["rectified_grid_angle",0.5716611944444444],PARAMETER["scale_factor",0.999895934],PARAMETER["false_easting",658377.437],PARAMETER["false_northing",3044969.194],AUTHORITY["EPSG","2057"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll:[52.6, 27.5],
    xy:[658017.25458, 3043003.058818]
  },{
    code:'PROJCS["Rassadiran / Nakhl e Taqi",GEOGCS["Rassadiran",DATUM["D_Rassadiran",SPHEROID["International_1924",6378388,297]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Hotine_Oblique_Mercator_Azimuth_Natural_Origin"],PARAMETER["latitude_of_center",27.51882880555555],PARAMETER["longitude_of_center",52.60353916666667],PARAMETER["azimuth",0.5716611944444444],PARAMETER["rectified_grid_angle",0.5716611944444444],PARAMETER["scale_factor",0.999895934],PARAMETER["false_easting",658377.437],PARAMETER["false_northing",3044969.194],UNIT["Meter",1]]',
    ll:[52.6, 27.5],
    xy:[658017.25458, 3043003.058818]
  },{
    code:'PROJCS["SAD69 / Brazil Polyconic",GEOGCS["SAD69",DATUM["D_South_American_1969",SPHEROID["GRS_1967_SAD69",6378160,298.25]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Polyconic"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-54],PARAMETER["false_easting",5000000],PARAMETER["false_northing",10000000],UNIT["Meter",1]]',
    ll:[-49.221772553812, -0.34551739237581],
    xy:[5531902.134932, 9961660.779347],
    acc:{
      ll:3,
      xy:-2
    }
  },{
    code:'PROJCS["SAD69 / Brazil Polyconic",GEOGCS["SAD69",DATUM["South_American_Datum_1969",SPHEROID["GRS 1967 (SAD69)",6378160,298.25,AUTHORITY["EPSG","7050"]],AUTHORITY["EPSG","6618"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4618"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Polyconic"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-54],PARAMETER["false_easting",5000000],PARAMETER["false_northing",10000000],AUTHORITY["EPSG","29101"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll:[-49.221772553812, -0.34551739237581],
    xy:[5531902.134932, 9961660.779347],
    acc:{
      ll:3,
      xy:-2
    }
  },{
    code:'PROJCS["WGS 84 / UPS North",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",0],PARAMETER["scale_factor",0.994],PARAMETER["false_easting",2000000],PARAMETER["false_northing",2000000],AUTHORITY["EPSG","32661"],AXIS["Easting",UNKNOWN],AXIS["Northing",UNKNOWN]]',
    ll:[0, 75],
    xy:[2000000, 325449.806286]
  },{
    code:'PROJCS["WGS 84 / UPS North",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Stereographic_North_Pole"],PARAMETER["standard_parallel_1",90],PARAMETER["central_meridian",0],PARAMETER["scale_factor",0.994],PARAMETER["false_easting",2000000],PARAMETER["false_northing",2000000],UNIT["Meter",1]]',
    ll:[0, 75],
    xy:[2000000, 325449.806286]
  },{
    code:'+proj=stere +lat_0=-90 +lat_ts=-70 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"',
    ll:[0, -72.5],
    xy:[0, 1910008.78441421]
  },{
    code:'PROJCS["WGS 84 / NSIDC Sea Ice Polar Stereographic South", GEOGCS["WGS 84", DATUM["World Geodetic System 1984", SPHEROID["WGS 84", 6378137.0, 298.257223563, AUTHORITY["EPSG","7030"]], AUTHORITY["EPSG","6326"]], PRIMEM["Greenwich", 0.0, AUTHORITY["EPSG","8901"]], UNIT["degree", 0.017453292519943295], AXIS["Geodetic longitude", EAST], AXIS["Geodetic latitude", NORTH], AUTHORITY["EPSG","4326"]], PROJECTION["Polar Stereographic (variant B)", AUTHORITY["EPSG","9829"]], PARAMETER["central_meridian", 0.0], PARAMETER["Standard_Parallel_1", -70.0], PARAMETER["false_easting", 0.0], PARAMETER["false_northing", 0.0], UNIT["m", 1.0], AXIS["Easting", "North along 90 deg East"], AXIS["Northing", "North along 0 deg"], AUTHORITY["EPSG","3976"]]',
    ll:[0, -72.5],
    xy:[0, 1910008.78441421]
  },{
    code:'PROJCS["NAD83(CSRS98) / New Brunswick Stereo (deprecated)",GEOGCS["NAD83(CSRS98)",DATUM["D_North_American_1983_CSRS98",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Stereographic_North_Pole"],PARAMETER["standard_parallel_1",46.5],PARAMETER["central_meridian",-66.5],PARAMETER["scale_factor",0.999912],PARAMETER["false_easting",2500000],PARAMETER["false_northing",7500000],UNIT["Meter",1]]',
    ll:[-66.415, 46.34],
    xy:[2506543.370459, 7482219.546176]
  },{
    code:'PROJCS["NAD83(CSRS98) / New Brunswick Stereo (deprecated)",GEOGCS["NAD83(CSRS98)",DATUM["NAD83_Canadian_Spatial_Reference_System",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6140"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9108"]],AUTHORITY["EPSG","4140"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Oblique_Stereographic"],PARAMETER["latitude_of_origin",46.5],PARAMETER["central_meridian",-66.5],PARAMETER["scale_factor",0.999912],PARAMETER["false_easting",2500000],PARAMETER["false_northing",7500000],AUTHORITY["EPSG","2036"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll:[-66.415, 46.34],
    xy:[2506543.370459, 7482219.546176]
  },{
    code:'PROJCS["Sphere_Van_der_Grinten_I",GEOGCS["GCS_Sphere",DATUM["D_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Van_der_Grinten_I"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    ll:[-1.41160801956, 67.40891366748],
    xy:[-125108.675828, 9016899.042114],
    acc:{
      ll:0,
      xy:-5
    }
  },{
    code:'PROJCS["Sphere_Van_der_Grinten_I",GEOGCS["GCS_Sphere",DATUM["Not_specified_based_on_Authalic_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["VanDerGrinten"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","53029"]]',
    ll:[-1.41160801956, 67.40891366748],
    xy:[-125108.675828, 9016899.042114],
    acc:{
      ll:0,
      xy:-5
    }
  },{
    code:'PROJCS["NAD_1983_StatePlane_New_Jersey_FIPS_2900_Feet",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",492125.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-74.5],PARAMETER["Scale_Factor",0.9999],PARAMETER["Latitude_Of_Origin",38.83333333333334],UNIT["Foot_US",0.3048006096012192]]',
    ll:[-74,41],
    xy:[630128.205,789591.522]
  },
  {
    code:'esriOnline',
    ll:[-74,41],
    xy:[-8237642.318702244, 5012341.663847514]
  },{
    code:"+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +datum=none +no_defs",
     xy: [ 736106.55, 5893331.11 ],
      ll: [11.0, 53.0]
  },
  {
    code:'PROJCS["Belge 1972 / Belgian Lambert 72",GEOGCS["Belge 1972",DATUM["Reseau_National_Belge_1972",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1],AUTHORITY["EPSG","6313"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4313"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",51.16666723333333],PARAMETER["standard_parallel_2",49.8333339],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",4.367486666666666],PARAMETER["false_easting",150000.013],PARAMETER["false_northing",5400088.438],AUTHORITY["EPSG","31370"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    xy:[104588.196404, 193175.582367],
    ll:[3.7186701465384533,51.04642936832842]
  },
  {
    code:'PROJCS["Belge 1972 / Belgian Lambert 72",GEOGCS["Belge 1972",DATUM["D_Belge_1972",SPHEROID["International_1924",6378388,297]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["standard_parallel_1",51.16666723333333],PARAMETER["standard_parallel_2",49.8333339],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",4.367486666666666],PARAMETER["false_easting",150000.013],PARAMETER["false_northing",5400088.438],UNIT["Meter",1]]',
    xy:[104588.196404, 193175.582367],
    ll:[3.7186701465384533,51.04642936832842]
  },
  {
    code:'+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1 +units=m +no_defs ',
    xy:[104588.196404, 193175.582367],
    ll:[3.7186701465384533,51.04642936832842]
  },
  {
    code:"+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs",
    ll:[-3.20078, 55.96056],
    xy:[325132.0089586496, 674822.638235305]
  },
  {
    code:"+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +pm=greenwich +units=m +no_defs +towgs84=570.8,85.7,462.8,4.998,1.587,5.261,3.56",
    ll: [12.806988, 49.452262],
    xy: [-868208.61, -1095793.64]
  },
  {
    code:"+proj=tmerc +lat_0=40.5 +lon_0=-110.0833333333333 +k=0.9999375 +x_0=800000.0000101599 +y_0=99999.99998983997 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs",
    ll: [-110.8, 43.5],
    xy: [2434515.870, 1422072.711]
  },
  // check that coordinates at 180 and -180 deg. longitude don't wrap around
  {
    code: 'EPSG:3857',
    ll: [-180, 0],
    xy: [-20037508.342789, 0]
  },
  {
    code: 'EPSG:3857',
    ll: [180, 0],
    xy: [20037508.342789, 0]
  }
];
if(typeof module !== 'undefined'){
  module.exports = testPoints;
}else if(typeof define === 'function'){
  define(function(){
    return testPoints;
  });
}
