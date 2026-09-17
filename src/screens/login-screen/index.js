import { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const LoginScreen = ({ onLoggedIn, onBack }) => {
  const webViewRef = useRef(null);
  const [serverUrl, setServerUrl] = useState('');
  const [detectedUser, setDetectedUser] = useState('');
  const [pageState, setPageState] = useState('enter_url');

  const handleUrlSubmit = useCallback((url) => {
    const normalized = url.trim().replace(/\/+$/, '');
    if (!normalized) return;
    setServerUrl(normalized);
    setPageState('logging_in');
  }, []);

  const handleNavigationStateChange = useCallback((navState) => {
    const { url } = navState;

    if (url && !serverUrl) {
      try {
        const parsed = new URL(url);
        setServerUrl(`${parsed.protocol}//${parsed.host}`);
      } catch (e) {
        // ignore
      }
    }

    if (serverUrl && !url.includes('/login') && !url.includes('/signin')) {
      setPageState('logged_in');

      const extractScript = `
        try {
          const nameEl = document.querySelector('[data-testid="user-name"]')
            || document.querySelector('.user-name')
            || document.querySelector('header .name');
          const name = nameEl?.textContent?.trim() || '';

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'user_info',
            name: name
          }));
        } catch(e) {}
        true;
      `;
      webViewRef.current?.injectJavaScript(extractScript);
    }
  }, [serverUrl]);

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'user_info' && message.name) {
        setDetectedUser(message.name);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleContinue = useCallback(() => {
    onLoggedIn({ server: serverUrl, username: detectedUser || 'User' });
    onBack();
  }, [serverUrl, detectedUser, onLoggedIn, onBack]);

  const handleBack = useCallback(() => {
    if (pageState === 'logging_in' || pageState === 'logged_in') {
      setPageState('enter_url');
      setDetectedUser('');
    } else {
      onBack();
    }
  }, [pageState, onBack]);

  const renderContent = () => {
    if (pageState === 'enter_url') {
      return (
        <View style={styles.body}>
          <Text style={styles.label}>Greenlight Server URL</Text>
          <Text style={styles.subtitle}>
            Enter your organization's Greenlight URL to sign in
          </Text>
          <UrlInput onSubmit={handleUrlSubmit} />
        </View>
      );
    }

    return (
      <View style={styles.webviewWrap}>
        <WebView
          ref={webViewRef}
          source={{ uri: `${serverUrl}/login` }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          style={{ flex: 1 }}
        />

        {pageState === 'logged_in' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>✓ Logged In</Text>
            {detectedUser ? (
              <Text style={styles.overlayUser}>Welcome, {detectedUser}</Text>
            ) : null}
            <View style={styles.continueBtn} onTouchEnd={handleContinue}>
              <Text style={styles.continueText}>Continue →</Text>
            </View>
          </View>
        )}

        {pageState === 'logging_in' && (
          <View style={styles.overlayCenter}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.overlayText}>Waiting for login...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerSide} onTouchEnd={handleBack}>
          <Text style={styles.headerBack}>← Back</Text>
        </View>
        <Text style={styles.headerTitle}>Login</Text>
        <View style={styles.headerSide} />
      </View>
      {renderContent()}
    </View>
  );
};

const UrlInput = ({ onSubmit }) => {
  const [host, setHost] = useState('');

  const handleSubmit = () => {
    const trimmed = host.trim();
    if (trimmed) {
      onSubmit(`https://${trimmed}`);
    }
  };

  return (
    <View style={styles.urlRow}>
      <View style={styles.urlField}>
        <Text style={styles.urlPrefix}>https://</Text>
        <TextInput
          style={styles.urlInput}
          placeholder="virtual.swecha.org"
          placeholderTextColor="#666666"
          value={host}
          onChangeText={setHost}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>
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
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  headerSide: {
    minWidth: 70,
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
    paddingHorizontal: 20,
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    paddingLeft: 12,
    height: 48,
  },
  urlPrefix: {
    color: '#666666',
    fontSize: 14,
    marginRight: 4,
  },
  urlInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: 48,
  },
  urlArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlArrowText: {
    color: '#ffffff',
    fontSize: 22,
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
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    color: '#00cc00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overlayUser: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  continueBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 10,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 12,
  },
});

export default LoginScreen;
