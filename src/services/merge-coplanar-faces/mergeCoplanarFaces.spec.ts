import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeCoplanarFaces } from './mergeCoplanarFaces';
import { OBJModel } from '@thi.ng/geom-io-obj/api';

test('merge close vertices', () => {
  const input: OBJModel = {
    vertices: [
      [0.0, 0.0, 0.0],
      [1.0, 0.0, 0.0],
      [1.0, 1.0, 0.0],
      [0.0, 1.0, 0.0],
    ],
    normals: [],
    uvs: [],
    objects: [
      {
        id: 'default',
        groups: [
          {
            id: 'default',
            smooth: false,
            faces: [{ v: [0, 1, 2] }, { v: [0, 2, 3] }],
            lines: [],
          },
        ],
      },
    ],
    mtlLibs: [],
    comments: [],
  };

  const expected: OBJModel = {
    vertices: [
      [0.0, 0.0, 0.0],
      [1.0, 0.0, 0.0],
      [1.0, 1.0, 0.0],
      [0.0, 1.0, 0.0],
    ],
    normals: [],
    uvs: [],
    objects: [
      {
        id: 'default',
        groups: [
          {
            id: 'default',
            smooth: false,
            faces: [{ v: [0, 1, 2, 3] }],
            lines: [],
          },
        ],
      },
    ],
    mtlLibs: [],
    comments: [],
  };

  assert.deepStrictEqual(mergeCoplanarFaces(input), expected);
});
