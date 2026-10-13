import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { Collection, Database, Entity, EntityCreation, EntityMutation, Settings } from '../types';
import { getMockDatabase, MockApiError } from './mockDatabase';

interface MockRequest { url: string; method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; }
export interface AdminApiError { status: number; data: { message: string }; }

/** Swap this local transport for fetchBaseQuery when the server is ready; UI hooks stay the same. */
export const mockBaseQuery: BaseQueryFn<MockRequest, unknown, AdminApiError> = async (request, api) => {
  try {
    // A short delay makes the loading and disabled states part of the demo.
    await new Promise<void>((resolve) => setTimeout(resolve, 90));
    if (api.signal.aborted) return { error: { status: 499, data: { message: 'Solicitarea a fost anulată.' } } };
    const repository = getMockDatabase();
    switch (`${request.method ?? 'GET'} ${request.url}`) {
      case 'GET /database': return { data: repository.getDatabase() };
      case 'PATCH /entity': return { data: repository.updateEntity(request.body as EntityMutation) };
      case 'POST /entity': return { data: repository.createEntity(request.body as EntityCreation) };
      case 'DELETE /entity': repository.deleteEntity(request.body as { collection: Collection; id: string }); return { data: null };
      case 'PATCH /settings': return { data: repository.updateSettings(request.body as Partial<Settings>) };
      case 'POST /notifications/read': repository.markNotificationsRead(); return { data: null };
      case 'POST /reset': return { data: repository.resetDemo() };
      default: throw new MockApiError(404, 'Această funcție nu este disponibilă.');
    }
  } catch (error) {
    return { error: { status: error instanceof MockApiError ? error.status : 500, data: { message: error instanceof Error ? error.message : 'A apărut o eroare. Încearcă din nou.' } } };
  }
};

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Database'],
  endpoints: (builder) => ({
    getDatabase: builder.query<Database, void>({ query: () => ({ url: '/database' }), providesTags: ['Database'] }),
    updateEntity: builder.mutation<Entity, EntityMutation>({ query: (body) => ({ url: '/entity', method: 'PATCH', body }), invalidatesTags: (_result, error) => error ? [] : ['Database'] }),
    createEntity: builder.mutation<Entity, EntityCreation>({ query: (body) => ({ url: '/entity', method: 'POST', body }), invalidatesTags: (_result, error) => error ? [] : ['Database'] }),
    deleteEntity: builder.mutation<void, { collection: Collection; id: string }>({ query: (body) => ({ url: '/entity', method: 'DELETE', body }), invalidatesTags: (_result, error) => error ? [] : ['Database'] }),
    updateSettings: builder.mutation<Settings, Partial<Settings>>({ query: (body) => ({ url: '/settings', method: 'PATCH', body }), invalidatesTags: (_result, error) => error ? [] : ['Database'] }),
    markNotificationsRead: builder.mutation<void, void>({ query: () => ({ url: '/notifications/read', method: 'POST' }), invalidatesTags: (_result, error) => error ? [] : ['Database'] }),
    resetDemo: builder.mutation<Database, void>({ query: () => ({ url: '/reset', method: 'POST' }), invalidatesTags: (_result, error) => error ? [] : ['Database'] }),
  }),
});

export const { useGetDatabaseQuery, useUpdateEntityMutation, useCreateEntityMutation, useDeleteEntityMutation, useUpdateSettingsMutation, useMarkNotificationsReadMutation, useResetDemoMutation } = adminApi;
