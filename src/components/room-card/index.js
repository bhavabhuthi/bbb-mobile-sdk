import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatRelativeTime } from '../../utils/parseRoomUrl';

const DEFAULT_ICON = '📅';

const RoomCard = ({ room, onPress, onLongPress }) => {
  const icon = room.icon || DEFAULT_ICON;
  const timeAgo = formatRelativeTime(room.lastJoined);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(room)}
      onLongPress={() => onLongPress && onLongPress(room)}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.name} numberOfLines={1}>{room.name || room.roomId || 'Untitled'}</Text>
      <Text style={styles.host} numberOfLines={1}>{room.bbbHost || room.host || ''}</Text>
      <View style={styles.footer}>
        <Text style={styles.time}>{timeAgo}</Text>
        {room.joinCount > 1 && <Text style={styles.badge}>{room.joinCount}x</Text>}
      </View>
      <View style={styles.joinButton}>
        <Text style={styles.joinText}>Join</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 140,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  name: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  host: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    color: '#666666',
    fontSize: 10,
  },
  badge: {
    backgroundColor: '#0066cc',
    color: '#ffffff',
    fontSize: 9,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  joinButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  joinText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RoomCard;
