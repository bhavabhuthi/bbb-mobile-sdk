import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { URL_TYPES, detectUrlType } from '../../utils/url-detection';

const GreenlightWebView = ({ roomUrl, onJoinUrl, onBack }) => {
  const [loading, setLoading] = useState(true);

  const handleShouldStartLoad = (request) => {
    const { type, url } = detectUrlType(request.url);
    if (type === URL_TYPES.BBB_JOIN) {
      onJoinUrl(url);
      return false;
    }
    return true;
  };

  const handleNavigationChange = (navState) => {
    const { type, url: detected } = detectUrlType(navState.url);
    if (type === URL_TYPES.BBB_JOIN) {
      onJoinUrl(detected);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={onBack}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Greenlight</Text>
        <View style={styles.headerSide}>
          {loading && <ActivityIndicator size="small" color="#ffffff" />}
        </View>
      </View>
      <WebView
        source={{ uri: roomUrl }}
        onNavigationStateChange={handleNavigationChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        allowFileAccessFromFileURLs={false}
        mixedContentMode="compatibility"
        style={{ flex: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1a1a2e' },
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
  headerSide: { minWidth: 70, justifyContent: 'center' },
  headerBack: { color: '#ffffff', fontSize: 16, paddingVertical: 4 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});

export default GreenlightWebView;
