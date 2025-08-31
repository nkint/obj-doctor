import numpy as np
from collections import defaultdict, Counter
import copy

class MeshRepair:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.vertex_counter = 0
        
    def load_obj(self, obj_content):
        """Carica una mesh da contenuto OBJ"""
        lines = obj_content.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('v '):
                # Vertice
                coords = list(map(float, line.split()[1:4]))
                self.vertices.append(coords)
                self.vertex_counter += 1
            elif line.startswith('f '):
                # Faccia (converti da 1-indexed a 0-indexed)
                face_data = line.split()[1:]
                face = []
                for vertex_data in face_data:
                    # Gestisce il formato v/vt/vn prendendo solo l'indice del vertice
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
                # Normalizza l'edge (vertice minore primo)
                edge = tuple(sorted([v1, v2]))
                edges[edge].append(face_idx)
        
        return edges
    
    def find_non_manifold_edges(self):
        """Trova gli edge non-manifold (usati da più di 2 facce)"""
        edges = self.get_edges()
        non_manifold_edges = {}
        
        for edge, face_list in edges.items():
            if len(face_list) > 2:
                non_manifold_edges[edge] = face_list
                
        return non_manifold_edges
    
    def repair_mesh(self):
        """Ripara la mesh duplicando i vertici degli edge non-manifold"""
        non_manifold_edges = self.find_non_manifold_edges()
        
        if not non_manifold_edges:
            print("La mesh è già manifold!")
            return
        
        print(f"Trovati {len(non_manifold_edges)} edge non-manifold")
        
        # Mappa per tenere traccia dei nuovi vertici creati
        vertex_mapping = {}  # (original_vertex, face_group) -> new_vertex_idx
        new_faces = copy.deepcopy(self.faces)
        
        for edge, face_list in non_manifold_edges.items():
            v1, v2 = edge
            print(f"Riparando edge ({v1}, {v2}) usato da {len(face_list)} facce: {face_list}")
            
            # Raggruppa le facce: le prime 2 mantengono i vertici originali,
            # le altre ottengono vertici duplicati
            faces_to_keep_original = face_list[:2]
            faces_to_duplicate = face_list[2:]
            
            for face_idx in faces_to_duplicate:
                face = new_faces[face_idx]
                new_face = []
                
                for vertex_idx in face:
                    if vertex_idx in [v1, v2]:
                        # Questo vertice fa parte dell'edge non-manifold
                        key = (vertex_idx, face_idx)
                        
                        if key not in vertex_mapping:
                            # Crea un nuovo vertice duplicando quello originale
                            new_vertex_idx = len(self.vertices)
                            self.vertices.append(self.vertices[vertex_idx].copy())
                            vertex_mapping[key] = new_vertex_idx
                            print(f"  Duplicato vertice {vertex_idx} -> {new_vertex_idx} per faccia {face_idx}")
                        
                        new_face.append(vertex_mapping[key])
                    else:
                        new_face.append(vertex_idx)
                
                new_faces[face_idx] = new_face
        
        self.faces = new_faces
        print(f"Riparazione completata. Vertici: {len(self.vertices)}, Facce: {len(self.faces)}")
    
    def save_obj(self, filename):
        """Salva la mesh riparata in formato OBJ"""
        with open(filename, 'w') as f:
            # Scrivi i vertici
            for vertex in self.vertices:
                f.write(f"v {vertex[0]} {vertex[1]} {vertex[2]}\n")
            
            # Scrivi le facce (converti da 0-indexed a 1-indexed)
            f.write("o default\n")
            f.write("g default\n")
            for face in self.faces:
                face_str = " ".join(str(v + 1) for v in face)
                f.write(f"f {face_str}\n")
    
    def print_mesh_info(self):
        """Stampa informazioni sulla mesh"""
        edges = self.get_edges()
        non_manifold = self.find_non_manifold_edges()
        
        print(f"Informazioni Mesh:")
        print(f"  Vertici: {len(self.vertices)}")
        print(f"  Facce: {len(self.faces)}")
        print(f"  Edge totali: {len(edges)}")
        print(f"  Edge non-manifold: {len(non_manifold)}")
        
        if non_manifold:
            print("  Dettagli edge non-manifold:")
            for edge, faces in non_manifold.items():
                print(f"    Edge {edge}: usato da {len(faces)} facce {faces}")

# Esempio di utilizzo
def main():
    # Il tuo contenuto OBJ
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
    
    # Crea l'oggetto riparatore
    repair = MeshRepair()
    
    # Carica la mesh
    repair.load_obj(obj_content)
    
    print("=== MESH ORIGINALE ===")
    repair.print_mesh_info()
    
    print("\n=== RIPARAZIONE IN CORSO ===")
    # Ripara la mesh
    repair.repair_mesh()
    
    print("\n=== MESH RIPARATA ===")
    repair.print_mesh_info()
    
    # Salva la mesh riparata
    repair.save_obj("mesh_riparata.obj")
    print("\nMesh riparata salvata come 'mesh_riparata.obj'")

if __name__ == "__main__":
    main()