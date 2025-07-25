# Dining Area Setup Workflow

## UI Wireframe / Flowchart

```mermaid
flowchart TD
  Sidebar["Sidebar: Setup"]
  DiningArea["Dining Area Setup"]
  AddArea["+ Add Area"]
  AreaBlock["Area Block (e.g., Outdoor)"]
  AreaConfig["Configure Area\n(name, icon, capacity)"]
  AddTable["+ Add Table"]
  TableConfig["Configure Table\n(label, seats, shape, notes, color, QR, waiter)"]
  SaveSetup["Save Setup"]
  ExportImport["Export/Import"]

  Sidebar --> DiningArea
  DiningArea --> AddArea
  AddArea --> AreaBlock
  AreaBlock --> AreaConfig
  AreaBlock --> AddTable
  AddTable --> TableConfig
  DiningArea --> SaveSetup
  DiningArea --> ExportImport

  %% Visual grouping for multiple areas
  AreaBlock -.-> AreaBlock2["Area Block (e.g., Indoor)"]
  AreaBlock2 --> AreaConfig
  AreaBlock2 --> AddTable
  AddTable -.-> TableConfig2["Configure Table (for Area 2)"]

  %% Notes
  classDef note fill:#fffbe6,stroke:#e6c200,color:#b59f00;
  Note1["Each Area Block lists its tables.\nEach table can be edited inline or via modal."]:::note
  Note2["Save Setup syncs to Table Management, Reservations, Order Entry."]:::note
  DiningArea --- Note1
  SaveSetup --- Note2
```

## Key UI/UX Flow
- **Sidebar:** "Setup" > "Dining Area Setup"
- **Main Area:**
  - "+ Add Area" button
  - For each area: Area block with config, "+ Add Table" inside area
  - For each table: Table config (label, seats, shape, notes, color, QR, waiter)
  - "Save Setup" and "Export/Import" at the bottom

**Notes:**
- Each area block lists its tables.
- Each table can be edited inline or via modal.
- Saving setup syncs changes to all relevant modules (Table Management, Reservations, Order Entry). 