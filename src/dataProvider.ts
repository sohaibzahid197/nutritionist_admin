import type { DataProvider, GetListParams } from 'react-admin';
import { request, type Paginated } from './api';

/**
 * Adapts the Balanced Roots API to React-Admin.
 *
 * Three mismatches to bridge:
 *   - lists answer `{ items, total, page, limit }`, React-Admin wants `{ data, total }`
 *   - paging is `page` / `limit`, not the `range` React-Admin sends by default
 *   - sorting is `sortBy` / `sortOrder` and each endpoint only accepts a fixed set of
 *     columns, so an unsupported sort is dropped rather than sent and rejected
 */

type ResourceConfig = {
  path: string;
  /** Field to expose as React-Admin's `id`. Defaults to `id`. */
  idKey?: string;
  /** Columns the endpoint will actually sort by. */
  sortable?: string[];
  /** Endpoint returns `{ items }` with no paging. */
  unpaginated?: boolean;
  /** Reshape a single record — some endpoints wrap the row in an envelope. */
  transformOne?: (body: any) => any;
  /** Endpoints that upsert on PUT /path/:id rather than POST /path. */
  upsertById?: boolean;
};

const RESOURCES: Record<string, ResourceConfig> = {
  users: {
    path: '/admin/users',
    sortable: ['name', 'email', 'createdAt', 'expiresOn'],
    // GET /admin/users/:id answers { user, entitlement, macroTarget, grants }.
    transformOne: (body) => ({ ...body.user, entitlement: body.entitlement, macroTarget: body.macroTarget, grants: body.grants }),
  },
  subscriptions: {
    path: '/admin/subscriptions',
    sortable: ['expiresOn', 'purchasedAt', 'programStartsOn', 'createdAt'],
  },
  support: {
    path: '/admin/support',
  },
  settings: {
    path: '/admin/settings',
    idKey: 'key',
    unpaginated: true,
    upsertById: true,
  },
  plans: {
    path: '/plans',
  },
  reports: {
    path: '/admin/reports',
  },
  'delete-requests': {
    path: '/admin/delete-requests',
  },
};

const configFor = (resource: string): ResourceConfig => {
  const config = RESOURCES[resource];
  if (!config) throw new Error(`Unknown admin resource "${resource}"`);
  return config;
};

/** React-Admin requires an `id` on every record; some of ours are keyed by name. */
const withId = (config: ResourceConfig, record: any) => {
  const idKey = config.idKey ?? 'id';
  if (idKey === 'id') return record;
  return { ...record, id: record[idKey] };
};

const listQuery = (config: ResourceConfig, params: GetListParams) => {
  const { page = 1, perPage = 25 } = params.pagination ?? {};
  const { field, order } = params.sort ?? {};

  const query: Record<string, unknown> = { ...params.filter };

  if (!config.unpaginated) {
    query.page = page;
    query.limit = Math.min(perPage, 100);
  }

  // Silently drop a sort the endpoint cannot honour — Joi would reject the whole request.
  if (field && config.sortable?.includes(field)) {
    query.sortBy = field;
    query.sortOrder = (order ?? 'ASC').toLowerCase();
  }

  return query;
};

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const config = configFor(resource);
    const body = await request<Paginated<any> | { items: any[] }>(config.path, {
      query: listQuery(config, params),
    });

    const items = (body.items ?? []).map((row) => withId(config, row));
    const total = 'total' in body && typeof body.total === 'number' ? body.total : items.length;

    return { data: items, total };
  },

  getOne: async (resource, params) => {
    const config = configFor(resource);
    const body = await request<any>(`${config.path}/${params.id}`);
    const record = config.transformOne ? config.transformOne(body) : body;
    return { data: withId(config, record) };
  },

  getMany: async (resource, params) => {
    const config = configFor(resource);

    // No bulk endpoint exists, so fetch individually. Failures resolve to null and are
    // filtered out rather than failing the whole reference lookup.
    const rows = await Promise.all(
      params.ids.map((id) =>
        request<any>(`${config.path}/${id}`)
          .then((body) => (config.transformOne ? config.transformOne(body) : body))
          .catch(() => null)
      )
    );

    return { data: rows.filter(Boolean).map((row) => withId(config, row)) };
  },

  getManyReference: async (resource, params) => {
    const config = configFor(resource);
    const body = await request<Paginated<any> | { items: any[] }>(config.path, {
      query: { ...listQuery(config, params as GetListParams), [params.target]: params.id },
    });

    const items = (body.items ?? []).map((row) => withId(config, row));
    const total = 'total' in body && typeof body.total === 'number' ? body.total : items.length;
    return { data: items, total };
  },

  create: async (resource, params) => {
    const config = configFor(resource);

    if (config.upsertById) {
      const idKey = config.idKey ?? 'id';
      const id = (params.data as any)[idKey];
      if (!id) throw new Error(`"${idKey}" is required`);
      const { [idKey]: _omitted, ...rest } = params.data as Record<string, unknown>;
      const body = await request<any>(`${config.path}/${id}`, { method: 'PUT', body: rest });
      return { data: withId(config, body) };
    }

    const body = await request<any>(config.path, { method: 'POST', body: params.data });
    return { data: withId(config, body) };
  },

  update: async (resource, params) => {
    const config = configFor(resource);
    const idKey = config.idKey ?? 'id';
    const { id: _id, [idKey]: _key, ...rest } = params.data as Record<string, unknown>;

    const body = await request<any>(`${config.path}/${params.id}`, {
      method: config.upsertById ? 'PUT' : 'PATCH',
      body: rest,
    });

    return { data: withId(config, body) };
  },

  updateMany: async (resource, params) => {
    const config = configFor(resource);
    await Promise.all(
      params.ids.map((id) =>
        request(`${config.path}/${id}`, {
          method: config.upsertById ? 'PUT' : 'PATCH',
          body: params.data,
        })
      )
    );
    return { data: params.ids };
  },

  delete: async (resource, params) => {
    const config = configFor(resource);
    await request(`${config.path}/${params.id}`, { method: 'DELETE' });
    return { data: (params.previousData ?? { id: params.id }) as any };
  },

  deleteMany: async (resource, params) => {
    const config = configFor(resource);
    await Promise.all(
      params.ids.map((id) => request(`${config.path}/${id}`, { method: 'DELETE' }))
    );
    return { data: params.ids };
  },
};
