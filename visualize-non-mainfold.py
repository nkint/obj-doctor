import numpy as np
from collections import defaultdict

class BoundaryVisualizer:
    def __init__(self):
        self.vertices = []
        self.faces = []
        
    def load_obj(self, obj_content):
        """Carica una mesh da contenuto OBJ"""
        lines = obj_content.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('v '):
                coords = list(map(float, line.split()[1:4]))
                self.vertices.append(coords)
            elif line.startswith('f '):
                face_data = line.split()[1:]
                face = []
                for vertex_data in face_data:
                    vertex_idx = int(vertex_data.split('/')[0]) - 1
                    face.append(vertex_idx)
                self.faces.append(face)
    
    def get_edges(self):
        """Estrae tutti gli edge dalle facce"""
        edges = defaultdict(list)
        
        for face_idx, face in enumerate(self.faces):
            n = len(face)
            for i in range(n):
                v1 = face[i]
                v2 = face[(i + 1) % n]
                edge = tuple(sorted([v1, v2]))
                edges[edge].append(face_idx)
        
        return edges
    
    def find_boundary_edges(self):
        """Trova gli edge di confine"""
        edges = self.get_edges()
        boundary_edges = []
        
        for edge, face_list in edges.items():
            if len(face_list) == 1:  # Edge di confine
                boundary_edges.append(edge)
                
        return boundary_edges
    
    def create_html_visualization(self, filename="mesh_analysis.html"):
        """Crea una visualizzazione HTML interattiva con Three.js"""
        boundary_edges = self.find_boundary_edges()
        
        # Converti dati per JavaScript
        vertices_js = str(self.vertices).replace('[', '').replace(']', '').replace('(', '').replace(')', '')
        faces_js = str(self.faces).replace('[', '').replace(']', '')
        boundary_edges_js = str(boundary_edges).replace('[', '').replace(']', '')
        
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Analisi Edge di Confine</title>
    <style>
        body {{ margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f0f0f0; }}
        #container {{ width: 100%; height: 80vh; border: 2px solid #333; }}
        #info {{ margin-top: 20px; padding: 15px; background: white; border-radius: 5px; }}
        .boundary-edge {{ color: red; font-weight: bold; }}
        .controls {{ margin-bottom: 20px; }}
        button {{ padding: 10px 20px; margin: 5px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; }}
        button:hover {{ background: #45a049; }}
    </style>
</head>
<body>
    <h1>Analisi Mesh - Edge di Confine</h1>
    
    <div class="controls">
        <button onclick="toggleWireframe()">Toggle Wireframe</button>
        <button onclick="toggleBoundaryEdges()">Toggle Edge Confine</button>
        <button onclick="resetView()">Reset Vista</button>
    </div>
    
    <div id="container"></div>
    
    <div id="info">
        <h3>Informazioni Mesh:</h3>
        <p>Vertici: {len(self.vertices)}</p>
        <p>Facce: {len(self.faces)}</p>
        <p><span class="boundary-edge">Edge di confine: {len(boundary_edges)}</span></p>
        
        <h4>Edge di confine identificati:</h4>
        <ul>
"""
        
        for i, edge in enumerate(boundary_edges):
            v1, v2 = edge
            pos1 = self.vertices[v1]
            pos2 = self.vertices[v2]
            html_content += f'<li class="boundary-edge">Edge {i+1}: Vertice {v1} ({pos1[0]:.3f}, {pos1[1]:.3f}, {pos1[2]:.3f}) → Vertice {v2} ({pos2[0]:.3f}, {pos2[1]:.3f}, {pos2[2]:.3f})</li>'
        
        html_content += f"""
        </ul>
        
        <p><strong>Cosa significano gli edge di confine:</strong></p>
        <ul>
            <li>🔴 <strong>Linee rosse spesse</strong>: Edge di confine (usati da una sola faccia)</li>
            <li>⚪ <strong>Wireframe bianco</strong>: Edge normali (condivisi da 2 facce)</li>
            <li>🔵 <strong>Superficie blu</strong>: Facce della mesh</li>
        </ul>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        let scene, camera, renderer, mesh, wireframe, boundaryLines;
        let showWireframe = true;
        let showBoundaryEdges = true;
        
        // Dati mesh
        const vertices = [{vertices_js}];
        const faces = [{faces_js}];
        const boundaryEdges = [{boundary_edges_js}];
        
        function init() {{
            // Setup scena
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(2, 2, 2);
            camera.lookAt(0, 0, 0);
            
            renderer = new THREE.WebGLRenderer({{ antialias: true }});
            renderer.setSize(document.getElementById('container').clientWidth, 
                           document.getElementById('container').clientHeight);
            document.getElementById('container').appendChild(renderer.domElement);
            
            // Crea geometria
            const geometry = new THREE.BufferGeometry();
            
            // Converti vertici
            const vertexArray = [];
            for (let i = 0; i < vertices.length; i += 3) {{
                vertexArray.push(vertices[i], vertices[i+1], vertices[i+2]);
            }}
            
            // Converti facce in triangoli
            const indexArray = [];
            for (let i = 0; i < faces.length; i += faces[i] + 1) {{
                const faceSize = faces[i];
                const faceStart = i + 1;
                
                // Triangola facce con più di 3 vertici
                for (let j = 1; j < faceSize - 1; j++) {{
                    indexArray.push(faces[faceStart], faces[faceStart + j], faces[faceStart + j + 1]);
                }}
            }}
            
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexArray, 3));
            geometry.setIndex(indexArray);
            geometry.computeVertexNormals();
            
            // Mesh principale
            const material = new THREE.MeshPhongMaterial({{ 
                color: 0x4169E1, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            }});
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            
            // Wireframe
            const wireframeMaterial = new THREE.LineBasicMaterial({{ color: 0xffffff, opacity: 0.3 }});
            wireframe = new THREE.LineSegments(
                new THREE.WireframeGeometry(geometry), 
                wireframeMaterial
            );
            scene.add(wireframe);
            
            // Edge di confine (linee rosse spesse)
            createBoundaryLines();
            
            // Luci
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);
            
            // Controlli mouse semplici
            setupControls();
            
            animate();
        }}
        
        function createBoundaryLines() {{
            const boundaryGeometry = new THREE.BufferGeometry();
            const boundaryVertices = [];
            
            for (let i = 0; i < boundaryEdges.length; i += 2) {{
                const v1Idx = boundaryEdges[i];
                const v2Idx = boundaryEdges[i + 1];
                
                // Aggiungi i due vertici dell'edge
                boundaryVertices.push(
                    vertices[v1Idx * 3], vertices[v1Idx * 3 + 1], vertices[v1Idx * 3 + 2],
                    vertices[v2Idx * 3], vertices[v2Idx * 3 + 1], vertices[v2Idx * 3 + 2]
                );
            }}
            
            boundaryGeometry.setAttribute('position', new THREE.Float32BufferAttribute(boundaryVertices, 3));
            
            const boundaryMaterial = new THREE.LineBasicMaterial({{ 
                color: 0xff0000, 
                linewidth: 5 
            }});
            
            boundaryLines = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
            scene.add(boundaryLines);
        }}
        
        function setupControls() {{
            let isMouseDown = false;
            let mouseX = 0, mouseY = 0;
            
            renderer.domElement.addEventListener('mousedown', (e) => {{
                isMouseDown = true;
                mouseX = e.clientX;
                mouseY = e.clientY;
            }});
            
            renderer.domElement.addEventListener('mouseup', () => {{
                isMouseDown = false;
            }});
            
            renderer.domElement.addEventListener('mousemove', (e) => {{
                if (!isMouseDown) return;
                
                const deltaX = e.clientX - mouseX;
                const deltaY = e.clientY - mouseY;
                
                mesh.rotation.y += deltaX * 0.01;
                mesh.rotation.x += deltaY * 0.01;
                wireframe.rotation.copy(mesh.rotation);
                boundaryLines.rotation.copy(mesh.rotation);
                
                mouseX = e.clientX;
                mouseY = e.clientY;
            }});
            
            renderer.domElement.addEventListener('wheel', (e) => {{
                camera.position.multiplyScalar(e.deltaY > 0 ? 1.1 : 0.9);
            }});
        }}
        
        function toggleWireframe() {{
            wireframe.visible = !wireframe.visible;
            showWireframe = wireframe.visible;
        }}
        
        function toggleBoundaryEdges() {{
            boundaryLines.visible = !boundaryLines.visible;
            showBoundaryEdges = boundaryLines.visible;
        }}
        
        function resetView() {{
            camera.position.set(2, 2, 2);
            camera.lookAt(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            wireframe.rotation.set(0, 0, 0);
            boundaryLines.rotation.set(0, 0, 0);
        }}
        
        function animate() {{
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }}
        
        // Avvia la visualizzazione
        init();
    </script>
</body>
</html>"""
        
        with open(filename, 'w') as f:
            f.write(html_content)
        
        print(f"Visualizzazione creata: {filename}")
        print("Apri il file nel browser per vedere gli edge di confine evidenziati in rosso!")

# Analizza la mesh originale
def analyze_original_mesh():
    obj_content = """v -0.0931693986 -0.487841994 7.4505806e-8
v -3.72529163e-9 -0.441257238 0.143373147
v 3.72529008e-9 -0.441257179 -0.143373072
v -0.093169421 0.394672364 0.286746234
v -3.72529008e-9 0.441257179 0.143373072
v 0 0.272711903 0.375355721
v -0.0931693912 -0.150751531 0.463965297
v 0 -1.04308128e-7 0.463965237
v 0 -0.272711933 0.37535584
v -0.394672155 0.243920907 0.177219018
v -0.394672155 -0.0931696221 0.286746323
v -0.394672155 -0.301502943 7.4505806e-8
v -0.394672215 -0.0931695849 -0.286746264
v -0.394672215 0.243920982 -0.177218959
v -0.0931694508 0.394672453 -0.286746293
v -1.12886825e-10 0.441257209 0.00434460258
v -1.80255899e-9 0.441257209 -0.00462498516
v -0.0931694508 -0.150751382 -0.463965207
v 0 1.04308128e-7 -0.463965237
v 0 -0.272711903 -0.375355721
v -1.4810605e-9 -0.108421877 -0.428736806
v 0 -0.0997348055 -0.431559384
v 0 0.272712022 -0.375355721
v -6.69308685e-18 0.441257209 -0.143373191
v 0.0931693912 0.394672513 -0.286746293
v 0.0931694508 -0.487841964 0
v 0.0931694508 -0.150751457 0.463965178
v 0.0931693986 0.394672513 0.286746264
v 0.394672215 -0.0931694359 0.286746293
v 0.394672155 0.243921056 0.177218914
v 0.394672155 0.243921056 -0.177218914
v 0.394672155 -0.0931694359 -0.286746293
v 0.394672215 -0.301502913 0
v 0.093169421 -0.150751457 -0.463965178
o default
g default
g group-0
g group-1
f 1 3 2
f 4 6 5
f 7 9 8
f 10 14 13 12 11
f 12 1 2 9 7 11
f 7 8 6 4 10 11
f 4 5 16 17 16 24 15 14 10
f 15 23 19 18 13 14
f 18 20 3 1 12 13
f 21 22 20 18 19 22
f 15 24 23
f 25 23 24
f 26 2 3
f 27 8 9
f 28 5 6
f 29 33 32 31 30
f 31 25 24 17 16 17 5 28 30
f 28 6 8 27 29 30
f 27 9 2 26 33 29
f 26 3 20 34 32 33
f 34 19 23 25 31 32
f 22 21 19 34 20 21"""
    
    visualizer = BoundaryVisualizer()
    visualizer.load_obj(obj_content)
    
    print("=== ANALISI EDGE DI CONFINE ===")
    boundary_edges = visualizer.find_boundary_edges()
    
    print(f"Trovati {len(boundary_edges)} edge di confine:")
    for i, edge in enumerate(boundary_edges):
        v1, v2 = edge
        pos1 = visualizer.vertices[v1]
        pos2 = visualizer.vertices[v2]
        print(f"  {i+1}. Edge ({v1}, {v2})")
        print(f"     Vertice {v1}: ({pos1[0]:.6f}, {pos1[1]:.6f}, {pos1[2]:.6f})")
        print(f"     Vertice {v2}: ({pos2[0]:.6f}, {pos2[1]:.6f}, {pos2[2]:.6f})")
    
    # Crea visualizzazione interattiva
    visualizer.create_html_visualization()

if __name__ == "__main__":
    analyze_original_mesh()