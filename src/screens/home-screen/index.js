import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import useRoomHistory from '../../hooks/useRoomHistory';
import RoomCard from '../../components/room-card';

const DEFAULT_ICONS = ['📅', '📚', '💼', '🎓', '🔧', '🎯', '💡', '🏠'];

const HomeScreen = ({ onJoinRoom, onJoinWithUrl, onAddRoom }) => {
  const { rooms, loading, deleteRoom, updateRoom } = useRoomHistory();
  const [searchQuery, setSearchQuery] = useState('');

  const handleRoomPress = useCallback((room) => {
    onJoinRoom(room);
  }, [onJoinRoom]);

  const handleRoomLongPress = useCallback((room) => {
    Alert.alert(
      room.name || 'Room',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: () => handleRename(room),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRoom(room.id),
        },
      ]
    );
  }, [deleteRoom]);

  const handleRename = useCallback((room) => {
    Alert.prompt(
      'Rename Room',
      'Enter a new name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              updateRoom(room.id, { name: newName.trim() });
            }
          },
        },
      ],
      'plain-text',
      room.name || ''
    );
  }, [updateRoom]);

  const filteredRooms = searchQuery
    ? rooms.filter((r) =>
        (r.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        || (r.bbbHost || r.host || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rooms;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BigBlueButton</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search your rooms..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {rooms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Rooms</Text>
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
                <Text style={styles.addText}>Add Room</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

        {rooms.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No rooms yet</Text>
            <Text style={styles.emptyText}>
              Add a Greenlight room or paste a BBB join URL to get started.
              Rooms you join will appear here for quick access.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.urlButton} onPress={onJoinWithUrl}>
          <Text style={styles.urlButtonText}>🔗  Join with URL</Text>
          <Text style={styles.urlButtonSub}>Paste any BBB or Greenlight link</Text>
        </TouchableOpacity>

        {rooms.length > 0 && (
          <TouchableOpacity style={styles.addRoomButton} onPress={onAddRoom}>
            <Text style={styles.addRoomButtonText}>➕  Add Room Manually</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Text style={styles.footer}>
        {rooms.length} room{rooms.length !== 1 ? 's' : ''} saved locally
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#2a2a3e',
    color: '#ffffff',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roomsScroll: {
    marginBottom: 24,
  },
  roomsContainer: {
    paddingRight: 20,
  },
  addCard: {
    width: 160,
    height: 140,
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
    fontSize: 32,
    marginBottom: 8,
  },
  addText: {
    color: '#888888',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  urlButton: {
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  urlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  urlButtonSub: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  addRoomButton: {
    backgroundColor: '#3a3a4e',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addRoomButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  footer: {
    color: '#666666',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default HomeScreen;
