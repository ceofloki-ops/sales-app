import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { insertClient } from '../database/db';

export default function NewClientScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const getLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitud(location.coords.latitude);
      setLongitud(location.coords.longitude);

      // Reverse geocode
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (address && !direccion) {
        const parts = [address.street, address.streetNumber, address.city, address.region].filter(Boolean);
        setDireccion(parts.join(', '));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del cliente es obligatorio');
      return;
    }
    setSaving(true);
    try {
      insertClient({
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
        latitud: latitud ?? undefined,
        longitud: longitud ?? undefined,
        notas: notas.trim() || undefined,
      });
      Alert.alert('✅ Guardado', 'Cliente guardado localmente. Sincroniza cuando tengas internet.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f0f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nuevo Cliente</Text>

        <Field label="Nombre *">
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre completo"
            placeholderTextColor="#555"
          />
        </Field>

        <Field label="Teléfono">
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="+52 55 1234 5678"
            placeholderTextColor="#555"
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Dirección">
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Calle, número, ciudad"
              placeholderTextColor="#555"
              multiline
            />
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={getLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#0f0f0f" />
              ) : (
                <Text style={styles.locationBtnText}>📍 Mi ubicación</Text>
              )}
            </TouchableOpacity>
          </View>
          {latitud && longitud ? (
            <Text style={styles.coordsText}>
              🌐 {latitud.toFixed(5)}, {longitud.toFixed(5)}
            </Text>
          ) : null}
        </Field>

        <Field label="Notas">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notas}
            onChangeText={setNotas}
            placeholder="Observaciones del cliente..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
          />
        </Field>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#0f0f0f" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Guardar Cliente</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 24 },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  locationRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  locationBtn: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBtnText: { color: '#0f0f0f', fontSize: 13, fontWeight: '700' },
  coordsText: { fontSize: 11, color: '#25D366', marginTop: 4 },
  saveBtn: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#888', fontSize: 15 },
});
