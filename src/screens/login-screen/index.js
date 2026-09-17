import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ onBack, onLogin, existingCredentials }) => {
  const [serverUrl, setServerUrl] = useState(existingCredentials?.server || '');
  const [username, setUsername] = useState(existingCredentials?.username || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleLogin = useCallback(async () => {
    setError('');

    const trimmedUrl = serverUrl.trim();
    const trimmedUsername = username.trim();

    if (!trimmedUrl) {
      setError('Please enter your server URL');
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      setError('Please enter a valid URL (e.g., https://virtual.swecha.org)');
      return;
    }
    if (!trimmedUsername) {
      setError('Please enter your name');
      return;
    }

    // Normalize URL (remove trailing slash)
    const normalizedUrl = trimmedUrl.replace(/\/+$/, '');

    onLogin({
      server: normalizedUrl,
      username: trimmedUsername,
    });
    onBack();
  }, [serverUrl, username, onLogin, onBack]);

  const handleContinueAsGuest = useCallback(() => {
    onLogin(null);
    onBack();
  }, [onLogin, onBack]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Login</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Save your details for quick access. You will still join meetings through
          the browser interface.
        </Text>

        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://virtual.swecha.org"
          placeholderTextColor="#666666"
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., John Doe"
          placeholderTextColor="#666666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.guestButton} onPress={handleContinueAsGuest}>
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        {existingCredentials && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              onLogin(null);
              onBack();
            }}
          >
            <Text style={styles.logoutButtonText}>Logout (clear saved details)</Text>
          </TouchableOpacity>
        )}
      </View>
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
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
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
    padding: 14,
    borderRadius: 10,
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a3a4e',
  },
  dividerText: {
    color: '#666666',
    fontSize: 12,
    marginHorizontal: 12,
  },
  guestButton: {
    backgroundColor: '#2a2a3e',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ff6666',
    fontSize: 13,
  },
});

export default LoginScreen;
