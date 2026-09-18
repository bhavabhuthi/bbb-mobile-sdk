import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal,
} from 'react-native';
import useRoomHistory from '../../hooks/useRoomHistory';
import RoomCard from '../../components/room-card';
import { URL_TYPES, detectUrlType } from '../../utils/url-detection';

const HomeScreen = ({ onJoinRoom, onAddRoom, credentials, onLogin, onLogout }) => {
  const { rooms, loading, deleteRoom, updateRoom, saveRoom } = useRoomHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [renameModal, setRenameModal] = useState(null); // room being renamed
  const [renameText, setRenameText] = useState('');

  const handleRoomPress = useCallback((room) => {
    onJoinRoom(room);
  }, [onJoinRoom]);

  const handleRoomLongPress = useCallback((room) => {
    Alert.alert(
      room.name || 'Room',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rename', onPress: () => handleRename(room) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRoom(room.id) },
      ]
    );
  }, [deleteRoom]);

  const handleRename = useCallback((room) => {
    setRenameModal(room);
    setRenameText(room.name || '');
  }, []);

  const handleRenameSave = useCallback(() => {
    if (renameText.trim() && renameModal) {
      updateRoom(renameModal.id, { name: renameText.trim() });
    }
    setRenameModal(null);
    setRenameText('');
  }, [renameModal, renameText, updateRoom]);

  const handleQuickJoin = useCallback(() => {
    if (!quickUrl.trim()) return;
    const { type, url: normalizedUrl } = detectUrlType(quickUrl.trim());
    if (type === URL_TYPES.INVALID) {
      Alert.alert('Invalid URL', 'Please enter a valid BBB or Greenlight URL');
      return;
    }
    // Save to history then join
    if (type === URL_TYPES.GREENLIGHT_ROOM) {
      saveRoom({
        name: normalizedUrl.match(/rooms\/([a-zA-Z0-9_-]+)/)?.[1] || 'Room',
        greenlightUrl: normalizedUrl,
        bbbHost: normalizedUrl.match(/https?:\/\/([^/]+)/)?.[1] || '',
        roomId: normalizedUrl.match(/rooms\/([a-zA-Z0-9_-]+)/)?.[1] || '',
        icon: '📅',
      });
    }
    onJoinRoom({ greenlightUrl: normalizedUrl, bbbUrl: normalizedUrl });
    setQuickUrl('');
  }, [quickUrl, onJoinRoom, saveRoom]);

  const filteredRooms = searchQuery
    ? rooms.filter((r) =>
        (r.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        || (r.bbbHost || r.host || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rooms;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BigBlueButton</Text>
        <TouchableOpacity
          style={styles.authButton}
          onPress={credentials ? onLogout : onLogin}
        >
          {credentials ? (
            <Text style={styles.authText} numberOfLines={1}>
              {credentials.username}
            </Text>
          ) : (
            <Text style={styles.authText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick URL Entry */}
        <View style={styles.urlSection}>
          <Text style={styles.sectionTitle}>Join a Meeting</Text>
          <View style={styles.urlRow}>
            <TextInput
              style={styles.urlInput}
              placeholder="Paste BBB or Greenlight URL..."
              placeholderTextColor="#666666"
              value={quickUrl}
              onChangeText={setQuickUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleQuickJoin}
            />
            <TouchableOpacity
              style={[styles.urlJoinButton, !quickUrl.trim() && styles.urlJoinDisabled]}
              onPress={handleQuickJoin}
              disabled={!quickUrl.trim()}
            >
              <Text style={styles.urlJoinText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Rooms */}
        {rooms.length > 0 && (
          <View style={styles.roomsSection}>
            <View style={styles.roomsSectionHeader}>
              <Text style={styles.sectionTitle}>Your Rooms</Text>
              <TouchableOpacity onPress={onAddRoom}>
                <Text style={styles.addRoomText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍  Search rooms..."
              placeholderTextColor="#666666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.roomsScroll}
              contentContainerStyle={styles.roomsContainer}
            >
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onPress={handleRoomPress}
                  onLongPress={handleRoomLongPress}
                />
              ))}
              <TouchableOpacity style={styles.addCard} onPress={onAddRoom}>
                <Text style={styles.addIcon}>➕</Text>
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Add room button when no rooms */}
        {rooms.length === 0 && !loading && (
          <TouchableOpacity style={styles.addRoomCard} onPress={onAddRoom}>
            <Text style={styles.addRoomIcon}>➕</Text>
            <Text style={styles.addRoomTitle}>Add a Room</Text>
            <Text style={styles.addRoomSub}>
              Save a Greenlight room for quick access
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {credentials && (
        <Text style={styles.footer}>
          Logged in as {credentials.username} @ {credentials.server?.replace(/^https?:\/\//, '')}
        </Text>
      )}

      {/* Rename Modal */}
      <Modal visible={!!renameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Room</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              placeholder="Room name"
              placeholderTextColor="#666666"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setRenameModal(null)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleRenameSave}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  authButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: 140,
  },
  authText: {
    color: '#ffffff',
    fontSize: 13,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  urlSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  urlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    color: '#ffffff',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
  },
  urlJoinButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  urlJoinDisabled: {
    opacity: 0.4,
  },
  urlJoinText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  roomsSection: {
    marginBottom: 24,
  },
  roomsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addRoomText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#2a2a3e',
    color: '#ffffff',
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 12,
  },
  roomsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  roomsContainer: {
    paddingRight: 20,
  },
  addCard: {
    width: 100,
    height: 120,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addText: {
    color: '#888888',
    fontSize: 11,
  },
  addRoomCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  addRoomIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  addRoomTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  addRoomSub: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    color: '#555555',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnCancel: {
    backgroundColor: '#3a3a4e',
  },
  modalBtnSave: {
    backgroundColor: '#0066cc',
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
