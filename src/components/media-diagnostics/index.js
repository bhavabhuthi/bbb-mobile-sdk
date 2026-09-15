import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import { useSelector } from 'react-redux';
import { getMediaDevices } from '@livekit/react-native-webrtc';

/**
 * Media diagnostics overlay for debugging audio/video issues.
 * Shows bridge types, connection state, and device permissions.
 *
 * Enable by setting `showMediaDiagnostics: true` in settings.json,
 * or by tapping the hidden debug area (top-right corner, 5 taps).
 */
const MediaDiagnostics = () => {
  const [visible, setVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [permissions, setPermissions] = useState({ camera: 'unknown', microphone: 'unknown' });

  // Redux state
  const audio = useSelector((state) => state.audio);
  const video = useSelector((state) => state.video);
  const meeting = useSelector((state) => state.meeting);
  const client = useSelector((state) => state.client);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const mediaDevices = await getMediaDevices();
        setDevices({
          audioInputs: mediaDevices.filter((d) => d.kind === 'audioinput'),
          videoInputs: mediaDevices.filter((d) => d.kind === 'videoinput'),
          audioOutputs: mediaDevices.filter((d) => d.kind === 'audiooutput'),
        });
      } catch (e) {
        // Media devices not available
      }
    };

    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        const camera = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const mic = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        setPermissions({ camera: camera ? 'granted' : 'denied', microphone: mic ? 'granted' : 'denied' });
      }
    };

    if (visible) {
      loadDevices();
      checkPermissions();
    }
  }, [visible]);

  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) {
      setVisible(!visible);
      setTapCount(0);
    }
    // Reset tap count after 2 seconds of inactivity
    setTimeout(() => setTapCount(0), 2000);
  };

  const meetingData = meeting?.meeting?.[0] || {};
  const {
    audioBridge = 'unknown',
    cameraBridge = 'unknown',
    screenShareBridge = 'unknown',
  } = meetingData;

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
          <Row label="Audio Bridge" value={audioBridge} />
          <Row label="Camera Bridge" value={cameraBridge} />
          <Row label="Screenshare Bridge" value={screenShareBridge} />
        </Section>

        <Section title="Permissions">
          <Row label="Camera" value={permissions.camera} ok={permissions.camera === 'granted'} />
          <Row label="Microphone" value={permissions.microphone} ok={permissions.microphone === 'granted'} />
        </Section>

        <Section title="Media Devices">
          <Row label="Audio Inputs" value={String(devices.audioInputs.length)} />
          <Row label="Video Inputs" value={String(devices.videoInputs.length)} />
          <Row label="Audio Outputs" value={String(devices.audioOutputs.length)} />
        </Section>

        <Section title="Audio State">
          <Row label="Is Connected" value={String(audio?.isConnected ?? 'N/A')} />
          <Row label="Is Connecting" value={String(audio?.isConnecting ?? 'N/A')} />
          <Row label="Is Muted" value={String(audio?.isMuted ?? 'N/A')} />
          <Row label="Listen Only" value={String(audio?.isListenOnly ?? 'N/A')} />
        </Section>

        <Section title="Video State">
          <Row label="Current Camera" value={video?.currentCamId || 'none'} />
          <Row label="Streams Count" value={String(video?.videoStreams?.collection ? Object.keys(video.videoStreams.collection).length : 0)} />
        </Section>

        <Section title="Connection">
          <Row label="Host" value={client?.meetingData?.host || 'N/A'} />
          <Row label="Session Token" value={client?.sessionToken ? `${client.sessionToken.substring(0, 8)}...` : 'N/A'} />
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
});

export default MediaDiagnostics;
