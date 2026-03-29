import axios from 'axios';
import {
  getUnsyncedClients,
  getUnsyncedOrders,
  markClientSynced,
  markOrderSynced,
  upsertProduct,
  LocalProduct,
} from '../database/db';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface SyncResult {
  success: boolean;
  clientesSynced: number;
  pedidosSynced: number;
  errors: string[];
}

export async function syncToServer(): Promise<SyncResult> {
  const unsyncedClients = getUnsyncedClients();
  const unsyncedOrders = getUnsyncedOrders();

  if (unsyncedClients.length === 0 && unsyncedOrders.length === 0) {
    return { success: true, clientesSynced: 0, pedidosSynced: 0, errors: [] };
  }

  const clientes = unsyncedClients.map(c => ({
    local_id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    direccion: c.direccion,
    latitud: c.latitud,
    longitud: c.longitud,
    notas: c.notas,
  }));

  const pedidos = unsyncedOrders.map(o => {
    let items = [];
    try {
      items = JSON.parse(o.items);
    } catch {
      items = [];
    }
    return {
      local_id: o.id,
      cliente_id: o.client_id,
      items,
      total: o.total,
      estado: o.estado || 'pendiente',
      notas: o.notas,
    };
  });

  try {
    const response = await axios.post(`${API_BASE}/sync`, { clientes, pedidos });
    const result = response.data;

    // Mark local records as synced
    // Note: server doesn't return individual IDs in bulk sync, so we mark all as synced
    for (const client of unsyncedClients) {
      if (client.id) markClientSynced(client.id, client.id);
    }
    for (const order of unsyncedOrders) {
      if (order.id) markOrderSynced(order.id, order.id);
    }

    return {
      success: true,
      clientesSynced: result.clientes_created || 0,
      pedidosSynced: result.pedidos_created || 0,
      errors: result.errors || [],
    };
  } catch (error: any) {
    const message = error?.response?.data?.detail || error?.message || 'Error de sincronización';
    return {
      success: false,
      clientesSynced: 0,
      pedidosSynced: 0,
      errors: [message],
    };
  }
}

export async function pullProducts(): Promise<{ success: boolean; count: number }> {
  try {
    const response = await axios.get(`${API_BASE}/productos`);
    const productos: any[] = response.data;

    for (const p of productos) {
      const localProduct: LocalProduct = {
        server_id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        categoria: p.categoria,
        sku: p.sku,
        stock: p.stock,
        imagen_url: p.imagen_url,
        activo: p.activo ? 1 : 0,
      };
      upsertProduct(localProduct);
    }

    return { success: true, count: productos.length };
  } catch (error: any) {
    console.error('pullProducts error:', error?.message);
    return { success: false, count: 0 };
  }
}

export async function pullClients(): Promise<{ success: boolean; count: number }> {
  try {
    const response = await axios.get(`${API_BASE}/clientes`);
    return { success: true, count: response.data.length };
  } catch {
    return { success: false, count: 0 };
  }
}
