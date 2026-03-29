import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllClients, getAllProducts, insertOrder, LocalClient, LocalProduct } from '../database/db';

interface CartItem extends LocalProduct {
  cantidad: number;
  subtotal: number;
}

export default function NewOrderScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'client' | 'products' | 'confirm'>('client');
  const [clients, setClients] = useState<LocalClient[]>([]);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [selectedClient, setSelectedClient] = useState<LocalClient | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchClient, setSearchClient] = useState('');
  const [notas, setNotas] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    setClients(getAllClients());
    setProducts(getAllProducts());
  }, []);

  const filteredClients = clients.filter(c =>
    c.nombre.toLowerCase().includes(searchClient.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const addToCart = (product: LocalProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio }
            : i
        );
      }
      return [...prev, { ...product, cantidad: 1, subtotal: product.precio }];
    });
  };

  const removeFromCart = (productId: number | undefined) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === productId);
      if (!existing) return prev;
      if (existing.cantidad <= 1) return prev.filter(i => i.id !== productId);
      return prev.map(i =>
        i.id === productId
          ? { ...i, cantidad: i.cantidad - 1, subtotal: (i.cantidad - 1) * i.precio }
          : i
      );
    });
  };

  const getCartQty = (productId: number | undefined) => {
    return cart.find(i => i.id === productId)?.cantidad ?? 0;
  };

  const handleConfirm = () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Selecciona un cliente');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto');
      return;
    }

    const items = cart.map(i => ({
      producto_id: i.server_id ?? i.id,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
      subtotal: i.subtotal,
    }));

    insertOrder({
      client_id: selectedClient.id!,
      client_nombre: selectedClient.nombre,
      items: JSON.stringify(items),
      total,
      estado: 'pendiente',
      notas: notas.trim() || undefined,
    });

    Alert.alert('✅ Pedido guardado', `Total: $${total.toFixed(2)}\nSe sincronizará cuando tengas internet.`, [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  // Step: Select Client
  if (step === 'client') {
    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>1. Selecciona cliente</Text>
          <Text style={styles.stepCount}>{clients.length} clientes</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          value={searchClient}
          onChangeText={setSearchClient}
          placeholder="🔍 Buscar..."
          placeholderTextColor="#555"
        />
        <FlatList
          data={filteredClients}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.clientRow}
              onPress={() => { setSelectedClient(item); setStep('products'); }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nombre.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.clientName}>{item.nombre}</Text>
                {item.telefono ? <Text style={styles.clientSub}>{item.telefono}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay clientes. Agrega uno primero.</Text>
          }
        />
      </View>
    );
  }

  // Step: Add Products
  if (step === 'products') {
    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setStep('client')}>
            <Text style={styles.backBtn}>← {selectedClient?.nombre}</Text>
          </TouchableOpacity>
          <Text style={styles.stepCount}>{cart.length} tipos</Text>
        </View>

        <FlatList
          data={products}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={({ item }) => {
            const qty = getCartQty(item.id);
            return (
              <View style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.nombre}</Text>
                  <Text style={styles.productPrice}>${item.precio.toFixed(2)}</Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => removeFromCart(item.id)}
                    disabled={qty === 0}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item)}>
                    <Text style={[styles.qtyBtnText, { color: '#0f0f0f' }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Sin productos. Sincroniza primero.</Text>
          }
        />

        {cart.length > 0 && (
          <View style={styles.cartBar}>
            <Text style={styles.cartTotal}>${total.toFixed(2)} · {cart.length} productos</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('confirm')}>
              <Text style={styles.nextBtnText}>Confirmar →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Step: Confirm
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={() => setStep('products')}>
        <Text style={styles.backBtn}>← Editar productos</Text>
      </TouchableOpacity>

      <Text style={styles.confirmTitle}>Resumen del pedido</Text>

      <View style={styles.confirmCard}>
        <Text style={styles.confirmLabel}>Cliente</Text>
        <Text style={styles.confirmValue}>{selectedClient?.nombre}</Text>
        {selectedClient?.telefono && (
          <Text style={styles.confirmSub}>{selectedClient.telefono}</Text>
        )}
      </View>

      <View style={styles.confirmCard}>
        <Text style={styles.confirmLabel}>Productos ({cart.length})</Text>
        {cart.map((item, idx) => (
          <View key={idx} style={styles.cartItemRow}>
            <Text style={styles.cartItemName}>{item.cantidad}× {item.nombre}</Text>
            <Text style={styles.cartItemPrice}>${item.subtotal.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <TextInput
        style={[styles.searchInput, { marginBottom: 16 }]}
        value={notas}
        onChangeText={setNotas}
        placeholder="Notas del pedido (opcional)"
        placeholderTextColor="#555"
        multiline
      />

      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmBtnText}>✅ Guardar Pedido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  stepCount: { fontSize: 13, color: '#888' },
  backBtn: { fontSize: 15, color: '#25D366', fontWeight: '600', padding: 4 },
  searchInput: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#0f0f0f', fontWeight: '700', fontSize: 16 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  clientSub: { fontSize: 12, color: '#888' },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  productPrice: { fontSize: 13, color: '#25D366', marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: '#25D366', borderColor: '#25D366' },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qtyText: { width: 24, textAlign: 'center', color: '#fff', fontSize: 15, fontWeight: '600' },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  cartTotal: { fontSize: 15, color: '#fff', fontWeight: '600' },
  nextBtn: { backgroundColor: '#25D366', borderRadius: 10, padding: 12 },
  nextBtnText: { color: '#0f0f0f', fontWeight: '700', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#888', padding: 32 },
  confirmTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16, marginTop: 8 },
  confirmCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  confirmLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  confirmValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  confirmSub: { fontSize: 13, color: '#888', marginTop: 2 },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cartItemName: { fontSize: 14, color: '#ccc', flex: 1 },
  cartItemPrice: { fontSize: 14, color: '#fff', fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  totalLabel: { fontSize: 13, color: '#888', fontWeight: '700' },
  totalValue: { fontSize: 20, color: '#25D366', fontWeight: '700' },
  confirmBtn: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700' },
});
