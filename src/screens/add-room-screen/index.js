import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { parseGreenlightUrl } from '../../utils/parseRoomUrl';

const AddRoomScreen = ({ onSave, onBack, credentials }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIcon, setIcon] = useState('📅');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);

  const DEFAULT_ICONS = ['📅', '📚', '💼', '🎓', '🔧', '🎯', '💡', '🏠', '🎮', '🎵'];

  // Fetch room name from Greenlight page
  const fetchRoomName = useCallback(async (roomUrl) => {
    const parsed = parseGreenlightUrl(roomUrl);
    if (!parsed) return null;

    setFetching(true);
    try {
      const response = await fetch(parsed.greenlightUrl, {
        headers: { 'Accept': 'text/html' },
      });
      const html = await response.text();

      // Try multiple strategies to find the room name:

      // 1. Look for og:title meta tag (most reliable)
      const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"\s*\/?>/i);
      if (ogTitle?.[1]) {
        return cleanTitle(ogTitle[1]);
      }

      // 2. Look for meta title tag
      const metaTitle = html.match(/<meta\s+name="title"\s+content="([^"]+)"\s*\/?>/i);
      if (metaTitle?.[1]) {
        return cleanTitle(metaTitle[1]);
      }

      // 3. Look for h1 tag with room name
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match?.[1]) {
        return cleanRoomName(h1Match[1]);
      }

      // 4. Look for any element with data-testid="room-name"
      const testId = html.match(/data-testid="room-name"[^>]*>([^<]+)</i);
      if (testId?.[1]) {
        return cleanRoomName(testId[1]);
      }

      // 5. Look for <title> tag as last resort
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) {
        const title = cleanTitle(titleMatch[1]);
        // Only use if it's not generic
        if (title && !['greenlight', 'bigbluebutton', 'home', 'rooms'].includes(title.toLowerCase())) {
          return title;
        }
      }
    } catch (e) {
      // Ignore fetch errors — user can enter name manually
    } finally {
      setFetching(false);
    }
    return null;
  }, []);

  const handleUrlChange = useCallback(async (text) => {
    setUrl(text);
    setError('');

    const parsed = parseGreenlightUrl(text);
    if (parsed && !name) {
      // Auto-fetch room name from Greenlight
      const fetchedName = await fetchRoomName(text);
      if (fetchedName) {
        setName(fetchedName);
      } else {
        // Fallback: use room ID formatted nicely
        setName(parsed.roomId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    }
  }, [name, fetchRoomName]);

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

    onSave({
      name: name.trim() || parsed.roomId,
      greenlightUrl: parsed.greenlightUrl,
      bbbHost: parsed.host,
      roomId: parsed.roomId,
      icon: selectedIcon,
    });
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

      <View style={styles.content}>
        <Text style={styles.label}>Greenlight Room URL</Text>
        <View style={styles.urlRow}>
          <TextInput
            style={styles.urlInput}
            placeholder="https://server/rooms/room-id"
            placeholderTextColor="#666666"
            value={url}
            onChangeText={handleUrlChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {fetching && <ActivityIndicator style={styles.loader} size="small" color="#ffffff" />}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Room Name {fetching && '(fetching...)'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Room name (auto-detected from URL)"
          placeholderTextColor="#666666"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {DEFAULT_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconButton, selectedIcon === icon && styles.iconButtonSelected]}
              onPress={() => setIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Clean up titles from Greenlight
function cleanTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s*\|\s*Greenlight\s*$/i, '')
    .replace(/\s*-\s*Greenlight\s*$/i, '')
    .replace(/\s*\|\s*BigBlueButton\s*$/i, '')
    .replace(/\s*-\s*BigBlueButton\s*$/i, '')
    .trim();
}

function cleanRoomName(name) {
  if (!name) return '';
  return name
    .replace(/^\s*[-–—]\s*/, '')
    .replace(/\s*[-–—]\s*$/, '')
    .trim();
}

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
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    color: '#ffffff',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
  },
  loader: {
    marginLeft: 8,
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
