import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TABLE_MANAGEMENT_URL = `${BASE_URL}/apps/pos/table-management`;

// Helper functions
async function navigateToTableManagement(page: Page) {
  await page.goto(TABLE_MANAGEMENT_URL);
  await expect(page.locator('h1')).toContainText('Table Management');
}

async function addTable(page: Page, shape: 'round' | 'square' | 'rect' = 'round') {
  const addButton = page.locator(`button:has-text("${shape === 'round' ? 'Round' : shape === 'square' ? 'Square' : 'Rectangle'}")`);
  await addButton.click();
  
  // Wait for table to appear on canvas
  await page.waitForSelector('[data-testid="table-node"]', { timeout: 5000 });
}

async function selectTable(page: Page, tableId: string) {
  await page.locator(`[data-testid="table-node"][data-table-id="${tableId}"]`).click();
}

async function saveDraft(page: Page) {
  await page.locator('button:has-text("Save Draft")').click();
  // Wait for success message
  await expect(page.locator('.toast')).toContainText('Draft saved successfully');
}

async function activateLayout(page: Page) {
  await page.locator('button:has-text("Activate Layout")').click();
  // Confirm activation
  await page.locator('button:has-text("Confirm Activation")').click();
  // Wait for success message
  await expect(page.locator('.toast')).toContainText('Layout activated successfully');
}

// Test Suite: Table Management E2E
test.describe('Table Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database state
    await page.request.post(`${BASE_URL}/api/test/reset-tables`);
  });

  // AC-001: Add tables + default sizes + snap + labels
  test('AC-001: Add tables with default sizes and auto labels', async ({ page }) => {
    await navigateToTableManagement(page);

    // Add round table
    await addTable(page, 'round');
    let tables = page.locator('[data-testid="table-node"]');
    await expect(tables).toHaveCount(1);
    
    // Verify default size and label
    const roundTable = tables.first();
    await expect(roundTable).toHaveAttribute('data-width', '60');
    await expect(roundTable).toHaveAttribute('data-height', '60');
    await expect(roundTable.locator('.table-label')).toContainText('T1');

    // Add square table
    await addTable(page, 'square');
    await expect(page.locator('[data-testid="table-node"]')).toHaveCount(2);
    
    // Verify second table has auto-incremented label
    const secondTable = page.locator('[data-testid="table-node"]').nth(1);
    await expect(secondTable.locator('.table-label')).toContainText('T2');

    // Add rectangle table
    await addTable(page, 'rect');
    await expect(page.locator('[data-testid="table-node"]')).toHaveCount(3);
    
    // Verify rectangle default size
    const rectTable = page.locator('[data-testid="table-node"]').nth(2);
    await expect(rectTable).toHaveAttribute('data-width', '100');
    await expect(rectTable).toHaveAttribute('data-height', '60');
  });

  // AC-002: Drag/Resize + keyboard + snap + bounds
  test('AC-002: Drag, resize, keyboard navigation with snap-to-grid', async ({ page }) => {
    await navigateToTableManagement(page);
    await addTable(page, 'round');

    const table = page.locator('[data-testid="table-node"]').first();
    await selectTable(page, 'T1');

    // Test drag with snap-to-grid
    const initialBox = await table.boundingBox();
    expect(initialBox).not.toBeNull();
    
    await table.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 50, initialBox!.y + 50);
    await page.mouse.up();

    // Verify position snapped to grid (8px grid)
    const newBox = await table.boundingBox();
    expect(newBox!.x % 8).toBe(0);
    expect(newBox!.y % 8).toBe(0);

    // Test keyboard nudging
    await table.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    
    // Verify table moved by grid increments
    const nudgedBox = await table.boundingBox();
    expect(nudgedBox!.x).toBeGreaterThan(newBox!.x);
    expect(nudgedBox!.y).toBeGreaterThan(newBox!.y);

    // Test resize
    const resizeHandle = page.locator('[data-testid="resize-handle-br"]');
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(nudgedBox!.x + 100, nudgedBox!.y + 100);
    await page.mouse.up();

    // Verify table resized
    const resizedBox = await table.boundingBox();
    expect(resizedBox!.width).toBeGreaterThan(60);
    expect(resizedBox!.height).toBeGreaterThan(60);
  });

  // AC-003: Save/Reload draft (exact restoration)
  test('AC-003: Save and reload draft with exact restoration', async ({ page }) => {
    await navigateToTableManagement(page);
    
    // Create layout with multiple tables
    await addTable(page, 'round');
    await addTable(page, 'square');
    await addTable(page, 'rect');

    // Move tables to specific positions
    const table1 = page.locator('[data-testid="table-node"]').nth(0);
    const table2 = page.locator('[data-testid="table-node"]').nth(1);
    
    await table1.hover();
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();

    await table2.hover();
    await page.mouse.down();
    await page.mouse.move(400, 300);
    await page.mouse.up();

    // Save draft
    await saveDraft(page);

    // Reload page
    await page.reload();
    await navigateToTableManagement(page);

    // Verify layout restored exactly
    await expect(page.locator('[data-testid="table-node"]')).toHaveCount(3);
    
    const restoredTable1 = page.locator('[data-testid="table-node"]').nth(0);
    const restoredTable2 = page.locator('[data-testid="table-node"]').nth(1);
    
    const box1 = await restoredTable1.boundingBox();
    const box2 = await restoredTable2.boundingBox();
    
    // Verify positions restored (allowing for small margin due to snap-to-grid)
    expect(Math.abs(box1!.x - 200)).toBeLessThan(10);
    expect(Math.abs(box1!.y - 200)).toBeLessThan(10);
    expect(Math.abs(box2!.x - 400)).toBeLessThan(10);
    expect(Math.abs(box2!.y - 300)).toBeLessThan(10);
  });

  // AC-004: Properties panel (ID unique, capacity ≥1, shape switch)
  test('AC-004: Properties panel validation and controls', async ({ page }) => {
    await navigateToTableManagement(page);
    await addTable(page, 'round');
    
    await selectTable(page, 'T1');

    // Verify properties panel appears
    const propertiesPanel = page.locator('[data-testid="table-properties-panel"]');
    await expect(propertiesPanel).toBeVisible();

    // Test capacity validation (≥1)
    const capacityInput = propertiesPanel.locator('input[name="capacity"]');
    await capacityInput.fill('0');
    await capacityInput.blur();
    
    // Should show validation error
    await expect(propertiesPanel.locator('.error-message')).toContainText('Capacity must be at least 1');
    
    // Fix capacity
    await capacityInput.fill('4');
    await capacityInput.blur();
    await expect(propertiesPanel.locator('.error-message')).toHaveCount(0);

    // Test shape switching
    const shapeSelect = propertiesPanel.locator('select[name="shape"]');
    await shapeSelect.selectOption('square');
    
    // Verify table shape changed
    const table = page.locator('[data-testid="table-node"][data-table-id="T1"]');
    await expect(table).toHaveClass(/shape-square/);

    // Test unique ID constraint
    const labelInput = propertiesPanel.locator('input[name="label"]');
    await labelInput.fill('T1'); // Same ID
    await labelInput.blur();
    
    // Should show duplicate ID error when we add another table
    await addTable(page, 'round');
    await expect(page.locator('.validation-error')).toContainText('Table ID must be unique');
  });

  // AC-005: FE+BE Duplicate ID guard
  test('AC-005: Duplicate ID prevention frontend and backend', async ({ page }) => {
    await navigateToTableManagement(page);
    
    // Add table and change its ID
    await addTable(page, 'round');
    await selectTable(page, 'T1');
    
    const propertiesPanel = page.locator('[data-testid="table-properties-panel"]');
    const labelInput = propertiesPanel.locator('input[name="label"]');
    await labelInput.fill('TABLE_A');
    
    // Add second table and try to set same ID
    await addTable(page, 'square');
    await selectTable(page, 'T2');
    await labelInput.fill('TABLE_A');
    await labelInput.blur();

    // Frontend should prevent duplicate
    await expect(page.locator('.validation-error')).toContainText('duplicate');

    // Test backend validation by direct API call
    const response = await page.request.post(`${BASE_URL}/api/pos/floor/layout/draft`, {
      headers: { 'x-tenant-id': 'test-tenant' },
      data: {
        floorId: 'test-floor',
        layoutDraft: {
          tables: [
            { id: 'DUPLICATE', x: 0, y: 0, w: 60, h: 60, shape: 'round', capacity: 4, seats: 4 },
            { id: 'DUPLICATE', x: 100, y: 0, w: 60, h: 60, shape: 'square', capacity: 4, seats: 4 }
          ],
          zones: []
        }
      }
    });

    expect(response.status()).toBe(400);
    const errorData = await response.json();
    expect(errorData.error).toBe('DUPLICATE_TABLE_ID');
  });

  // AC-006: No overlap (visual + save blocked)
  test('AC-006: Overlap detection with visual feedback and save blocking', async ({ page }) => {
    await navigateToTableManagement(page);
    
    // Add two tables
    await addTable(page, 'round');
    await addTable(page, 'round');

    const table1 = page.locator('[data-testid="table-node"]').nth(0);
    const table2 = page.locator('[data-testid="table-node"]').nth(1);

    // Move table2 to overlap with table1
    await table2.hover();
    await page.mouse.down();
    const table1Box = await table1.boundingBox();
    await page.mouse.move(table1Box!.x + 10, table1Box!.y + 10);
    await page.mouse.up();

    // Should show overlap warning
    await expect(page.locator('.overlap-warning')).toBeVisible();
    await expect(page.locator('.overlap-warning')).toContainText('Overlapping tables detected');

    // Tables should have red outline
    await expect(table1).toHaveClass(/overlap-error/);
    await expect(table2).toHaveClass(/overlap-error/);

    // Save button should be disabled
    const saveButton = page.locator('button:has-text("Save Draft")');
    await expect(saveButton).toBeDisabled();

    // Move table2 away from overlap
    await table2.hover();
    await page.mouse.down();
    await page.mouse.move(table1Box!.x + 200, table1Box!.y);
    await page.mouse.up();

    // Overlap warning should disappear
    await expect(page.locator('.overlap-warning')).toHaveCount(0);
    await expect(saveButton).toBeEnabled();
  });

  // AC-007: Zones (create/assign/filter + legend)
  test('AC-007: Zone management with legend and filtering', async ({ page }) => {
    await navigateToTableManagement(page);
    
    // Create a zone
    await page.locator('button:has-text("Add Zone")').click();
    
    const zoneDialog = page.locator('[data-testid="zone-dialog"]');
    await zoneDialog.locator('input[name="name"]').fill('VIP Section');
    await zoneDialog.locator('input[name="color"]').fill('#ff0000');
    await zoneDialog.locator('button:has-text("Create")').click();

    // Verify zone appears in legend
    const zoneLegend = page.locator('[data-testid="zone-legend"]');
    await expect(zoneLegend.locator('text=VIP Section')).toBeVisible();

    // Add table and assign to zone
    await addTable(page, 'round');
    await selectTable(page, 'T1');
    
    const propertiesPanel = page.locator('[data-testid="table-properties-panel"]');
    await propertiesPanel.locator('select[name="zone"]').selectOption('VIP Section');

    // Verify table shows zone color
    const table = page.locator('[data-testid="table-node"][data-table-id="T1"]');
    await expect(table).toHaveCSS('border-color', 'rgb(255, 0, 0)');

    // Test zone visibility toggle
    await zoneLegend.locator('button[data-testid="toggle-zone-visibility"]').click();
    
    // Table should be hidden/dimmed
    await expect(table).toHaveClass(/zone-hidden/);
  });

  // AC-008: Merge/Split with metadata childIds
  test('AC-008: Table merge and split operations', async ({ page }) => {
    await navigateToTableManagement(page);
    
    // Add two adjacent tables
    await addTable(page, 'square');
    await addTable(page, 'square');

    // Position tables adjacently
    const table1 = page.locator('[data-testid="table-node"]').nth(0);
    const table2 = page.locator('[data-testid="table-node"]').nth(1);
    
    await table1.hover();
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();

    await table2.hover();
    await page.mouse.down();
    await page.mouse.move(260, 200); // Adjacent position
    await page.mouse.up();

    // Select merge tool
    await page.locator('button:has-text("Merge Tables")').click();
    
    // Select both tables
    await page.locator('[data-testid="merge-mode"] input[data-table-id="T1"]').check();
    await page.locator('[data-testid="merge-mode"] input[data-table-id="T2"]').check();
    
    // Merge tables
    await page.locator('button:has-text("Merge Selected")').click();

    // Verify merged table exists
    await expect(page.locator('[data-testid="table-node"]')).toHaveCount(1);
    const mergedTable = page.locator('[data-testid="table-node"]').first();
    
    // Verify merged table properties
    await expect(mergedTable.locator('.table-label')).toContainText('T1+T2');
    await expect(mergedTable).toHaveAttribute('data-capacity', '8'); // Combined capacity

    // Test split operation
    await mergedTable.click();
    await page.locator('button:has-text("Split Table")').click();

    // Verify tables split back to original
    await expect(page.locator('[data-testid="table-node"]')).toHaveCount(2);
  });

  // AC-010: Status change realtime broadcast
  test('AC-010: Real-time table status updates', async ({ page, context }) => {
    // Open two browser tabs to test real-time sync
    const page2 = await context.newPage();
    
    await navigateToTableManagement(page);
    await navigateToTableManagement(page2);

    // Add table in first page
    await addTable(page, 'round');
    await activateLayout(page);

    // Change table status in first page
    await selectTable(page, 'T1');
    await page.locator('button:has-text("Mark as Seated")').click();

    // Verify status change appears in second page
    await expect(page2.locator('[data-testid="table-node"][data-table-id="T1"]')).toHaveClass(/status-seated/);
    
    await page2.close();
  });

  // AC-011: Reservations with conflict detection
  test('AC-011: Reservation system with conflict detection', async ({ page }) => {
    await navigateToTableManagement(page);
    await addTable(page, 'round');
    await activateLayout(page);

    await selectTable(page, 'T1');
    
    // Open reservations panel
    await page.locator('button:has-text("Reservations")').click();
    
    const reservationPanel = page.locator('[data-testid="reservation-panel"]');
    
    // Create first reservation
    await reservationPanel.locator('button:has-text("New Reservation")').click();
    await reservationPanel.locator('input[name="customerName"]').fill('John Doe');
    await reservationPanel.locator('input[name="partySize"]').fill('4');
    await reservationPanel.locator('input[name="date"]').fill('2025-09-05');
    await reservationPanel.locator('input[name="startTime"]').fill('19:00');
    await reservationPanel.locator('input[name="endTime"]').fill('21:00');
    await reservationPanel.locator('button:has-text("Create")').click();

    await expect(page.locator('.toast')).toContainText('Reservation created');

    // Try to create conflicting reservation
    await reservationPanel.locator('button:has-text("New Reservation")').click();
    await reservationPanel.locator('input[name="customerName"]').fill('Jane Smith');
    await reservationPanel.locator('input[name="partySize"]').fill('2');
    await reservationPanel.locator('input[name="date"]').fill('2025-09-05');
    await reservationPanel.locator('input[name="startTime"]').fill('20:00');
    await reservationPanel.locator('input[name="endTime"]').fill('22:00');
    await reservationPanel.locator('button:has-text("Create")').click();

    // Should show conflict error
    await expect(page.locator('.error-message')).toContainText('conflict');
  });

  // AC-012: Versioning with stale version rejection
  test('AC-012: Optimistic locking with stale version detection', async ({ page, context }) => {
    const page2 = await context.newPage();
    
    await navigateToTableManagement(page);
    await navigateToTableManagement(page2);

    // Both pages add tables
    await addTable(page, 'round');
    await addTable(page2, 'square');

    // First page saves successfully
    await saveDraft(page);
    await expect(page.locator('.toast')).toContainText('Draft saved');

    // Second page tries to save (should fail with stale version)
    await saveDraft(page2);
    await expect(page2.locator('.error-message')).toContainText('modified by another user');

    await page2.close();
  });
});

// Test Suite: API Integration Tests
test.describe('Table Management API Tests', () => {
  test('Draft API handles validation errors correctly', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/pos/floor/layout/draft`, {
      headers: { 'x-tenant-id': 'test-tenant' },
      data: {
        floorId: 'test-floor',
        layoutDraft: {
          tables: [
            { id: 'T1', x: 0, y: 0, w: 60, h: 60, shape: 'round', capacity: 0, seats: 0 }, // Invalid capacity
          ],
          zones: []
        }
      }
    });

    expect(response.status()).toBe(400);
    const errorData = await response.json();
    expect(errorData.error).toContain('VALIDATION_ERROR');
  });

  test('Activation API validates layout before activation', async ({ page }) => {
    // Create invalid layout (overlapping tables)
    await page.request.post(`${BASE_URL}/api/pos/floor/layout/draft`, {
      headers: { 'x-tenant-id': 'test-tenant' },
      data: {
        floorId: 'test-floor',
        layoutDraft: {
          tables: [
            { id: 'T1', x: 0, y: 0, w: 60, h: 60, shape: 'round', capacity: 4, seats: 4 },
            { id: 'T2', x: 10, y: 10, w: 60, h: 60, shape: 'round', capacity: 4, seats: 4 }, // Overlapping
          ],
          zones: []
        }
      }
    });

    // Try to activate
    const response = await page.request.put(`${BASE_URL}/api/pos/floor/layout/activate`, {
      headers: { 'x-tenant-id': 'test-tenant' },
      data: {
        floorId: 'test-floor',
        expectVersion: 1
      }
    });

    expect(response.status()).toBe(400);
    const errorData = await response.json();
    expect(errorData.error).toBe('INVALID_LAYOUT');
    expect(errorData.message).toContain('overlap');
  });
});
