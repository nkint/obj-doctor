import { OBJModel } from '@thi.ng/geom-io-obj';
import { cross3, sub } from '@thi.ng/vectors';
import { Vec } from '@thi.ng/vectors/api';
import { copy } from '@thi.ng/object-utils';

function calculateFaceArea(vertices: Vec[], face: number[]): number {
  if (face.length < 3) return 0.0;

  let area = 0.0;
  const v0 = vertices[face[0]];

  for (let i = 1; i < face.length - 1; i++) {
    const v1 = vertices[face[i]];
    const v2 = vertices[face[i + 1]];

    const edge1 = sub([], v1, v0);
    const edge2 = sub([], v2, v0);

    const crossProduct = cross3([], edge1, edge2);

    area +=
      0.5 *
      Math.sqrt(
        crossProduct[0] * crossProduct[0] +
          crossProduct[1] * crossProduct[1] +
          crossProduct[2] * crossProduct[2],
      );
  }

  return area;
}

function isDegeneratedFace(vertices: Vec[], face: number[]): boolean {
  if (face.length < 3) return true;

  const area = calculateFaceArea(vertices, face);
  return area < 1e-9;
}

export function removeDegeneratedFaces(mesh: OBJModel): OBJModel {
  const { vertices } = mesh;

  const clonedMesh: OBJModel = copy(mesh, Object);

  let removedFaces = 0;

  clonedMesh.objects = clonedMesh.objects.map((obj) => ({
    ...obj,
    groups: obj.groups.map((group) => {
      const newFaces = group.faces.filter((face) => !isDegeneratedFace(vertices, face.v));

      removedFaces += group.faces.length - newFaces.length;

      return {
        ...group,
        faces: newFaces,
      };
    }),
  }));

  console.log(`Removed ${removedFaces} degenerated faces.`);

  return clonedMesh;
}
