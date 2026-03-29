import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { getAllProducts, getProductsByCategory, getCategories, LocalProduct } from '../database/db';

export default function ProductsScreen() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    const cats = getCategories();
    setCategories(cats);
    if (selectedCat) {
      setProducts(getProductsByCategory(selectedCat));
    } else {
      setProducts(getAllProducts());
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCat]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const renderProduct = ({ item }: { item: LocalProduct }) => (
    <View style={styles.productCard}>
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productEmoji}>📦</Text>
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
      {item.categoria ? (
        <Text style={styles.productCat}>{item.categoria}</Text>
      ) : null}
      <Text style={styles.productPrice}>${item.precio?.toFixed(2)}</Text>
      {item.stock !== undefined && item.stock !== null ? (
        <Text style={[styles.productStock, item.stock <= 0 ? styles.stockOut : styles.stockIn]}>
          {item.stock > 0 ? `Stock: ${item.stock}` : 'Sin stock'}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Categories Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContainer}
      >
        <TouchableOpacity
          style={[styles.catChip, !selectedCat && styles.catChipActive]}
          onPress={() => setSelectedCat(null)}
        >
          <Text style={[styles.catChipText, !selectedCat && styles.catChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
            onPress={() => setSelectedCat(cat)}
          >
            <Text style={[styles.catChipText, selectedCat === cat && styles.catChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25D366" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No hay productos</Text>
            <Text style={styles.emptyHint}>Sincroniza para cargar el catálogo</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  catScroll: { maxHeight: 56 },
  catContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  catChipActive: { backgroundColor: '#25D366', borderColor: '#25D366' },
  catChipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  catChipTextActive: { color: '#0f0f0f' },
  grid: { padding: 12 },
  row: { justifyContent: 'space-between' },
  productCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  productImagePlaceholder: {
    height: 80,
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productEmoji: { fontSize: 40 },
  productName: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 4 },
  productCat: { fontSize: 11, color: '#25D366', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#fff' },
  productStock: { fontSize: 11, marginTop: 4 },
  stockIn: { color: '#25D366' },
  stockOut: { color: '#ff4444' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#555' },
});
