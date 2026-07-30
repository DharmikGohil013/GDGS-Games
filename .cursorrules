# Phaser Editor v5 & MCP Integration Rules

## Overview
This project integrates `@phaserjs/editor-mcp-server` to connect Phaser Editor v5 with LLM assistants for scene creation, tilemap management, sprite animation handling, and game level generation.

## MCP Server Configuration
The MCP server configuration is located in `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "phaser-editor": {
      "command": "npx",
      "args": ["@phaserjs/editor-mcp-server"]
    }
  }
}
```

## Available MCP Toolset

### IDE Tools
- `ide-get-all-scenes-in-project`: List all scene files
- `ide-get-active-scene`: Query currently focused editor scene
- `ide-open-scene`: Open target scene in editor
- `ide-create-new-scene`: Create new scene file
- `ide-save-scene`: Commit editor state of a scene

### Asset Tools
- `assets-get-available-textures`: Query texture atlas & standalone images
- `assets-get-available-bitmapfonts`: Query bitmap font descriptors
- `assets-get-available-animations`: Query sprite animations
- `assets-get-available-tilemaps`: Query Tiled JSON tilemaps

### Scene & Game Object Tools
- `scene-get-scene-data`: Inspect game object hierarchy & properties
- `scene-add-game-objects`: Programmatically insert game objects into scene
- `scene-update-game-objects`: Modify game object coordinates, scale, and properties
- `scene-delete-game-objects`: Remove game objects from render list

### Editable Tilemap Tools
- `scene-add-editable-tilemap`: Add interactive tilemaps
- `scene-write-editable-tilemap-layer-data`: Modify tile data per layer
- `scene-fill-editable-tilemap-layer-data`: Fill tile region by ID

## Level Generation & Training Scene Workflow
For LLM-driven level generation:
1. Maintain descriptive layer naming (e.g. `platforms`, `collectibles`, `hazards`, `decorations`).
2. Keep training scenes with clear single-purpose object layers.
