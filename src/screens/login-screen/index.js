import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';

const LoginScreen = ({ onLoggedIn, onBack }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showWebView, setShowWebView] = useState(false);

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

  const handleLoggedIn = useCallback(() => {
    onLoggedIn({ server: serverUrl, username: username.trim() || 'User' });
  }, [serverUrl, username, onLoggedIn]);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'user_info' && message.name && !username) {
        setUsername(message.name);
      }
    } catch (e) {
      // ignore
    }
  }, [username]);

  const handleBack = useCallback(() => {
    if (showWebView) {
      setShowWebView(false);
    } else {
      onBack();
    }
  }, [showWebView, onBack]);

  if (showWebView) {
    // Script injected on every page load to detect username
    const extractUsernameScript = `
      (function() {
        try {
          // Only run if we're NOT on a login/signin page
          var path = window.location.pathname;
          if (path.includes('/login') || path.includes('/signin')) return;

          // Try multiple selectors where Greenlight might show the username
          var nameEl = document.querySelector('[data-testid="user-name"]')
            || document.querySelector('.user-name')
            || document.querySelector('header .name')
            || document.querySelector('.navbar .name')
            || document.querySelector('[class*="user"] [class*="name"]')
            || document.querySelector('.dropdown-toggle');

          var name = nameEl?.textContent?.trim() || '';

          // Only send if we found a name and it's different from last sent
          if (name && name !== window.__lastExtractedName) {
            window.__lastExtractedName = name;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'user_info',
              name: name
            }));
          }
        } catch(e) {}
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
