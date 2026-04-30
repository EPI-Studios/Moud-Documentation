**AnvilWorld**

The `AnvilWorld` node loads and streams native Minecraft world data (Anvil `.mca` region files) into the scene's active Minestom instance at runtime. This node allows the simulation to inherit static, pre-authored voxel environments directly from external directory saves.

---

## Configuration

To instantiate an Anvil environment, assign the target directory path to the `world_path` property. The designated directory must contain a valid `region/` subdirectory hosting the `.mca` files.

| Property | Type | Default | Description |
|---|---|---|---|
| `world_path` | string | `""` | The project-relative path to the world directory containing the `region/` folder (e.g., `"worlds/lobby"`). An empty string aborts the load operation. |

### File structure

The parser expects the following directory hierarchy relative to the project root:

```text
project_root/
└── worlds/
    └── lobby/
        └── region/
            ├── r.0.0.mca
            ├── r.0.1.mca
            └── r.-1.0.mca
```
