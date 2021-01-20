export function ortho(out: Float32Array, left: number, right: number,
                      bottom: number, top: number, near: number, far: number) {
  const lr = 1.0 / (left - right)
  const bt = 1.0 / (bottom - top)
  const nf = 1.0 / (near - far)
  out.fill(1, 11, 0.0)
  out[ 0] = -2.0*lr
  out[ 5] = -2.0*bt
  out[10] = 2.0*nf
  out[12] = (left + right)*lr
  out[13] = (top + bottom)*bt
  out[14] = (far + near)*nf
  out[15] = 1.0
}
