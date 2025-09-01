import { OBJFace, OBJModel } from '@thi.ng/geom-io-obj';
import { dot, orthoNormal3 } from '@thi.ng/vectors';
import type { Vec } from '@thi.ng/vectors';
import { copy } from '@thi.ng/object-utils';
import { DEFAULT_COPLANAR_EPSILON } from '../../constants';

type Face = number[];

function faceNormal(vertices: Vec[], face: Face): Vec {
  const a = vertices[face[0]!]!;
  const b = vertices[face[1]!]!;
  const c = vertices[face[2]!]!;

  const n = orthoNormal3([], a, b, c);
  return n;
}

function doMerge(faces: OBJFace[], vertices: Vec[], eps: number): OBJFace[] {
  const merged: OBJFace[] = [];
  const used = new Set<number>();

  for (let i = 0; i < faces.length; i++) {
    if (used.has(i)) continue;
    const f1 = faces[i]!;
    const normal1 = faceNormal(vertices, f1.v);

    for (let j = i + 1; j < faces.length; j++) {
      if (used.has(j)) continue;
      const f2 = faces[j]!;
      const normal2 = faceNormal(vertices, f2.v);

      // check normals are parallel
      if (Math.abs(dot(normal1, normal2)) > 1 - eps) {
        // check 2 vertices in common
        const common = f1.v.filter((v) => f2.v.includes(v));
        if (common.length >= 2) {
          // union
          const unionVerts = Array.from(new Set([...f1.v, ...f2.v]));
          // todo: order around the normal
          console.warn('discard face normals and uv');
          merged.push({ v: unionVerts });
          used.add(i);
          used.add(j);
          continue;
        }
      }
    }

    if (!used.has(i)) merged.push(f1);
  }
  return merged;
}

export function mergeCoplanarFaces(mesh: OBJModel, eps = DEFAULT_COPLANAR_EPSILON): OBJModel {
  const clonedMesh: OBJModel = copy(mesh, Object);

  // Count total original faces
  let totalOriginalFaces = 0;
  let totalMergedFaces = 0;

  clonedMesh.objects = clonedMesh.objects.map((obj) => ({
    ...obj,
    groups: obj.groups.map((group) => {
      totalOriginalFaces += group.faces.length;
      const merged: OBJFace[] = doMerge(group.faces, mesh.vertices, eps);
      totalMergedFaces += merged.length;

      return {
        ...group,
        faces: merged,
      };
    }),
  }));

  const facesMerged = totalOriginalFaces - totalMergedFaces;
  console.log(
    `Merged ${facesMerged} coplanar faces (from ${totalOriginalFaces} to ${totalMergedFaces})`,
  );

  return clonedMesh;
}
