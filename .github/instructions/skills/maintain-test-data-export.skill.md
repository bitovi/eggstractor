# Skill: MaintainTestDataExport

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the test data export feature without breaking the serialization pipeline or fixture delivery flow.

## Implementation — Main Thread

- File: `packages/figma/src/index.ts`
- Triggered by: `{ type: 'export-test-data' }` message from UI
- Handler calls: `serializeFigmaData(figma.currentPage.selection[0])` (TBD — see TODO)
- Sends result: `{ type: 'test-data-exported', data: string }` back to UI

## Implementation — Serialization

- File: `packages/figma/src/utils/serialize-figma-data.utils.ts`
- Export: `serializeFigmaData(node: BaseNode): Promise<unknown>`

## Implementation — UI Trigger

- File: `packages/ui/src/app/routes/Export/` (likely `ExportTestDataButton` component)
- Visible only when `__DEV__` flag is truthy
- Sends `{ type: 'export-test-data' }` via `messageMainThread()`
- Receives `{ type: 'test-data-exported', data }` via `useOnPluginMessage()`
- Delivers JSON to user (download or clipboard copy — TBD)

## `TestDataExportedPayload` Shape

```typescript
interface TestDataExportedPayload {
  type: 'test-data-exported';
  data: string; // JSON-serialized Figma node data
}
```

## Workflow

```
1. Developer selects a Figma node
2. Clicks ExportTestDataButton in plugin UI (dev mode only)
3. Main thread calls serializeFigmaData() on selected node
4. JSON string sent to UI via 'test-data-exported'
5. Developer saves JSON to packages/figma/src/tests/fixtures/
6. Fixture used in processor/transformer tests via createTestData()
```

## TODO

- [ ] Document `serializeFigmaData()` — what Figma node properties does it serialize? Does it recurse into children?
- [ ] Document whether ExportTestDataButton triggers download, clipboard copy, or displays inline
- [ ] Confirm which node is serialized — `figma.currentPage.selection[0]` or the entire page?
- [ ] Document `__DEV__` flag injection — how is it set at build time?
- [ ] Document the JSON fixture schema that `createTestData()` expects to consume
