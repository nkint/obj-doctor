import { OBJGroup, OBJModel } from '@thi.ng/geom-io-obj';
import { dist3 } from '@thi.ng/vectors';
import { Vec } from '@thi.ng/vectors/api';
import { copy } from '@thi.ng/object-utils';

export function mergeCloseVertices(mesh: OBJModel, threshold: number = 0.01) {
  const { vertices } = mesh;
  const newVertices: Vec[] = [];
  const map = new Array(vertices.length);

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    let found = -1;

    for (let j = 0; j < newVertices.length; j++) {
      const delta = dist3(v, newVertices[j]);

      if (delta < threshold) {
        found = j;
        break;
      }
    }

    if (found === -1) {
      map[i] = newVertices.length;
      newVertices.push(v);
    } else {
      map[i] = found;
    }
  }

  console.log(`    ${newVertices.length - vertices.length} removed.`);

  const clonedMesh: OBJModel = copy(mesh, Object);
  clonedMesh.vertices = newVertices;

  clonedMesh.objects = clonedMesh.objects.map((obj) => ({
    ...obj,
    groups: obj.groups.map((group) => ({
      ...group,
      faces: group.faces.map((face) => ({
        ...face,
        v: face.v
          .map((idx) => map[idx])
          .filter((idx, i, array) => {
            return i === 0 || idx !== array[i - 1];
          }),
      })),
    })),
  }));

  return clonedMesh;
}
