/*!
 * Adapted from libtess.js: Copyright 2000, Silicon Graphics, Inc.
 * Copyright 2015, Google Inc. All Rights Reserved.
 * Distributed under the SGI Free Software License B, version 2.0:
 * http://oss.sgi.com/projects/FreeB/
 */
import libtess from "libtess/libtess.cat.js"
import type {Face, HalfEdge} from "libtess/libtess.cat.js"

// Adapt libtess 1.2.2's mesh operations to relabel the smaller face loop when
// splitting or joining faces. The upstream choice can repeatedly walk a large
// face for small local changes. These operations preserve the edge topology,
// vertex identities and inside flags; only the surviving face identity differs.
// Use the unminified entry point for stable internal names and pin the version.
// Derived from the mesh operations in libtess's libtess.cat.js distribution.
const {mesh} = libtess

export function smaller_loop(a: HalfEdge, b: HalfEdge): HalfEdge {
  let ea = a.lNext
  let eb = b.lNext
  while (ea !== a && eb !== b) {
    ea = ea.lNext
    eb = eb.lNext
  }
  return ea === a ? a : b
}

function split_face(a: HalfEdge, b: HalfEdge, face: Face): void {
  const edge = smaller_loop(a, b)
  face.anEdge = edge === a ? b : a
  mesh.makeFace_(edge, face)
}

mesh.connect = (eOrg, eDst) => {
  const joining_loops = eDst.lFace !== eOrg.lFace
  const eNew = mesh.makeEdgePair_(eOrg)
  const eNewSym = eNew.sym

  if (joining_loops) {
    mesh.killFace_(eDst.lFace, eOrg.lFace)
  }
  mesh.splice_(eNew, eOrg.lNext)
  mesh.splice_(eNewSym, eDst)
  eNew.org = eOrg.dst()
  eNewSym.org = eDst.org
  const face = eOrg.lFace
  eNew.lFace = eNewSym.lFace = face
  face.anEdge = eNewSym
  if (!joining_loops) {
    split_face(eNew, eNewSym, face)
  }
  return eNew
}

mesh.meshSplice = (eOrg, eDst) => {
  if (eOrg === eDst) {
    return
  }
  const joining_vertices = eDst.org !== eOrg.org
  const joining_loops = eDst.lFace !== eOrg.lFace
  if (joining_vertices) {
    mesh.killVertex_(eDst.org, eOrg.org)
  }
  if (joining_loops) {
    mesh.killFace_(eDst.lFace, eOrg.lFace)
  }
  mesh.splice_(eDst, eOrg)
  if (!joining_vertices) {
    mesh.makeVertex_(eDst, eOrg.org)
    eOrg.org.anEdge = eOrg
  }
  if (!joining_loops) {
    split_face(eDst, eOrg, eOrg.lFace)
  }
}

mesh.killFace_ = (face, replacement) => {
  if (replacement != null && smaller_loop(face.anEdge, replacement.anEdge) === replacement.anEdge) {
    // Retain the target face's classification even when its object is replaced.
    face.inside = replacement.inside
    const previous = face
    face = replacement
    replacement = previous
  }
  const start = face.anEdge
  let edge = start
  do {
    // Null is used only when removing a face entirely, outside the sweep.
    edge.lFace = replacement!
    edge = edge.lNext
  } while (edge !== start)

  face.next.prev = face.prev
  face.prev.next = face.next
}

export {libtess}
