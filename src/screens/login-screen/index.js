import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_TESTING_URL = 'https://virtual.swecha.org';

const LoginScreen = ({ onLoggedIn, onBack }) => {
  const [serverUrl, setServerUrl] = useState(DEFAULT_TESTING_URL);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [capturedRooms, setCapturedRooms] = useState([]);

  const validateUrl = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return 'Please enter a URL';
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'URL must start with http:// or https://';
      }
      return '';
    } catch {
      return 'Please enter a valid URL (e.g., https://virtual.swecha.org)';
    }
  };

  const handleUrlSubmit = useCallback((url) => {
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setServerUrl(url.trim().replace(/\/+$/, ''));
    setShowWebView(true);
  }, []);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'user_info' && message.name && !username) {
        setUsername(message.name);
      } else if (message.type === 'api_data') {
        if (message.userName && !username) {
          setUsername(message.userName);
        }
        if (message.rooms?.length) {
          setCapturedRooms(message.rooms);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [username]);

  const handleLoggedIn = useCallback(() => {
    onLoggedIn({
      server: serverUrl,
      username: username.trim() || 'User',
      rooms: capturedRooms,
    });
  }, [serverUrl, username, capturedRooms, onLoggedIn]);

  const handleBack = useCallback(() => {
    if (showWebView) {
      setShowWebView(false);
    } else {
      onBack();
    }
  }, [showWebView, onBack]);

  if (showWebView) {
    // Comprehensive script to intercept ALL API calls (fetch + XHR)
    const extractUsernameScript = `
      (function() {
        if (window.location.pathname.includes('/login') || window.location.pathname.includes('/signin')) {
          return;
        }

        if (window.__bbbPatched) return;
        window.__bbbPatched = true;

        // Helper to parse and send API data
        function processResponse(url, body) {
          try {
            var data = (typeof body === 'string') ? JSON.parse(body) : body;
            if (!data) return;

            var userName = null;
            var rooms = null;

            // Greenlight wraps responses in { data: ... }
            var payload = data.data || data;

            // Rooms list: payload is an array
            if (Array.isArray(payload)) {
              rooms = payload;
              // Try to find owner name from any room
              for (var i = 0; i < payload.length; i++) {
                if (payload[i]?.owner?.name) { userName = payload[i].owner.name; break; }
                if (payload[i]?.user?.name) { userName = payload[i].user.name; break; }
              }
            }

            // Single room object
            if (payload?.friendly_id && payload?.name) {
              rooms = [payload];
              if (payload?.owner?.name) userName = payload.owner.name;
              if (payload?.user?.name) userName = payload.user.name;
            }

            // User object
            if (payload?.name && (payload?.id || payload?.userId || payload?.sub)) {
              userName = payload.name;
            }

            // Send if we found anything useful
            if (userName || rooms) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'api_data',
                userName: userName,
                rooms: rooms
              }));
            }
          } catch(e) {}
        }

        // === Patch fetch ===
        var origFetch = window.fetch;
        window.fetch = function() {
          var url = typeof arguments[0] === 'string' ? arguments[0] : arguments[0]?.url || '';
          return origFetch.apply(this, arguments).then(function(response) {
            try {
              var clone = response.clone();
              clone.text().then(function(body) {
                processResponse(url, body);
              }).catch(function() {});
            } catch(e) {}
            return response;
          });
        };

        // === Patch XMLHttpRequest ===
        var origXHROpen = XMLHttpRequest.prototype.open;
        var origXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function() {
          this.__url = arguments[1] || '';
          return origXHROpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function() {
          var self = this;
          this.addEventListener('load', function() {
            try {
              processResponse(self.__url, self.responseText);
            } catch(e) {}
          });
          return origXHRSend.apply(this, arguments);
        };
      })();
      true;
    `;

    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerSide} onTouchEnd={handleBack}>
            <Text style={styles.headerBack}>← Back</Text>
          </View>
          <Text style={styles.headerTitle}>Sign In</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.webviewWrap}>
          <WebView
            source={{ uri: serverUrl }}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            injectedJavaScriptBeforeContentLoaded={extractUsernameScript}
            onMessage={handleWebViewMessage}
            style={{ flex: 1 }}
          />
        </View>
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>
            {username ? `Welcome, ${username}` : 'Sign in above, then continue'}
          </Text>
          {!username && (
            <Text style={styles.overlayHint}>
              Auto-detecting your name after login...
            </Text>
          )}
          <TextInput
            style={styles.nameInput}
            placeholder="Or enter name manually"
            placeholderTextColor="#666666"
            value={username}
            onChangeText={setUsername}
          />
          <View style={styles.continueBtn} onTouchEnd={handleLoggedIn}>
            <Text style={styles.continueText}>Continue →</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerSide} onTouchEnd={handleBack}>
          <Text style={styles.headerBack}>← Back</Text>
        </View>
        <Text style={styles.headerTitle}>Login</Text>
        <View style={styles.headerSide} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.bodyInner}>
            <View style={styles.urlSection}>
              <Text style={styles.label}>Greenlight Server URL</Text>
              <Text style={styles.subtitle}>
                Enter your organization's Greenlight URL. You'll sign in through your browser.
              </Text>
              <UrlInput onSubmit={handleUrlSubmit} />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const UrlInput = ({ onSubmit }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    onSubmit(url);
  };

  return (
    <View style={styles.urlRow}>
      <TextInput
        style={styles.urlField}
        placeholder="virtual.swecha.org  or  https://virtual.swecha.org"
        placeholderTextColor="#666666"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        blurOnSubmit
      />
      <View style={styles.urlArrow} onTouchEnd={handleSubmit}>
        <Text style={styles.urlArrowText}>→</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  headerSide: {
    minWidth: 70,
    minHeight: 24,
    justifyContent: 'center',
  },
  headerBack: {
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
  },
  bodyInner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  urlSection: {
    marginTop: -100,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urlField: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    color: '#ffffff',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 10,
    fontSize: 14,
  },
  urlArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlArrowText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 24,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6666',
    fontSize: 12,
    marginTop: 8,
  },
  webviewWrap: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  overlayTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overlayHint: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: '#2a2a3e',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
    width: '100%',
  },
  continueBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
