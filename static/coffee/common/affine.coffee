

# structure for representing affine transformations
#
# Our representation corresponds to:
#
#   a  b  tx
#   c  d  ty
#   0  0  1

class Affine
  constructor: (@a=1, @b=0, @c=0, @d=1, @tx=0, @ty=0) ->

  apply: (x,y) ->
    return [
      @a * x + @b * y + @tx,
      @c * x + @d * y + @ty
    ]

  v_apply: (xs, ys) ->
    xres = new Float32Array(xs.length)
    yres = new Float32Array(ys.length)
    for i in [0..xs.length-1]
      xres[i] = @a * xs[i] + @b * ys[i] + @tx
      yres[i] = @c * xs[i] + @d * ys[i] + @ty
    return [xres, yres]

  is_identity: () ->
    return @a==1 and @b==0 and @c==0 and @d==1 and @tx==0 and @ty==0

  translate: (tx, ty) ->
    @tx = @a * tx + @b * ty
    @ty = @c * tx + @d * ty

  scale: (sx, sy) ->
    @a *= sx
    @b *= sy
    @c *= sx
    @d *= sy

  rotate: (alpha) ->
    C = Math.cos(alpha)
    S = Math.sin(alpha)
    a = C * @a + S * @b
    b = C * @b - S * @a
    c = C * @c + S * @d
    d = C * @d - S * @c
    @a = a
    @b = b
    @c = c
    @d = d

  shear: (kx, ky) ->
    a = @a + kx * @c
    b = @b + kx * @d
    c = @c + ky * @a
    d = @d + ky * @b
    @a = a
    @b = b
    @c = c
    @d = d

  reflect_x: (x0) ->
    @tx = 2 * @a * x0 + @tx;
    @ty = 2 * @c * x0 + @ty;
    @a = -@a
    @c = -@c

  reflect_y: (y0) ->
    @tx = 2 * @b * y0 + @tx
    @ty = 2 * @d * y0 + @ty
    @b = -@b
    @d = -@d

  reflect_xy: (x0, y0) ->
    @tx = 2 * (@a * x0 + @b * y0) + @tx
    @ty = 2 * (@c * x0 + @d * y0) + @ty
    @a = -@a
    @b = -@b
    @c = -@c
    @d = -@d

  compose_right: (m) ->
    a  = @a * m.a  + @b * m.c
    b  = @a * m.b  + @b * m.d
    c  = @c * m.a  + @d * m.c
    d  = @c * m.b  + @d * m.d
    tx = @a * m.tx + @b * m.ty + @tx
    ty = @c * m.tx + @d * m.ty + @ty
    @a  = a
    @b  = b
    @c  = c
    @d  = d
    @tx = tx
    @ty = ty

  compose_left: (m) ->
    a  = m.a * @a  + m.b * @c
    b  = m.a * @b  + m.b * @d
    c  = m.c * @a  + m.d * @c
    d  = m.c * @b  + m.d * @d
    tx = m.a * @tx + m.b * @ty + m.tx
    ty = m.c * @tx + m.d * @ty + m.ty
    @a  = a
    @b  = b
    @c  = c
    @d  = d
    @tx = tx
    @ty = ty







