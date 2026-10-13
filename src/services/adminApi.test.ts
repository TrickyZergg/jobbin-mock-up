import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../store';
import { adminApi } from './adminApi';
import { getMockDatabase } from './mockDatabase';

describe('RTK Query admin API', () => {
  let store = createAppStore();
  beforeEach(() => {
    getMockDatabase().resetDemo();
    store = createAppStore();
  });
  afterEach(() => { store.dispatch(adminApi.util.resetApiState()); });

  it('refetches a subscribed database after a successful mutation', async () => {
    const subscription = store.dispatch(adminApi.endpoints.getDatabase.initiate());
    await subscription.unwrap();
    expect(adminApi.endpoints.getDatabase.select()(store.getState()).data?.candidates[0].status).toBe('Activ');
    await store.dispatch(adminApi.endpoints.updateEntity.initiate({ collection: 'candidates', id: 'cand-1', changes: { status: 'Suspendat' } })).unwrap();
    await vi.waitFor(() => {
      const query = adminApi.endpoints.getDatabase.select()(store.getState());
      expect(query.status).toBe('fulfilled');
      expect(query.data?.candidates[0].status).toBe('Suspendat');
      expect(query.data?.activity[0].description).toContain('Andreea Popescu');
    });
    subscription.unsubscribe();
  });

  it('surfaces Romanian validation errors and leaves cached data untouched', async () => {
    const subscription = store.dispatch(adminApi.endpoints.getDatabase.initiate());
    const initial = await subscription.unwrap();
    await expect(store.dispatch(adminApi.endpoints.updateEntity.initiate({ collection: 'jobs', id: 'missing', changes: { status: 'Activ' } })).unwrap()).rejects.toMatchObject({ status: 404, data: { message: expect.stringContaining('nu mai există') } });
    expect(adminApi.endpoints.getDatabase.select()(store.getState()).data).toEqual(initial);
    subscription.unsubscribe();
  });

  it('invalidates cached collections after creates and deletes', async () => {
    const subscription = store.dispatch(adminApi.endpoints.getDatabase.initiate());
    await subscription.unwrap();
    const created = await store.dispatch(adminApi.endpoints.createEntity.initiate({ collection: 'events', record: { id: 'event-test', title: 'Atelier de carieră' } })).unwrap();
    expect(created.id).toBe('event-test');
    await vi.waitFor(() => expect(adminApi.endpoints.getDatabase.select()(store.getState()).data?.events).toHaveLength(7));
    await store.dispatch(adminApi.endpoints.deleteEntity.initiate({ collection: 'events', id: 'event-test' })).unwrap();
    await vi.waitFor(() => expect(adminApi.endpoints.getDatabase.select()(store.getState()).data?.events).toHaveLength(6));
    subscription.unsubscribe();
  });

  it('refreshes settings, notifications and reset results through the same query cache', async () => {
    const subscription = store.dispatch(adminApi.endpoints.getDatabase.initiate());
    await subscription.unwrap();
    await store.dispatch(adminApi.endpoints.updateSettings.initiate({ weeklyReport: false })).unwrap();
    await vi.waitFor(() => expect(adminApi.endpoints.getDatabase.select()(store.getState()).data?.settings.weeklyReport).toBe(false));
    await store.dispatch(adminApi.endpoints.markNotificationsRead.initiate()).unwrap();
    await vi.waitFor(() => expect(adminApi.endpoints.getDatabase.select()(store.getState()).data?.notifications.every((item) => item.read)).toBe(true));
    await store.dispatch(adminApi.endpoints.resetDemo.initiate()).unwrap();
    await vi.waitFor(() => {
      const database = adminApi.endpoints.getDatabase.select()(store.getState()).data;
      expect(database?.settings.weeklyReport).toBe(true);
      expect(database?.notifications.some((item) => !item.read)).toBe(true);
    });
    subscription.unsubscribe();
  });
});
