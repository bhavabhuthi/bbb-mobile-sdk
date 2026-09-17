import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { parseGreenlightUrl } from '../../utils/parseRoomUrl';

const DEFAULT_ICONS = ['📅', '📚', '💼', '🎓', '🔧', '🎯', '💡', '🏠', '🎮', '🎵'];

const AddRoomScreen = ({ onSave, onBack }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📅');
  const [error, setError] = useState('');

  const handleUrlChange = useCallback((text) => {
    setUrl(text);
    setError('');
    // Auto-detect name from URL
    const parsed = parseGreenlightUrl(text);
    if (parsed && !name) {
      setName(parsed.roomId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }, [name]);

  const handleSave = useCallback(() => {
    if (!url.trim()) {
      setError('Please enter a room URL');
      return;
    }

    const parsed = parseGreenlightUrl(url.trim());
    if (!parsed) {
      setError('Invalid Greenlight room URL. Expected: https://server/rooms/room-id');
      return;
    }

    const room = {
      name: name.trim() || parsed.roomId,
      greenlightUrl: parsed.greenlightUrl,
      bbbHost: parsed.host,
      roomId: parsed.roomId,
      icon: selectedIcon,
    };

    onSave(room);
    onBack();
  }, [name, url, selectedIcon, onSave, onBack]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Room</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Room Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Weekly Standup"
          placeholderTextColor="#666666"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Greenlight Room URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://server/rooms/room-id"
          placeholderTextColor="#666666"
          value={url}
          onChangeText={handleUrlChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {DEFAULT_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconButton,
                selectedIcon === icon && styles.iconButtonSelected,
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Room</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#ffffff',
    fontSize: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2a2a3e',
    color: '#ffffff',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 6,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    borderColor: '#0066cc',
    backgroundColor: '#1a3a5e',
  },
  iconText: {
    fontSize: 24,
  },
  saveButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddRoomScreen;
