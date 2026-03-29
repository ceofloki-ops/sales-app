import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { getTodayOrders, getAllClients } from '../database/db';
import { syncToServer, pullProducts } from '../services/sync';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({ pedidosHoy: 0, totalClientes: 0, ventasHoy: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const todayOrders = getTodayOrders();
    const clients = getAllClients();
    const ventasHoy = todayOrders.reduce((sum, o) => sum + o.total, 0);
    setStats({
      pedidosHoy: todayOrders.length,
      totalClientes: clients.length,
      ventasHoy,
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await pullProducts();
      const result = await syncToServer();
      if (result.success) {
        Alert.alert(
          '✅ Sincronizado',
          `Clientes: ${result.clientesSynced} | Pedidos: ${result.pedidosSynced}`
        );
      } else {
        Alert.alert('Error de sync', result.errors.join('\n'));
      }
      loadStats();
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.nombre?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>¿Qué haremos hoy?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>⏏️</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pedidosHoy}</Text>
          <Text style={styles.statLabel}>Pedidos hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalClientes}</Text>
          <Text style={styles.statLabel}>Clientes</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={[styles.statValue, styles.statValueGreen]}>
            ${stats.ventasHoy.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Ventas hoy</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/new-order')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Nuevo Pedido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/new-client')}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionText}>Nuevo Cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSync]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#25D366" />
          ) : (
            <Text style={styles.actionIcon}>🔄</Text>
          )}
          <Text style={styles.actionText}>{syncing ? 'Sincronizando...' : 'Sincronizar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(tabs)/pedidos')}
        >
          <Text style={styles.actionIcon}>📦</Text>
          <Text style={styles.actionText}>Ver Pedidos</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutIcon: { fontSize: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statCardGreen: { borderColor: '#25D366' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#fff' },
  statValueGreen: { color: '#25D366' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#aaa',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  actionBtnSync: { borderColor: '#25D366' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: '#ccc', fontWeight: '600', textAlign: 'center' },
});
