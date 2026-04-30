# Procedural Meshes: Scripting API

The `SurfaceTool`, `MeshBuilder`, and `ArrayMesh` classes provide the programmatic interface for generating custom 3D geometry at runtime. Generated meshes are passed to `MeshInstance3D` nodes for rendering and collision evaluation. 

The API is accessed through the `api.mesh()` module (or `api:mesh()` in Luau) to instantiate `SurfaceToolHandle` and `MeshBuilderHandle` objects.

---

## SurfaceTool

The `SurfaceTool` constructs a single procedural surface. It utilizes a stateful configuration model; parameters such as normals and UV coordinates are maintained sequentially and applied to all subsequent vertex instantiations.

### Methods

| Method | Description |
|---|---|
| `api.mesh().surface_tool(primitive)` | Initializes a new surface. The `primitive` parameter currently restricts to `"TRIANGLES"`. Returns a `SurfaceToolHandle`. |
| `set_material(id)` | Assigns the material path for the active surface (e.g., `"res://materials/stone.mat"`). |
| `set_normal(x, y, z)` | Sets the normal vector for subsequently added vertices. |
| `set_uv(u, v)` | Sets the UV coordinate for subsequently added vertices. |
| `add_vertex(x, y, z)` | Appends a vertex utilizing the currently set normal and UV values. Returns its zero-based integer index. |
| `add_triangle(a, b, c)` | Defines a polygon utilizing three existing vertex indices. |
| `add_triangle_verts(ax..cz)` | Appends three discrete vertices and defines a triangle simultaneously. Optimal for flat-shaded geometry. |
| `generate_flat_normals()` | Computes and overwrites all vertex normals based on per-triangle face normals. |
| `end_surface()` | Seals the builder and returns a `Surface` object. Validates index count, finiteness, and primitive alignment. |

```hint warning Vertex limits
Individual surfaces enforce a maximum capacity of 65,535 vertices. Exceeding this limit throws a `MeshBuildException`. High-density geometry must be partitioned across multiple surfaces.
```

---

## MeshBuilder

The `MeshBuilder` aggregates one or more `Surface` objects into an immutable `ArrayMesh`. Content hashing and Axis-Aligned Bounding Box (AABB) computation execute during the build operation.

| Method | Description |
|---|---|
| `api.mesh().builder()` | Initializes an empty builder. Returns a `MeshBuilderHandle`. |
| `add_surface(surface)` | Appends a finalized `Surface` object to the mesh payload. |
| `build()` | Finalizes the geometry array and returns an `ArrayMesh`. Throws an exception if the surface count is zero. |

---

## ArrayMesh

An `ArrayMesh` is an immutable, value-typed object instantiated by `MeshBuilder.build()`. 

| Field | Type | Description |
|---|---|---|
| `hash` | string | A 128-bit geometric content hash. |
| `surfaces` | list[Surface] | An ordered array of surface subunits. The renderer issues one draw call per surface. |
| `bounds_min`, `bounds_max` | vec3 | The precomputed local-space AABB transform boundaries. |

The engine's `MeshRegistry` automatically deduplicates identical meshes based on their hash value, allowing scripts to distribute `ArrayMesh` instances without causing memory redundancy.

---

## Generator contract

A generator script exposes a `generate(ctx)` method that evaluates procedural logic and returns an `ArrayMesh`. The engine executes this method when a target node's `mesh_source.kind` property evaluates to `"gen"`.

```lua
-- res://scripts/plank.lua
return {
  generate = function(api, ctx)
    local w = ctx.params.width or 2.0
    local h = ctx.params.height or 0.2
    local d = ctx.params.depth or 1.0

    local st = api:mesh():surface_tool("TRIANGLES")
    st:set_material("res://materials/wood.mat")
    
    -- Vertex definition execution...
    
    return api:mesh():builder():add_surface(st:end_surface()):build()
  end
}
```

### Context (`ctx`) fields

| Field | Description |
|---|---|
| `params` | JSON object containing the `params` block defined in the node's `mesh_source` property. |
| `seed` | 64-bit integer evaluating the simulation seed. |
| `scope` | Evaluates as `"server"` or `"client"`. Permits conditional branching based on the active execution environment. |

### Determinism requirement

Generators must evaluate as strictly deterministic functions of the `(params, seed)` parameters. Executing non-deterministic variables (e.g., system time, unseeded `math.random()`, file I/O) disrupts client-server geometry synchronization and invalidates the collision bake sequence.

---

## Node attachment

Scripts apply generated geometry to the scene graph using the following API methods:

| Execution operation | API Call |
|---|---|
| Apply an `ArrayMesh` object to a node. | `api.mesh().attach_inline(nodeId, array_mesh)` |
| Apply a pre-baked `.mesh` asset file. | `api.mesh().attach_asset(nodeId, "res://meshes/tree.mesh")` |
| Revert the node to legacy property evaluation. | `api.mesh().clear_mesh_source(nodeId)` |
| Instantiate a new `MeshInstance3D` child node. | `api.mesh().spawn_mesh_child(parentId, "Tree")` |

---

## Materials

Each `Surface` accepts a single `material_id`. The renderer evaluates this string against standard asset pipelines (e.g., `res://materials/*.mat`, `res://materials/*.moudmat`). 

To apply multiple materials to a single procedural mesh, scripts must allocate distinct `Surface` objects for each material sector:

```lua
local walls = api:mesh():surface_tool("TRIANGLES"); walls:set_material("res://mat/stone.mat")
local trim  = api:mesh():surface_tool("TRIANGLES"); trim:set_material("res://mat/wood.mat")
local glass = api:mesh():surface_tool("TRIANGLES"); glass:set_material("res://mat/glass.mat")

local mesh = api:mesh():builder()
  :add_surface(walls:end_surface())
  :add_surface(trim:end_surface())
  :add_surface(glass:end_surface())
  :build()
```

Missing or invalid material paths render as a designated checkerboard debug texture.

---

## Collision evaluation

The `ProceduralMeshGeometrySource` class automatically computes physics collision bounds from generated mesh data. 

The target node's `collision_strategy` property determines the specific shape algorithm evaluated by the Jolt physics engine (`auto`, `box`, `sphere`, `capsule`, `convex`, `vhacd`, `mesh`). The `mesh` strategy evaluates an exact concave trimesh collider, which is optimal for static procedural environments.

---

## Parametric generation example

The following script and scene configuration demonstrate generating a cylindrical structure at runtime.

````tabs
--- tab: Luau
```lua
-- res://scripts/tower.lua
return {
  generate = function(api, ctx)
    local segments = ctx.params.segments or 8
    local radius   = ctx.params.radius   or 2.0
    local height   = ctx.params.height   or 10.0

    local st = api:mesh():surface_tool("TRIANGLES")
    st:set_material("res://materials/stone.mat")

    for i = 0, segments - 1 do
      local a0 = (i     / segments) * math.pi * 2
      local a1 = ((i+1) / segments) * math.pi * 2
      local x0, z0 = math.cos(a0) * radius, math.sin(a0) * radius
      local x1, z1 = math.cos(a1) * radius, math.sin(a1) * radius
      
      st:add_triangle_verts(x0, 0,      z0,  x1, 0,      z1,  x1, height, z1)
      st:add_triangle_verts(x0, 0,      z0,  x1, height, z1,  x0, height, z0)
    end

    st:generate_flat_normals()
    return api:mesh():builder():add_surface(st:end_surface()):build()
  end
}
```

--- tab: Scene property
```json
{
  "mesh_source": {
    "kind": "gen",
    "script": "res://scripts/tower.lua",
    "params": { "segments": 16, "radius": 3.5, "height": 18 },
    "seed": 1,
    "authority": "server"
  },
  "collision_strategy": "mesh"
}
```
````

---

## Exception handling

`MeshBuildException` errors surface through the `ScriptInvocationException` handler, providing stack trace details for debugging geometric evaluation failures.

| Exception | Cause |
|---|---|
| `MeshBuildException: vertex position must be finite` | Floating point arithmetic evaluated to NaN or Infinity during an `add_vertex` call. |
| `MeshBuildException: index N out of range` | `add_triangle` referenced an unallocated vertex index. |
| `MeshBuildException: triangle index count must be divisible by 3` | A polygon index array evaluated to an incomplete boundary. |
| `MeshBuildException: mesh has no surfaces` | Executed `build()` on an empty `MeshBuilderHandle`. |

---

## Blockbench (.bbmodel) integration

The engine natively evaluates Blockbench (`.bbmodel`) files as procedural mesh sources. The `BbmodelGeometrySource` class parses the model's structural hierarchy (cubes and meshes) to automatically compute Jolt collision shapes and render surfaces.

Asset integration requires referencing the `.bbmodel` file directly within a node's `mesh_source` property. The designated `collision_strategy` on the parent node determines the physics approximation evaluated by the simulator (e.g., `mesh` for concave trimeshes, `convex` for basic hull constraints).