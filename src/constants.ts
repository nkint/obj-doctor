/**
 * Constants used throughout the mesh cleaning operations
 */

// Area threshold for determining if a face is degenerated
export const DEGENERATED_FACE_AREA_THRESHOLD = 1e-9;

// Distance threshold for merging close vertices
export const DEFAULT_VERTEX_MERGE_THRESHOLD = 0.01;

// Epsilon value for coplanar face detection
export const DEFAULT_COPLANAR_EPSILON = 1e-5;

// Console output formatting
export const CONSOLE_INDENT = '  ';
export const CONSOLE_SUB_INDENT = '    ';
