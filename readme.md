# Obj Doctor

A simple Node.js tool for cleaning and repairing 3D mesh files (OBJ format) by removing degenerate faces, merging close vertices, and consolidating coplanar faces.

This tool is intended for use as a toy project and is not equipped to handle some important real-world cases. These include UV, vertex normals, watertight meshes or non-manifold edges.

Most of the code is based on some python scripts that were generated using AI and then adapted to typescript/nodejs.

## Features

- **Remove Degenerated Faces**: Eliminates faces with less than 3 edges or zero area
- **Merge Close Vertices**: Consolidates vertices that are within a specified distance threshold
- **Merge Coplanar Faces**: Combines adjacent faces that lie on the same plane

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Mode

```bash
npm run start input.obj [output.obj]
```

### Run Tests

```bash
npm test
npm run test:watch  # Run tests in watch mode (Node test runner)
```

## API Reference

### `removeDegeneratedFaces(mesh: OBJModel): OBJModel`

Removes faces that have:

- Less than 3 vertices
- Zero or near-zero area (threshold: 1e-9)

### `mergeCloseVertices(mesh: OBJModel): OBJModel`

Consolidates vertices that are within a specified distance threshold, reducing mesh complexity while maintaining visual quality.

### `mergeCoplanarFaces(mesh: OBJModel): OBJModel`

Combines adjacent faces that lie on the same plane, reducing the total number of faces in the mesh.

## Dependencies

- **@thi.ng/geom-io-obj**: OBJ file parsing and manipulation
- **@thi.ng/vectors**: Vector mathematics operations
- **@thi.ng/object-utils**: Utility functions for object manipulation
- **tsx**: TypeScript execution environment
