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
// The 1.2.2 sweep, monotone tessellation, and rendering call sites re-read
// half-edge face references after these operations. removeDegenerateFaces_ is
// the exception: it caches the next face, so the adapter preserves deletion
// identity for its one- and two-edge faces below.
const {mesh} = libtess

type MeshOperations = Pick<typeof mesh, "connect" | "meshSplice" | "killFace_">

const upstream_mesh_operations: MeshOperations = {
  connect: mesh.connect,
  meshSplice: mesh.meshSplice,
  killFace_: mesh.killFace_,
}

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

const adapted_mesh_operations: MeshOperations = {
  connect: (eOrg, eDst) => {
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
  },

  meshSplice: (eOrg, eDst) => {
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
  },

  killFace_: (face, replacement) => {
    // removeDegenerateFaces_ caches face.next before deleting a one- or two-edge
    // face. Preserve the requested deletion in that case so the cached face is
    // never the replacement object that this operation unlinks.
    const degenerate = face.anEdge.lNext.lNext === face.anEdge
    if (!degenerate && replacement != null && smaller_loop(face.anEdge, replacement.anEdge) === replacement.anEdge) {
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
  },
}

Object.assign(mesh, adapted_mesh_operations)

/** Run a synchronous check against libtess's original mesh operations. */
export function with_upstream_mesh_operations<T>(fn: () => T): T {
  const current: MeshOperations = {
    connect: mesh.connect,
    meshSplice: mesh.meshSplice,
    killFace_: mesh.killFace_,
  }
  Object.assign(mesh, upstream_mesh_operations)
  try {
    return fn()
  } finally {
    Object.assign(mesh, current)
  }
}

export {libtess}
