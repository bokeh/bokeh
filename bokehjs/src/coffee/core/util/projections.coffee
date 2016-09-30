proj4 = require "../../common/proj4"
toProjection = proj4.defs('GOOGLE')

project_xy = (x, y) ->
  merc_x_s = []
  merc_y_s = []
  for i in [0...x.length]
    [merc_x, merc_y] = proj4(toProjection, [x[i], y[i]])
    merc_x_s[i] = merc_x
    merc_y_s[i] = merc_y
  return [merc_x_s, merc_y_s]

project_xsys = (xs, ys) ->
  merc_xs_s = []
  merc_ys_s = []
  for i in [0...xs.length]
    [merc_x_s, merc_y_s] = project_xy(xs[i], ys[i])
    merc_xs_s[i] = merc_x_s
    merc_ys_s[i] = merc_y_s
  return [merc_xs_s, merc_ys_s]

module.exports = {
  project_xy: project_xy
  project_xsys: project_xsys
}
