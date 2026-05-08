/**
 * offlineDB.js — IndexedDB wrapper via Dexie.js
 * Stores: cattle, milkRecords, alerts, syncQueue, expenses
 */

import Dexie from 'dexie';

const db = new Dexie('NiralFarmDB');

db.version(1).stores({
  cattle:      '++id, serverId, name, breed, health, tagId',
  milkRecords: '++id, serverId, cowId, date',
  alerts:      '++id, serverId, type, resolved, cowId',
  syncQueue:   '++id, action, entity, createdAt, retries',
  expenses:    '++id, serverId, category, date, amount',
});

// ── Cattle ────────────────────────────────────────────────────────────────────
export const cattleDB = {
  getAll:     ()        => db.cattle.toArray(),
  upsert:     (item)    => db.cattle.put(item),
  upsertMany: (items)   => db.cattle.bulkPut(items),
  remove:     (id)      => db.cattle.delete(id),
  clear:      ()        => db.cattle.clear(),
};

// ── Milk Records ──────────────────────────────────────────────────────────────
export const milkDB = {
  getAll:     ()           => db.milkRecords.toArray(),
  upsert:     (item)       => db.milkRecords.put(item),
  upsertMany: (items)      => db.milkRecords.bulkPut(items),
  byCow:      (cowId)      => db.milkRecords.where('cowId').equals(cowId).toArray(),
  byDate:     (date)       => db.milkRecords.where('date').equals(date).toArray(),
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsDB = {
  getAll:     ()      => db.alerts.toArray(),
  upsert:     (item)  => db.alerts.put(item),
  upsertMany: (items) => db.alerts.bulkPut(items),
  resolve:    (id)    => db.alerts.update(id, { resolved: true }),
  active:     ()      => db.alerts.where('resolved').equals(0).toArray(),
};

// ── Sync Queue ────────────────────────────────────────────────────────────────
export const syncQueueDB = {
  push:    (item)  => db.syncQueue.add({ ...item, createdAt: Date.now(), retries: 0 }),
  getAll:  ()      => db.syncQueue.orderBy('createdAt').toArray(),
  remove:  (id)    => db.syncQueue.delete(id),
  incRetry:(id)    => db.syncQueue.where('id').equals(id).modify(item => { item.retries++; }),
  count:   ()      => db.syncQueue.count(),
  clear:   ()      => db.syncQueue.clear(),
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expensesDB = {
  getAll:     ()           => db.expenses.toArray(),
  upsert:     (item)       => db.expenses.put(item),
  upsertMany: (items)      => db.expenses.bulkPut(items),
  byDate:     (date)       => db.expenses.where('date').equals(date).toArray(),
  remove:     (id)         => db.expenses.delete(id),
};

export default db;
