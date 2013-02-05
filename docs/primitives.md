## line properties
 - line_color
 - line_alpha
 - line_width
 - line_join ``miter, round, bevel``
 - line_cap ``butt, square, round``
 - line_dash
 - line_dash_offset (no support currently)

## fill properties
 - fill
 - fill_alpha


vectorized primitive glyphs
===========================

### circle
 - x, y, radius
 - *fill properties*
 - *line properties*

### arc
 - x, y, start_radius, end_radius
 - *line properties*

### quadratic
 - x0, y0, x1, y1, cx, cy
 - *line properties*

### bezier
 - x0, y0, x1, y1, cx1, cy1, cx2, cy2
 - *line properties*

### image
 - image
 - dx, dy, dw, dh
 - sx, sy, sw, sh  # in-image crop

### rect
 - x, y, width, height, angle
 - *fill properties*
 - *line properties*

### quad
 - left, right, bottom, top
 - *fill properties*
 - *line properties*

### wedge
 - x, y, start_radius, end_radius, start_angle, end_angle
 - *fill properties*
 - *line properties*

### segment
 - x, y, angle, length OR x0, y0, x1, y1
 - *line properties*

### text
 - x, y, angle, anchor: (ll, lr, ul, ur)
 - text
 - font, stroke_color, fill_color, align, baseline, alpha

### line
 - xs, ys OR pts    # nans finish strokes, "missing" parts of lines
 - *line properties*

### area
 - xs, ys OR pts    # nans finish strokes, "multi-part" areas
 - *fill properties*
 - *line properties*

