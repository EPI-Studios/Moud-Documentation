# Procedural Meshes

The `ArrayMesh` and `SurfaceTool` classes allow scripts to generate custom 3D geometry at runtime. Procedural meshes are attached to `MeshInstance3D` nodes and support standard rendering and physics pipelines, including material assignment, Jolt physics collision, and client-server replication.

---

## Technical behavior

When a scene initializes a `MeshInstance3D` node with a defined `mesh_source` property, the engine executes the following pipeline:

1. The server evaluates the `mesh_source` to construct an `ArrayMesh` (decoding inline data, loading a `.mesh` asset, or executing a generator script).
2. The `ArrayMesh` is registered in the process-wide `MeshRegistry` via a content hash. Identical meshes are automatically deduplicated.
3. `CollisionBakeService` processes the mesh through `ProceduralMeshGeometrySource`, flattening surfaces into a `CollisionGeometry` object. The node's `collision_strategy` property determines the resulting Jolt physics shape.
4. Mesh vertex data replicates to connected clients once per unique hash. Subsequent nodes referencing the same mesh replicate only the 16-byte hash.
5. Clients allocate vertex data into GPU buffers and issue one draw call per surface based on the designated `material_id`.

*Note: Collision evaluation is strictly server-authoritative. If a generator's `authority` evaluates to `"client"`, the server still executes the generator to bake collision bounds, but vertex data is omitted from network replication.*

---

## Mesh data model

A procedural mesh consists of one or more **surfaces**. Each surface represents an independent geometric subunit with an exclusive material assignment. 

| Property | Description |
|---|---|
| `positions` | Flat `float[]` of `x, y, z` vertex coordinates. |
| `normals` | Flat `float[]` of `x, y, z` normal vectors. |
| `uvs` | Flat `float[]` of `u, v` texture coordinates. |
| `indices` | Flat `int[]` defining triangles via groups of three vertex indices. |
| `material_id` | Absolute path to the surface material (e.g., `res://materials/stone.mat`). |
| `primitive` | Rendering primitive configuration. Currently restricted to `TRIANGLES`. |

---

## Mesh source configuration

The `mesh_source` property on `MeshInstance3D` expects a JSON object defining the mesh origin. The engine routes processing based on the `kind` identifier.

| Kind | JSON format | Usage |
|---|---|---|
| `inline` | `{"kind":"inline","hash":"...","b64":"..."}` | Embedded baked mesh data stored directly within the scene file. |
| `asset` | `{"kind":"asset","path":"res://meshes/tree.mesh"}` | Reference to a standalone `.mesh` asset file. Recommended for reused geometry. |
| `gen` | `{"kind":"gen","script":"res://scripts/tree.lua","params":{...},"seed":42,"authority":"server"}` | Procedural mesh generated at load time via script execution. |

*Note: If `mesh_source` evaluates to empty, the engine falls back to the legacy `mesh` property primitive (`box`, `sphere`, `plane`, `cross`).*

---

## Generator authority

Generator-backed meshes require an `authority` parameter to determine where geometric computation occurs.

| Authority | Server computes mesh | Replicates vertex data | Client execution behavior | Collision behavior |
|---|---|---|---|---|
| `server` | Yes | Yes (chunked publish) | Receives and caches vertex data | Baked from server mesh |
| `client` | Yes (collision only) | No | Executes local generator using replicated seed | Baked from server mesh |

Assign `server` authority for gameplay-blocking geometry (e.g., terrain, structures) to ensure exact synchronization. Assign `client` authority for dense, non-blocking cosmetic elements (e.g., foliage) to optimize network bandwidth.

---

## Collision evaluation

The `collision_strategy` property on `MeshInstance3D` determines how Jolt evaluates the procedural mesh for physics interactions.

| Strategy | Shape type | Usage |
|---|---|---|
| `auto` | Engine-evaluated best fit | Default configuration. |
| `box` | Axis-aligned bounding box | Low-cost coarse collision. |
| `sphere` | Bounding sphere | Radial volumes. |
| `capsule` | Bounding capsule | Characters and cylindrical objects. |
| `convex` | Convex hull | Dynamic rigid bodies. |
| `vhacd` | Decomposed convex hulls | Concave dynamic bodies with moderate computational cost. |
| `mesh` | Exact concave triangle mesh | Static geometry requiring 1:1 precision (e.g., terrain). |

---

## Asset baking

The editor allows `MeshInstance3D` nodes with `mesh_source.kind == "gen"` to be baked into static assets:

1. The engine executes the generator script using the defined `params` and `seed`.
2. The resulting `ArrayMesh` serializes into a binary `.mesh` file within the active directory.
3. The node's `mesh_source` property is automatically overwritten to `{"kind":"asset","path":"..."}`.

Baked assets bypass load-time generation and replicate to clients as a standard `MeshPublish` packet.

---

## Script implementation

The following script generates a static planar mesh using the `SurfaceTool` API.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { SurfaceTool, MeshBuilder, MeshPrimitive } from "moud/mesh";

export default class Platform extends Node3D {
  @ready()
  onReady() {
    const st = SurfaceTool.begin(MeshPrimitive.TRIANGLES);
    st.setMaterial("res://materials/stone.mat");
    
    st.setNormal(0, 1, 0).setUv(0, 0); 
    const a = st.addVertex(-1, 0, -1);
    
    st.setUv(1, 0);                    
    const b = st.addVertex( 1, 0, -1);
    
    st.setUv(1, 1);                    
    const c = st.addVertex( 1, 0,  1);
    
    st.setUv(0, 1);                    
    const d = st.addVertex(-1, 0,  1);
    
    st.addTriangle(a, b, c).addTriangle(a, c, d);

    const mesh = new MeshBuilder().addSurface(st.end()).build();
    this.setMeshInline(mesh);
  }
}
```

--- tab: Luau
```lua
local st = SurfaceTool.begin("TRIANGLES")
st:set_material("res://materials/stone.mat")

st:set_normal(0, 1, 0):set_uv(0, 0)
local a = st:add_vertex(-1, 0, -1)

st:set_uv(1, 0)
local b = st:add_vertex( 1, 0, -1)

st:set_uv(1, 1)
local c = st:add_vertex( 1, 0,  1)

st:set_uv(0, 1)
local d = st:add_vertex(-1, 0,  1)

st:add_triangle(a, b, c):add_triangle(a, c, d)

local mesh = MeshBuilder.new():add_surface(st:end_surface()):build()
node:set_mesh_inline(mesh)
```
````
