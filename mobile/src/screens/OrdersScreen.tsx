import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getAllOrders, LocalOrder } from '../database/db';

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmado: '#3b82f6',
  enviado: '#8b5cf6',
  entregado: '#25D366',
  cancelado: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    const all = getAllOrders();
    if (filter) {
      setOrders(all.filter(o => o.estado === filter));
    } else {
      setOrders(all);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
    setRefreshing(false);
  };

  const renderOrder = ({ item }: { item: LocalOrder }) => {
    let items: any[] = [];
    try { items = JSON.parse(item.items); } catch {}
    const statusColor = STATUS_COLORS[item.estado || 'pendiente'] || '#888';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderClient}>{item.client_nombre || `Cliente #${item.client_id}`}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[item.estado || 'pendiente'] || item.estado}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {items.slice(0, 2).map((i, idx) => (
            <Text key={idx} style={styles.orderItem}>
              {i.cantidad}× {i.nombre}
            </Text>
          ))}
          {items.length > 2 && (
            <Text style={styles.orderItemMore}>+{items.length - 2} más</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
          <Text style={styles.syncStatus}>{item.synced ? '☁️ Sincronizado' : '⏳ Pendiente sync'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[null, 'pendiente', 'confirmado', 'entregado'].map(f => (
          <TouchableOpacity
            key={String(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f ? STATUS_LABELS[f] : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25D366" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No hay pedidos aún</Text>
          </View>
        }
      />
    </View>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filterChipActive: { backgroundColor: '#25D366', borderColor: '#25D366' },
  filterText: { color: '#888', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#0f0f0f' },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderClient: { fontSize: 15, fontWeight: '600', color: '#fff' },
  orderDate: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderItems: { marginBottom: 8 },
  orderItem: { fontSize: 13, color: '#ccc', marginBottom: 2 },
  orderItemMore: { fontSize: 12, color: '#888' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: 18, fontWeight: '700', color: '#25D366' },
  syncStatus: { fontSize: 11, color: '#888' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888' },
});
