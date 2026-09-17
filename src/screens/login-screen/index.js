import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * WebView-based login screen for Greenlight.
 * User logs in through Greenlight's native login page.
 * After successful login, we detect it and proceed.
 */
const LoginScreen = ({ onLoggedIn, onBack }) => {
  const webViewRef = useRef(null);
  const [serverUrl, setServerUrl] = useState('');
  const [detectedUser, setDetectedUser] = useState('');
  const [pageState, setPageState] = useState('enter_url'); // enter_url | logging_in | logged_in

  const handleUrlSubmit = useCallback((url) => {
    const normalized = url.trim().replace(/\/+$/, '');
    setServerUrl(normalized);
    setPageState('logging_in');
  }, []);

  const handleNavigationStateChange = useCallback((navState) => {
    const { url } = navState;

    // Capture server URL
    if (url && !serverUrl) {
      try {
        const parsed = new URL(url);
        setServerUrl(`${parsed.protocol}//${parsed.host}`);
      } catch (e) {
        // ignore
      }
    }

    // Detect successful login: redirected away from login/signin pages
    if (serverUrl && !url.includes('/login') && !url.includes('/signin')) {
      setPageState('logged_in');

      // Try to extract user info from the page
      const extractScript = `
        try {
          // Greenlight stores user info in various places — try to find it
          const nameEl = document.querySelector('[data-testid="user-name"]')
            || document.querySelector('.user-name')
            || document.querySelector('header .name');
          const name = nameEl?.textContent?.textContent || '';

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
    onLoggedIn({
      server: serverUrl,
      username: detectedUser || 'User',
    });
    onBack();
  }, [serverUrl, detectedUser, onLoggedIn, onBack]);

  const renderContent = () => {
    if (pageState === 'enter_url') {
      return (
        <View style={styles.urlEntryContainer}>
          <Text style={styles.label}>Greenlight Server URL</Text>
          <Text style={styles.subtitle}>
            Enter your organization's Greenlight URL to sign in
          </Text>
          <UrlInput onSubmit={handleUrlSubmit} />
        </View>
      );
    }

    return (
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: `${serverUrl}/login` }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          style={styles.webview}
        />

        {pageState === 'logged_in' && (
          <View style={styles.successOverlay}>
            <Text style={styles.successTitle}>✓ Logged In</Text>
            {detectedUser ? (
              <Text style={styles.successUser}>Welcome, {detectedUser}</Text>
            ) : null}
            <View style={styles.continueButton} onTouchEnd={handleContinue}>
              <Text style={styles.continueText}>Continue →</Text>
            </View>
          </View>
        )}

        {pageState === 'logging_in' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Waiting for login...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backButton} onPress={onBack}>← Back</Text>
        <Text style={styles.title}>Login</Text>
        <View style={styles.placeholder} />
      </View>
      {renderContent()}
    </View>
  );
};

const UrlInput = ({ onSubmit }) => {
  const [url, setUrl] = useState('');

  return (
    <>
      <View style={styles.urlInputRow}>
        <View style={styles.urlInputWrapper}>
          <Text style={styles.urlInputPrefix}>https://</Text>
          <Text
            style={styles.urlInput}
            onPress={() => {
              // Simple prompt for URL
              const { Alert } = require('react-native');
              Alert.prompt?.('Server URL', 'Enter your server hostname:', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: (val) => val && onSubmit(`https://${val}`) },
              ], 'plain-text', 'virtual.swecha.org') || onSubmit('https://virtual.swecha.org');
            }}
          >
            {url || 'virtual.swecha.org'}
          </Text>
        </View>
      </View>
      <View style={styles.arrowButton} onTouchEnd={() => onSubmit(`https://${url || 'virtual.swecha.org'}`)}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </>
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
    color: '#ffffff',
    fontSize: 16,
    padding: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  urlEntryContainer: {
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
    marginBottom: 20,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  urlInputPrefix: {
    color: '#666666',
    fontSize: 14,
  },
  urlInput: {
    flex: 1,
    color: '#ffffff',
    padding: 14,
    fontSize: 14,
  },
  arrowButton: {
    width: 50,
    height: 50,
    backgroundColor: '#0066cc',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  successOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  successTitle: {
    color: '#00cc00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successUser: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 12,
  },
});

export default LoginScreen;
