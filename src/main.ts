import { readFileSync, writeFileSync } from 'fs';
import { parseOBJ, OBJModel } from '@thi.ng/geom-io-obj';
import { removeDegeneratedFaces, mergeCloseVertices, mergeCoplanarFaces } from './services';
import { CONSOLE_INDENT } from './constants';

/**
 * Export OBJ model to string format
 */
function exportOBJ(mesh: OBJModel): string {
  let output = '';

  // Write vertices
  mesh.vertices.forEach((v) => {
    output += `v ${v[0]} ${v[1]} ${v[2]}\n`;
  });

  // Write objects and groups
  mesh.objects.forEach((obj) => {
    if (obj.id) {
      output += `o ${obj.id}\n`;
    }

    obj.groups.forEach((group) => {
      if (group.id) {
        output += `g ${group.id}\n`;
      }

      // Write faces
      group.faces.forEach((face) => {
        output += `f ${face.v.map((v) => v + 1).join(' ')}\n`;
      });
    });
  });

  return output;
}

/**
 * Count total faces in a mesh
 */
function countTotalFaces(mesh: OBJModel): number {
  return mesh.objects.reduce(
    (acc, obj) => acc + obj.groups.reduce((acc2, group) => acc2 + group.faces.length, 0),
    0,
  );
}

/**
 * Main function to process OBJ files
 */
function main(): void {
  // Get input file from command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node main.js <input-file.obj> [output-file.obj]');
    process.exit(1);
  }

  const inputFile = args[0]!;
  const outputFile = args[1] || inputFile.replace('.obj', '_cleaned.obj');

  try {
    console.log(`Reading OBJ file: ${inputFile}`);

    // Read and parse the OBJ file
    const objContent = readFileSync(inputFile, 'utf-8');
    const mesh: OBJModel = parseOBJ(objContent);

    const originalFaceCount = countTotalFaces(mesh);
    console.log(`Original mesh: ${mesh.vertices.length} vertices, ${originalFaceCount} faces`);

    // Apply mesh cleaning operations in sequence
    console.log('Applying mesh cleaning operations...');

    // 1. Remove degenerated faces
    console.log(`${CONSOLE_INDENT}1. Removing degenerated faces...`);
    let cleanedMesh = removeDegeneratedFaces(mesh);

    // 2. Merge close vertices
    console.log(`${CONSOLE_INDENT}2. Merging close vertices...`);
    cleanedMesh = mergeCloseVertices(cleanedMesh);

    // 3. Merge coplanar faces
    console.log(`${CONSOLE_INDENT}3. Merging coplanar faces...`);
    cleanedMesh = mergeCoplanarFaces(cleanedMesh);

    const finalFaceCount = countTotalFaces(cleanedMesh);

    console.log(`Cleaned mesh: ${cleanedMesh.vertices.length} vertices, ${finalFaceCount} faces`);

    // Export the cleaned mesh
    const outputContent = exportOBJ(cleanedMesh);
    writeFileSync(outputFile, outputContent, 'utf-8');

    console.log(`Cleaned mesh saved to: ${outputFile}`);
  } catch (error) {
    console.error('Error processing OBJ file:', error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}
