# Obj Doctor

A simple Node.js tool for cleaning and repearing 3D mesh files (OBJ format) by removing degenerate faces, merging close vertices, and consolidating coplanar faces.

Most of the code is based on some python scripts generated with AI and adapted to typescript/nodejs.

## Features

- **Remove Degenerated Faces**: Eliminates faces with less than 3 edges or zero area
- **Merge Close Vertices**: Consolidates vertices that are within a specified distance threshold
- **Merge Coplanar Faces**: Combines adjacent faces that lie on the same plane

## Installation

```bash
npm install
```

## Usage

### Command Line Interface

Process an OBJ file directly from the command line:

```bash
npm start input.obj [output.obj]
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
