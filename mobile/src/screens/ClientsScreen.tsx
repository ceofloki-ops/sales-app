import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllClients, searchClients, LocalClient } from '../database/db';

export default function ClientsScreen() {
  const [clients, setClients] = useState<LocalClient[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadClients = useCallback(() => {
    if (search.trim()) {
      setClients(searchClients(search.trim()));
    } else {
      setClients(getAllClients());
    }
  }, [search]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: LocalClient }) => (
    <View style={styles.clientCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.nombre.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.nombre}</Text>
        {item.telefono ? <Text style={styles.clientDetail}>📞 {item.telefono}</Text> : null}
        {item.direccion ? (
          <Text style={styles.clientDetail} numberOfLines={1}>
            📍 {item.direccion}
          </Text>
        ) : null}
      </View>
      <View style={styles.syncBadge}>
        <Text style={styles.syncText}>{item.synced ? '✅' : '⏳'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Buscar cliente..."
          placeholderTextColor="#555"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/new-client')}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25D366" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>No hay clientes aún</Text>
            <TouchableOpacity onPress={() => router.push('/new-client')}>
              <Text style={styles.emptyAction}>+ Agregar primer cliente</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  searchRow: { flexDirection: 'row', padding: 16, gap: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  addBtn: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#0f0f0f', fontSize: 28, fontWeight: '700', lineHeight: 32 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  clientCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#0f0f0f', fontWeight: '700', fontSize: 18 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  clientDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  syncBadge: { marginLeft: 8 },
  syncText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 12 },
  emptyAction: { fontSize: 14, color: '#25D366', fontWeight: '600' },
});
