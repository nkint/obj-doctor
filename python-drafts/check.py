# generato da chat gpt

# Analisi dettagliata dei due file OBJ che hai inviato.
# Output: statistiche, verifica di vertici duplicati (posizioni identiche), componenti connesse di facce,
# edge non-manifold, edge di confine (boundary edges), facce degeneri (area ~0), e orientamento incoerente tra facce adiacenti.

from collections import defaultdict, deque
import math

def parse_obj(path):
    verts = []
    faces = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or line.startswith('g ') or line.startswith('o '):
                continue
            if line.startswith('v '):
                parts = line.split()
                x,y,z = map(float, parts[1:4])
                verts.append((x,y,z))
            elif line.startswith('f '):
                parts = line.split()[1:]
                # supports faces like "f v v v" or "f v/vt/vn ..."
                idxs = []
                for p in parts:
                    if '/' in p:
                        idx = p.split('/')[0]
                    else:
                        idx = p
                    # OBJ indices 1-based, handle negative indices
                    idx = int(idx)
                    if idx < 0:
                        idx = len(verts) + 1 + idx
                    idxs.append(idx-1)
                faces.append(tuple(idxs))
    return verts, faces

def vec_sub(a,b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def cross(a,b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def dot(a,b): return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
def norm(a): return math.sqrt(dot(a,a))

def face_area(verts, face):
    if len(face) < 3: return 0.0
    # triangulate fan from v0
    a = 0.0
    v0 = verts[face[0]]
    for i in range(1, len(face)-1):
        v1 = verts[face[i]]
        v2 = verts[face[i+1]]
        cr = cross(vec_sub(v1, v0), vec_sub(v2, v0))
        a += 0.5 * norm(cr)
    return a

def face_normal(verts, face):
    # compute normal of first triangle in face fan
    if len(face) < 3: return (0,0,0)
    v0 = verts[face[0]]
    v1 = verts[face[1]]
    v2 = verts[face[2]]
    n = cross(vec_sub(v1,v0), vec_sub(v2,v0))
    ln = norm(n)
    if ln == 0: return (0,0,0)
    return (n[0]/ln, n[1]/ln, n[2]/ln)

def analyze(path):
    verts, faces = parse_obj(path)
    nverts = len(verts); nfaces = len(faces)
    # duplicate positions
    pos_map = defaultdict(list)
    for i,p in enumerate(verts):
        pos_map[p].append(i)
    dup_positions = {p:idxs for p,idxs in pos_map.items() if len(idxs)>1}
    # duplicates near-equal within tolerance
    tol = 1e-6
    merged = {}
    for i,p in enumerate(verts):
        if i in merged: continue
        merged[i] = [i]
        for j in range(i+1, len(verts)):
            if j in merged: continue
            d = math.dist(p, verts[j])
            if d <= tol:
                merged[i].append(j)
                merged[j] = merged[i]
    groups = defaultdict(list)
    for k,v in merged.items():
        groups[id(v)].append(k)
    near_dups = {i:idxs for i,idxs in groups.items() if len(idxs)>1}
    # build edge map
    edge_map = defaultdict(list)
    for fi,face in enumerate(faces):
        m = len(face)
        for i in range(m):
            a = face[i]; b = face[(i+1)%m]
            edge = tuple(sorted((a,b)))
            edge_map[edge].append(fi)
    boundary_edges = [e for e,fs in edge_map.items() if len(fs)==1]
    nonmanifold_edges = [e for e,fs in edge_map.items() if len(fs)>2]
    # face adjacency graph via shared edges
    adj = defaultdict(set)
    for e,fs in edge_map.items():
        for i in fs:
            for j in fs:
                if i!=j:
                    adj[i].add(j)
    # connected components of faces
    visited = set()
    comps = []
    for i in range(len(faces)):
        if i in visited: continue
        q = deque([i]); comp = []
        visited.add(i)
        while q:
            u = q.popleft(); comp.append(u)
            for v in adj[u]:
                if v not in visited:
                    visited.add(v); q.append(v)
        comps.append(comp)
    # degenerate faces and normals
    deg_faces = []
    normals = []
    for i,face in enumerate(faces):
        a = face_area(verts, face)
        normals.append(face_normal(verts, face))
        if a <= 1e-9:
            deg_faces.append(i)
    # inconsistent orientation between adjacent faces: dot(normal_i, normal_j) < 0.0 flagged
    flipped_pairs = []
    for e,fs in edge_map.items():
        if len(fs)==2:
            i,j = fs
            ni = normals[i]; nj = normals[j]
            if ni==(0,0,0) or nj==(0,0,0): continue
            if dot(ni,nj) < -0.2: # fairly opposite
                flipped_pairs.append((i,j,e))
    summary = {
        "path": path,
        "nverts": nverts,
        "nfaces": nfaces,
        "duplicate_positions_exact_count": sum(len(v)-1 for v in dup_positions.values()),
        "near_duplicate_groups_count": len(near_dups),
        "n_components": len(comps),
        "component_sizes": sorted([len(c) for c in comps], reverse=True),
        "n_boundary_edges": len(boundary_edges),
        "n_nonmanifold_edges": len(nonmanifold_edges),
        "n_degenerate_faces": len(deg_faces),
        "n_flipped_adjacent_pairs": len(flipped_pairs),
        "examples_boundary_edges": boundary_edges[:6],
        "examples_nonmanifold_edges": nonmanifold_edges[:6],
        "examples_flipped_pairs": flipped_pairs[:6],
        "degenerate_faces": deg_faces[:6],
    }
    return summary, verts, faces, comps, edge_map, normals

paths = ["/mnt/data/unione.obj", "/mnt/data/unione2.obj"]
results = {}
for p in paths:
    res = analyze(p)
    results[p] = res[0]
    
results
