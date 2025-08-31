import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeCloseVertices } from './mergeCloseVertices';
import { OBJModel } from '@thi.ng/geom-io-obj';

test('merge close vertices', () => {
  const input: OBJModel = {
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0.0005, 0, 0],
      [1, 1, 0],
      [2, 1, 0],
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
            faces: [{ v: [0, 1, 2] }, { v: [3, 4, 5] }],
            lines: [],
          },
        ],
      },
    ],
    mtlLibs: [],
    comments: [],
  };

  const result = mergeCloseVertices(input);

  // Check that vertices are properly merged
  assert.deepStrictEqual(result.vertices, [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [2, 1, 0],
  ]);

  // Check that faces are properly updated with new indices
  assert.deepStrictEqual(result.objects[0].groups[0].faces, [{ v: [0, 1, 2] }, { v: [0, 3, 4] }]);

  // Check that the result is an OBJModel
  assert.ok('objects' in result);
  assert.ok('vertices' in result);
  assert.ok('normals' in result);
  assert.ok('uvs' in result);
  assert.ok('mtlLibs' in result);
  assert.ok('comments' in result);
});

test('filter removes consecutive duplicate vertex indices in faces', () => {
  const input: OBJModel = {
    vertices: [
      [0, 0, 0],
      [0.0005, 0, 0], // Close to vertex 0
      [1, 0, 0],
      [0, 1, 0],
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
              { v: [0, 1, 2, 3] }, // Face with vertices that will be merged
              { v: [1, 0, 2, 1] }, // Face with potential consecutive duplicates
            ],
            lines: [],
          },
        ],
      },
    ],
    mtlLibs: [],
    comments: [],
  };

  const result = mergeCloseVertices(input, 0.01);

  // Check that vertices are properly merged (vertex 1 merges with vertex 0)
  assert.deepStrictEqual(result.vertices, [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ]);

  // Check that faces are properly updated and consecutive duplicates are filtered
  // First face: [0, 1, 2, 3] -> [0, 0, 1, 2] -> [0, 1, 2] (duplicate 0 removed)
  // Second face: [1, 0, 2, 1] -> [0, 0, 1, 0] -> [0, 1, 0] (consecutive duplicates removed)
  assert.deepStrictEqual(result.objects[0].groups[0].faces, [{ v: [0, 1, 2] }, { v: [0, 1, 0] }]);

  // Verify that no consecutive duplicate indices exist in any face
  result.objects[0].groups[0].faces.forEach((face) => {
    for (let i = 1; i < face.v.length; i++) {
      assert.notStrictEqual(
        face.v[i],
        face.v[i - 1],
        `Face should not have consecutive duplicate indices: ${face.v}`,
      );
    }
  });
});
