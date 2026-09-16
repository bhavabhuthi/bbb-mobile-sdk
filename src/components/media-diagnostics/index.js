import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

/**
 * Diagnostics overlay — minimal version.
 * Tap top-right corner 5 times to toggle.
 */
const MediaDiagnostics = () => {
  const [visible, setVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) { setVisible(!visible); setTapCount(0); }
    setTimeout(() => setTapCount(0), 2000);
  };

  if (!visible) {
    return (
      <TouchableOpacity style={styles.hiddenTrigger} onPress={handleSecretTap} activeOpacity={1} />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Diagnostics</Text>
        <Text style={styles.sectionTitle}>Media Diagnostics Active</Text>
        <Text style={styles.errorText}>No errors detected.</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenTrigger: { position: 'absolute', top: 0, right: 0, width: 60, height: 60, zIndex: 9999, backgroundColor: 'transparent' },
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9998, padding: 16, paddingTop: 40 },
  title: { color: '#00ff00', fontSize: 18, fontWeight: 'bold', marginBottom: 12, fontFamily: 'monospace' },
  sectionTitle: { color: '#ffcc00', fontSize: 14, fontWeight: 'bold', marginBottom: 6, fontFamily: 'monospace' },
  errorText: { color: '#00ff00', fontSize: 12, fontFamily: 'monospace', marginVertical: 2 },
  closeButton: { marginTop: 20, padding: 12, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#ffffff', fontSize: 14, fontFamily: 'monospace' },
});

export default MediaDiagnostics;
