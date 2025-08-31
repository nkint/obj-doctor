from collections import defaultdict

def parse_obj(path):
    vertices = []
    faces = []
    with open(path, "r") as f:
        for line in f:
            if line.startswith("v "):
                parts = line.strip().split()
                vertices.append(tuple(float(x) for x in parts[1:4]))
            elif line.startswith("f "):
                parts = line.strip().split()[1:]
                face = [int(p.split("/")[0]) - 1 for p in parts]
                faces.append(face)
    return vertices, faces

def write_obj(path, vertices, faces):
    with open(path, "w") as f:
        for v in vertices:
            f.write("v {:.6f} {:.6f} {:.6f}\n".format(*v))
        for face in faces:
            # OBJ is 1-indexed
            f.write("f {}\n".format(" ".join(str(i+1) for i in face)))

def remove_nonmanifold(input_path, output_path):
    vertices, faces = parse_obj(input_path)

    # build edge map
    edge_faces = defaultdict(list)
    for fi, f in enumerate(faces):
        for i in range(len(f)):
            a, b = f[i], f[(i + 1) % len(f)]
            edge = tuple(sorted((a, b)))
            edge_faces[edge].append(fi)

    # find bad faces (that touch non-manifold edges)
    bad_faces = set()
    for edge, used in edge_faces.items():
        if len(used) > 2:  # non manifold
            bad_faces.update(used)

    cleaned_faces = [f for i, f in enumerate(faces) if i not in bad_faces]

    print(f"Removed {len(bad_faces)} non-manifold faces out of {len(faces)}")

    write_obj(output_path, vertices, cleaned_faces)

# Esempio di uso:
# remove_nonmanifold("unione_cleaned.obj", "unione_no_nonmanifold.obj")
