import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'bbb_room_history';

/**
 * Hook to manage room history (quick access rooms).
 * Persists to AsyncStorage, sorted by most recently joined.
 */
const useRoomHistory = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by most recent first
        parsed.sort((a, b) => (b.lastJoined || 0) - (a.lastJoined || 0));
        setRooms(parsed);
      }
    } catch (e) {
      console.warn('Failed to load room history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRoom = useCallback(async (room) => {
    try {
      const existing = await SecureStore.getItemAsync(STORAGE_KEY);
      let parsed = existing ? JSON.parse(existing) : [];

      // Check if room already exists (by greenlightUrl or bbbHost+meetingId)
      const existingIndex = parsed.findIndex(
        (r) => r.greenlightUrl === room.greenlightUrl
          || (r.bbbHost === room.bbbHost && r.meetingId === room.meetingId)
      );

      const now = Date.now();
      if (existingIndex >= 0) {
        // Update existing: increment join count, update timestamp
        parsed[existingIndex] = {
          ...parsed[existingIndex],
          ...room,
          joinCount: (parsed[existingIndex].joinCount || 1) + 1,
          lastJoined: now,
        };
        // Move to front (most recent)
        const [updated] = parsed.splice(existingIndex, 1);
        parsed.unshift(updated);
      } else {
        // Add new room
        parsed.unshift({
          ...room,
          joinCount: 1,
          lastJoined: now,
          id: room.roomId || room.meetingId || `room_${now}`,
        });
      }

      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(parsed));
      setRooms(parsed);
    } catch (e) {
      console.warn('Failed to save room:', e);
    }
  }, []);

  const updateRoom = useCallback(async (roomId, updates) => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const index = parsed.findIndex((r) => r.id === roomId);
      if (index >= 0) {
        parsed[index] = { ...parsed[index], ...updates };
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(parsed));
        setRooms(parsed);
      }
    } catch (e) {
      console.warn('Failed to update room:', e);
    }
  }, []);

  const deleteRoom = useCallback(async (roomId) => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const filtered = parsed.filter((r) => r.id !== roomId);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(filtered));
      setRooms(filtered);
    } catch (e) {
      console.warn('Failed to delete room:', e);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setRooms([]);
    } catch (e) {
      console.warn('Failed to clear room history:', e);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return {
    rooms,
    loading,
    saveRoom,
    updateRoom,
    deleteRoom,
    clearHistory,
    reload: loadRooms,
  };
};

export default useRoomHistory;
