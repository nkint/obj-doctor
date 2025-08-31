import { vec3, mat4 } from 'gl-matrix';

interface Vertex {
  position: vec3;
  index: number;
}

interface Face {
  vertices: number[]; // indices into vertex array
  normal?: vec3;
}

interface Edge {
  v1: number;
  v2: number;
  faces: number[]; // indices of faces that share this edge
}

interface Mesh {
  vertices: Vertex[];
  faces: Face[];
}

class MeshRepair {
  private vertices: Vertex[];
  private faces: Face[];
  private edges: Map<string, Edge>;
  private tolerance: number;

  constructor(tolerance: number = 1e-6) {
    this.vertices = [];
    this.faces = [];
    this.edges = new Map();
    this.tolerance = tolerance;
  }

  /**
   * Main function to repair mesh by making it edge manifold
   */
  public repairMesh(inputMesh: Mesh): Mesh[] {
    this.vertices = [...inputMesh.vertices];
    this.faces = [...inputMesh.faces];

    // Step 1: Build edge connectivity
    this.buildEdgeConnectivity();

    // Step 2: Identify non-manifold edges
    const nonManifoldEdges = this.findNonManifoldEdges();

    // Step 3: Split mesh at non-manifold edges
    const components = this.splitAtNonManifoldEdges(nonManifoldEdges);

    // Step 4: Clean up each component
    return components.map((component) => this.cleanComponent(component));
  }

  /**
   * Build edge connectivity map
   */
  private buildEdgeConnectivity(): void {
    this.edges.clear();

    for (let faceIdx = 0; faceIdx < this.faces.length; faceIdx++) {
      const face = this.faces[faceIdx];

      // Process each edge of the face
      for (let i = 0; i < face.vertices.length; i++) {
        const v1 = face.vertices[i];
        const v2 = face.vertices[(i + 1) % face.vertices.length];

        const edgeKey = this.getEdgeKey(v1, v2);

        if (!this.edges.has(edgeKey)) {
          this.edges.set(edgeKey, {
            v1: Math.min(v1, v2),
            v2: Math.max(v1, v2),
            faces: [],
          });
        }

        this.edges.get(edgeKey)!.faces.push(faceIdx);
      }
    }
  }

  /**
   * Generate consistent edge key for two vertices
   */
  private getEdgeKey(v1: number, v2: number): string {
    const min = Math.min(v1, v2);
    const max = Math.max(v1, v2);
    return `${min}-${max}`;
  }

  /**
   * Find edges that are shared by more than 2 faces (non-manifold)
   */
  private findNonManifoldEdges(): Edge[] {
    const nonManifold: Edge[] = [];

    for (const edge of this.edges.values()) {
      if (edge.faces.length > 2) {
        nonManifold.push(edge);
      }
    }

    return nonManifold;
  }

  /**
   * Split mesh into manifold components by duplicating vertices at non-manifold edges
   */
  private splitAtNonManifoldEdges(nonManifoldEdges: Edge[]): Mesh[] {
    if (nonManifoldEdges.length === 0) {
      return [{ vertices: this.vertices, faces: this.faces }];
    }

    // Create a mapping from original vertex indices to new vertex indices for each face
    const faceVertexMapping: Map<number, number[]> = new Map();
    let newVertices: Vertex[] = [...this.vertices];
    let newFaces: Face[] = [];

    // For each non-manifold edge, duplicate vertices for excess faces
    for (const edge of nonManifoldEdges) {
      const facesOnEdge = edge.faces;

      // Keep the first two faces using original vertices
      // Duplicate vertices for additional faces
      for (let i = 2; i < facesOnEdge.length; i++) {
        const faceIdx = facesOnEdge[i];

        if (!faceVertexMapping.has(faceIdx)) {
          faceVertexMapping.set(faceIdx, []);
        }

        // Duplicate vertices for this edge in this face
        const newV1Idx = this.duplicateVertex(edge.v1, newVertices);
        const newV2Idx = this.duplicateVertex(edge.v2, newVertices);

        faceVertexMapping.get(faceIdx)!.push(edge.v1, newV1Idx);
        faceVertexMapping.get(faceIdx)!.push(edge.v2, newV2Idx);
      }
    }

    // Update face vertex indices
    for (let faceIdx = 0; faceIdx < this.faces.length; faceIdx++) {
      const face = this.faces[faceIdx];
      let newFaceVertices = [...face.vertices];

      if (faceVertexMapping.has(faceIdx)) {
        const mapping = faceVertexMapping.get(faceIdx)!;

        // Apply vertex remapping
        for (let i = 0; i < mapping.length; i += 2) {
          const oldIdx = mapping[i];
          const newIdx = mapping[i + 1];

          for (let j = 0; j < newFaceVertices.length; j++) {
            if (newFaceVertices[j] === oldIdx) {
              newFaceVertices[j] = newIdx;
            }
          }
        }
      }

      newFaces.push({
        vertices: newFaceVertices,
        normal: face.normal,
      });
    }

    // Find connected components
    return this.findConnectedComponents({ vertices: newVertices, faces: newFaces });
  }

  /**
   * Duplicate a vertex
   */
  private duplicateVertex(vertexIdx: number, vertices: Vertex[]): number {
    const originalVertex = this.vertices[vertexIdx];
    const newVertex: Vertex = {
      position: vec3.clone(originalVertex.position),
      index: vertices.length,
    };

    vertices.push(newVertex);
    return newVertex.index;
  }

  /**
   * Find connected components in the mesh
   */
  private findConnectedComponents(mesh: Mesh): Mesh[] {
    const visited = new Set<number>();
    const components: Mesh[] = [];

    for (let faceIdx = 0; faceIdx < mesh.faces.length; faceIdx++) {
      if (!visited.has(faceIdx)) {
        const component = this.extractComponent(mesh, faceIdx, visited);
        if (component.faces.length > 0) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Extract a connected component starting from a face
   */
  private extractComponent(mesh: Mesh, startFaceIdx: number, visited: Set<number>): Mesh {
    const componentFaces: Face[] = [];
    const componentVertexSet = new Set<number>();
    const queue: number[] = [startFaceIdx];

    while (queue.length > 0) {
      const faceIdx = queue.shift()!;

      if (visited.has(faceIdx)) continue;
      visited.add(faceIdx);

      const face = mesh.faces[faceIdx];
      componentFaces.push(face);

      // Add vertices to set
      face.vertices.forEach((v) => componentVertexSet.add(v));

      // Find adjacent faces through shared edges
      for (let i = 0; i < face.vertices.length; i++) {
        const v1 = face.vertices[i];
        const v2 = face.vertices[(i + 1) % face.vertices.length];

        // Find other faces that share this edge
        for (let otherFaceIdx = 0; otherFaceIdx < mesh.faces.length; otherFaceIdx++) {
          if (otherFaceIdx === faceIdx || visited.has(otherFaceIdx)) continue;

          const otherFace = mesh.faces[otherFaceIdx];
          if (this.facesShareEdge(face, otherFace, v1, v2)) {
            queue.push(otherFaceIdx);
          }
        }
      }
    }

    // Create vertex mapping and new vertex array
    const vertexMapping = new Map<number, number>();
    const componentVertices: Vertex[] = [];

    Array.from(componentVertexSet)
      .sort()
      .forEach((oldIdx, newIdx) => {
        vertexMapping.set(oldIdx, newIdx);
        componentVertices.push({
          position: vec3.clone(mesh.vertices[oldIdx].position),
          index: newIdx,
        });
      });

    // Remap face vertex indices
    const remappedFaces = componentFaces.map((face) => ({
      vertices: face.vertices.map((v) => vertexMapping.get(v)!),
      normal: face.normal ? vec3.clone(face.normal) : undefined,
    }));

    return {
      vertices: componentVertices,
      faces: remappedFaces,
    };
  }

  /**
   * Check if two faces share a specific edge
   */
  private facesShareEdge(face1: Face, face2: Face, v1: number, v2: number): boolean {
    const face2Vertices = new Set(face2.vertices);
    return face2Vertices.has(v1) && face2Vertices.has(v2);
  }

  /**
   * Clean up a mesh component by removing degenerate faces and unused vertices
   */
  private cleanComponent(mesh: Mesh): Mesh {
    // Remove degenerate faces (faces with duplicate vertices or area near zero)
    const validFaces: Face[] = [];

    for (const face of mesh.faces) {
      if (this.isValidFace(face, mesh.vertices)) {
        validFaces.push(face);
      }
    }

    // Remove unused vertices
    const usedVertices = new Set<number>();
    validFaces.forEach((face) => {
      face.vertices.forEach((v) => usedVertices.add(v));
    });

    const vertexMapping = new Map<number, number>();
    const cleanVertices: Vertex[] = [];

    Array.from(usedVertices)
      .sort()
      .forEach((oldIdx, newIdx) => {
        vertexMapping.set(oldIdx, newIdx);
        cleanVertices.push({
          position: vec3.clone(mesh.vertices[oldIdx].position),
          index: newIdx,
        });
      });

    const cleanFaces = validFaces.map((face) => ({
      vertices: face.vertices.map((v) => vertexMapping.get(v)!),
      normal: face.normal ? vec3.clone(face.normal) : undefined,
    }));

    return {
      vertices: cleanVertices,
      faces: cleanFaces,
    };
  }

  /**
   * Check if a face is valid (not degenerate)
   */
  private isValidFace(face: Face, vertices: Vertex[]): boolean {
    if (face.vertices.length < 3) return false;

    // Check for duplicate vertices
    const uniqueVertices = new Set(face.vertices);
    if (uniqueVertices.size !== face.vertices.length) return false;

    // Check if face has non-zero area (for triangles)
    if (face.vertices.length === 3) {
      const v0 = vertices[face.vertices[0]].position;
      const v1 = vertices[face.vertices[1]].position;
      const v2 = vertices[face.vertices[2]].position;

      const edge1 = vec3.subtract(vec3.create(), v1, v0);
      const edge2 = vec3.subtract(vec3.create(), v2, v0);
      const cross = vec3.cross(vec3.create(), edge1, edge2);

      return vec3.length(cross) > this.tolerance;
    }

    return true;
  }

  /**
   * Merge vertices that are very close to each other
   */
  public mergeCloseVertices(mesh: Mesh, threshold: number = 1e-6): Mesh {
    const vertexMapping = new Map<number, number>();
    const mergedVertices: Vertex[] = [];

    for (let i = 0; i < mesh.vertices.length; i++) {
      let merged = false;

      // Check if this vertex is close to any existing merged vertex
      for (let j = 0; j < mergedVertices.length; j++) {
        const distance = vec3.distance(mesh.vertices[i].position, mergedVertices[j].position);
        if (distance < threshold) {
          vertexMapping.set(i, j);
          merged = true;
          break;
        }
      }

      if (!merged) {
        vertexMapping.set(i, mergedVertices.length);
        mergedVertices.push({
          position: vec3.clone(mesh.vertices[i].position),
          index: mergedVertices.length,
        });
      }
    }

    // Remap faces
    const mergedFaces = mesh.faces.map((face) => ({
      vertices: face.vertices.map((v) => vertexMapping.get(v)!),
      normal: face.normal ? vec3.clone(face.normal) : undefined,
    }));

    return {
      vertices: mergedVertices,
      faces: mergedFaces,
    };
  }

  /**
   * Calculate face normals
   */
  public calculateNormals(mesh: Mesh): void {
    for (const face of mesh.faces) {
      if (face.vertices.length >= 3) {
        const v0 = mesh.vertices[face.vertices[0]].position;
        const v1 = mesh.vertices[face.vertices[1]].position;
        const v2 = mesh.vertices[face.vertices[2]].position;

        const edge1 = vec3.subtract(vec3.create(), v1, v0);
        const edge2 = vec3.subtract(vec3.create(), v2, v0);
        const normal = vec3.cross(vec3.create(), edge1, edge2);
        vec3.normalize(normal, normal);

        face.normal = normal;
      }
    }
  }
}

// Utility functions for working with OBJ files

/**
 * Parse OBJ file content into a Mesh
 */
export function parseOBJ(objContent: string): Mesh {
  const lines = objContent.split('\n');
  const vertices: Vertex[] = [];
  const faces: Face[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('v ')) {
      // Vertex
      const parts = trimmedLine.split(/\s+/);
      const position = vec3.fromValues(
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3]),
      );

      vertices.push({
        position,
        index: vertices.length,
      });
    } else if (trimmedLine.startsWith('f ')) {
      // Face
      const parts = trimmedLine.split(/\s+/).slice(1);
      const faceVertices = parts.map((part) => {
        // Handle vertex/texture/normal format (v/vt/vn)
        const vertexIndex = parseInt(part.split('/')[0]) - 1; // OBJ is 1-indexed
        return vertexIndex;
      });

      faces.push({
        vertices: faceVertices,
      });
    }
  }

  return { vertices, faces };
}

/**
 * Convert Mesh back to OBJ format
 */
export function meshToOBJ(mesh: Mesh): string {
  let obj = '';

  // Write vertices
  for (const vertex of mesh.vertices) {
    obj += `v ${vertex.position[0]} ${vertex.position[1]} ${vertex.position[2]}\n`;
  }

  // Write faces
  for (const face of mesh.faces) {
    const faceStr = face.vertices.map((v) => (v + 1).toString()).join(' '); // OBJ is 1-indexed
    obj += `f ${faceStr}\n`;
  }

  return obj;
}

/**
 * Main repair function - easy to use interface
 */
export function repairMeshFromOBJ(objContent: string, mergeTolerance: number = 1e-6): string[] {
  // Parse input
  const inputMesh = parseOBJ(objContent);

  // Create repair instance
  const repair = new MeshRepair();

  // Optionally merge close vertices first
  const mergedMesh = repair.mergeCloseVertices(inputMesh, mergeTolerance);

  // Repair mesh
  const components = repair.repairMesh(mergedMesh);

  // Calculate normals for each component
  components.forEach((component) => repair.calculateNormals(component));

  // Convert back to OBJ
  return components.map((component) => meshToOBJ(component));
}

// Example usage:
/*
const objContent = `
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 0.5 1.0 0.0
v 0.5 0.0 1.0
f 1 2 3
f 1 2 4
f 2 3 4
f 1 3 4
`;

const repairedComponents = repairMeshFromOBJ(objContent);
console.log(`Mesh split into ${repairedComponents.length} manifold components`);
repairedComponents.forEach((component, index) => {
  console.log(`Component ${index + 1}:`);
  console.log(component);
});
*/
