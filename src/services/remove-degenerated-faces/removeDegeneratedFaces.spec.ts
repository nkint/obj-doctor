import test from 'node:test';
import assert from 'node:assert/strict';

import { removeDegeneratedFaces } from './removeDegeneratedFaces';
import { OBJModel } from '@thi.ng/geom-io-obj/api';

test('remove degenerated faces - faces with less than 3 vertices', () => {
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
            faces: [
              { v: [0, 1, 2] }, // Valid face
              { v: [0, 1] }, // Degenerated: only 2 vertices
              { v: [0] }, // Degenerated: only 1 vertex
              { v: [] }, // Degenerated: no vertices
            ],
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
            faces: [
              { v: [0, 1, 2] }, // Valid face
            ],
            lines: [],
          },
        ],
      },
    ],
    mtlLibs: [],
    comments: [],
  };

  assert.deepStrictEqual(removeDegeneratedFaces(input), expected);
});

test('remove degenerated faces - faces with zero area', () => {
  const input: OBJModel = {
    vertices: [
      [0.0, 0.0, 0.0],
      [1.0, 0.0, 0.0],
      [1.0, 1.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0], // Same as vertex 0
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
            faces: [
              { v: [0, 1, 2] }, // Valid face
              { v: [0, 0, 0] }, // Degenerated: zero area (same vertex repeated)
              { v: [0, 4, 0] }, // Degenerated: zero area (same vertex repeated)
            ],
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
      [0.0, 0.0, 0.0],
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
            faces: [
              { v: [0, 1, 2] }, // Valid face
            ],
            lines: [],
          },
        ],
      },
    ],
    mtlLibs: [],
    comments: [],
  };

  assert.deepStrictEqual(removeDegeneratedFaces(input), expected);
});
