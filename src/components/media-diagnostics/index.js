import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import { useSelector } from 'react-redux';
import useMeeting from '../../graphql/hooks/useMeeting';

/**
 * Media diagnostics overlay for debugging audio/video issues.
 * Shows bridge types, connection state, and SFU connectivity.
 *
 * Enable by tapping the hidden debug area (top-right corner, 5 taps).
 */
const MediaDiagnostics = () => {
  const [visible, setVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [permissions, setPermissions] = useState({ camera: 'unknown', microphone: 'unknown' });
  const [sfuTestResult, setSfuTestResult] = useState('not tested');
  const [sfuTokenResult, setSfuTokenResult] = useState('not tested');

  // Get meeting data from GraphQL subscription (correct source for bridge config)
  const { data: meetingData } = useMeeting();

  // Redux state
  const audio = useSelector((state) => state.audio);
  const video = useSelector((state) => state.video);
  const client = useSelector((state) => state.client);
  const meeting = useSelector((state) => state.meeting);

  // Media manager initialization preconditions
  const userId = client?.meetingData?.internalUserID;
  const isClientConnected = client?.sessionState?.connected;
  const isClientLoggedIn = client?.sessionState?.loggedIn;
  const meetingLoading = meeting?.loading;

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      const camera = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      const mic = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      setPermissions({ camera: camera ? 'granted' : 'denied', microphone: mic ? 'granted' : 'denied' });
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access for video calls.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
          buttonNeutral: 'Ask Later',
        }
      );
      setPermissions((prev) => ({ ...prev, camera: result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied' }));
    }
  }, []);

  // Test WebSocket connection to bbb-webrtc-sfu (no auth)
  const testSfuConnection = useCallback(async () => {
    setSfuTestResult('testing...');
    try {
      const host = client?.meetingData?.host;
      if (!host) {
        setSfuTestResult('FAIL: no host in client state');
        return;
      }
      const wsUrl = `wss://${host}/bbb-webrtc-sfu?sessionToken=test`;
      const result = await new Promise((resolve) => {
        let ws;
        try {
          ws = new WebSocket(wsUrl);
        } catch (e) {
          resolve(`FAIL: ${e.message || 'WebSocket constructor error'}`);
          return;
        }
        const timeout = setTimeout(() => {
          try { ws.close(); } catch {}
          resolve('TIMEOUT (5s)');
        }, 5000);
        ws.onopen = () => {
          clearTimeout(timeout);
          try { ws.close(); } catch {}
          resolve('OK: WebSocket opened');
        };
        ws.onerror = (e) => {
          clearTimeout(timeout);
          resolve(`FAIL: ${e.message || 'connection refused/TLS error'}`);
        };
        ws.onclose = (e) => {
          clearTimeout(timeout);
          resolve(`CLOSED: code=${e.code} reason=${e.reason || 'none'}`);
        };
      });
      setSfuTestResult(result);
    } catch (e) {
      setSfuTestResult(`FAIL: ${e.message || 'unknown error'}`);
    }
  }, [client]);

  // Test SFU with actual session token
  const testSfuWithToken = useCallback(async () => {
    setSfuTokenResult('testing...');
    try {
      const host = client?.meetingData?.host;
      const token = client?.meetingData?.sessionToken;
      if (!host || !token) {
        setSfuTokenResult('FAIL: missing host or token');
        return;
      }
      const wsUrl = `wss://${host}/bbb-webrtc-sfu?sessionToken=${token}`;
      const result = await new Promise((resolve) => {
        let ws;
        try {
          ws = new WebSocket(wsUrl);
        } catch (e) {
          resolve(`FAIL: ${e.message || 'constructor error'}`);
          return;
        }
        const timeout = setTimeout(() => {
          try { ws.close(); } catch {}
          resolve('TIMEOUT (5s)');
        }, 5000);
        ws.onopen = () => {
          clearTimeout(timeout);
          try { ws.close(); } catch {}
          resolve('OK: authenticated WebSocket opened');
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve('FAIL: server rejected connection');
        };
        ws.onclose = (e) => {
          clearTimeout(timeout);
          resolve(`CLOSED: code=${e.code}`);
        };
      });
      setSfuTokenResult(result);
    } catch (e) {
      setSfuTokenResult(`FAIL: ${e.message || 'unknown error'}`);
    }
  }, [client]);

  useEffect(() => {
    if (visible) {
      checkPermissions();
    }
  }, [visible, checkPermissions]);

  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) {
      setVisible(!visible);
      setTapCount(0);
    }
    setTimeout(() => setTapCount(0), 2000);
  };

  // Get bridge config from GraphQL subscription data
  const meetingFields = meetingData?.meeting?.[0] || {};
  const {
    audioBridge = 'unknown',
    cameraBridge = 'unknown',
  } = meetingFields;

  if (!visible) {
    return (
      <TouchableOpacity
        style={styles.hiddenTrigger}
        onPress={handleSecretTap}
        activeOpacity={1}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Media Diagnostics</Text>

        <Section title="Bridge Configuration">
          <Row label="Audio" value={audioBridge} />
          <Row label="Camera" value={cameraBridge} />
        </Section>

        <Section title="Permissions">
          <Row label="Camera" value={permissions.camera} ok={permissions.camera === 'granted'} />
          {permissions.camera !== 'granted' && (
            <TouchableOpacity style={styles.permButton} onPress={requestCameraPermission}>
              <Text style={styles.permButtonText}>Request Camera</Text>
            </TouchableOpacity>
          )}
          <Row label="Microphone" value={permissions.microphone} ok={permissions.microphone === 'granted'} />
        </Section>

        <Section title="Media Initialization Preconditions">
          <Row label="sessionToken" value={client?.meetingData?.sessionToken ? 'SET' : 'MISSING'} ok={!!client?.meetingData?.sessionToken} />
          <Row label="host" value={client?.meetingData?.host || 'MISSING'} ok={!!client?.meetingData?.host} />
          <Row label="userId" value={userId || 'MISSING'} ok={!!userId} />
          <Row label="meetingLoading" value={String(meetingLoading ?? 'N/A')} ok={!meetingLoading} />
          <Row label="isClientConnected" value={String(isClientConnected ?? 'N/A')} ok={isClientConnected === true} />
          <Row label="isClientLoggedIn" value={String(isClientLoggedIn ?? 'N/A')} ok={isClientLoggedIn === true} />
          <Row label="audioBridge" value={audioBridge} ok={audioBridge !== 'unknown' && !!audioBridge} />
          <Row label="cameraBridge" value={cameraBridge} ok={cameraBridge !== 'unknown' && !!cameraBridge} />
        </Section>

        <Section title="Media State">
          <Row label="Audio Connected" value={String(audio?.isConnected ?? 'N/A')} />
          <Row label="Audio Connecting" value={String(audio?.isConnecting ?? 'N/A')} />
          <Row label="Video Streams" value={String(video?.videoStreams?.collection ? Object.keys(video.videoStreams.collection).length : 0)} />
        </Section>

        <Section title="SFU Connection (bbb-webrtc-sfu)">
          <Row label="Host" value={client?.meetingData?.host || 'N/A'} />
          <Row label="Token" value={client?.meetingData?.sessionToken ? `${client.meetingData.sessionToken.substring(0, 8)}...` : 'MISSING'} />
          <TouchableOpacity style={styles.testButton} onPress={testSfuConnection}>
            <Text style={styles.testButtonText}>Test SFU (no auth)</Text>
          </TouchableOpacity>
          {sfuTestResult !== 'not tested' && (
            <Text style={[styles.resultText, sfuTestResult.startsWith('OK') ? styles.ok : styles.error]}>
              {sfuTestResult}
            </Text>
          )}
          <TouchableOpacity style={[styles.testButton, { marginTop: 8 }]} onPress={testSfuWithToken}>
            <Text style={styles.testButtonText}>Test SFU (with token)</Text>
          </TouchableOpacity>
          {sfuTokenResult !== 'not tested' && (
            <Text style={[styles.resultText, sfuTokenResult.startsWith('OK') ? styles.ok : styles.error]}>
              {sfuTokenResult}
            </Text>
          )}
        </Section>

        <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
          <Text style={styles.closeText}>Close (tap here)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row = ({ label, value, ok }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, ok !== undefined && (ok ? styles.ok : styles.error)]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  hiddenTrigger: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9998,
    padding: 16,
    paddingTop: 40,
  },
  title: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#ffcc00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  label: {
    color: '#cccccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  value: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  ok: {
    color: '#00ff00',
  },
  error: {
    color: '#ff4444',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  permButton: {
    backgroundColor: '#ff6600',
    padding: 8,
    borderRadius: 4,
    marginVertical: 6,
    alignItems: 'center',
  },
  permButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#0066ff',
    padding: 8,
    borderRadius: 4,
    marginVertical: 6,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
    padding: 4,
    backgroundColor: '#222',
  },
});

export default MediaDiagnostics;
