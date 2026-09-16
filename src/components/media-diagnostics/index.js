import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import { useSelector } from 'react-redux';
import { useSubscription } from '@apollo/client';
import useMeeting from '../../graphql/hooks/useMeeting';
import AudioManager from '../../services/webrtc/audio-manager';
import useCurrentUser from '../../graphql/hooks/useCurrentUser';
import useUserList from '../../graphql/hooks/useUserList';
import Queries from '../../screens/user-notes-screen/queries';

/**
 * Media diagnostics overlay.
 * Tap top-right corner 5 times to toggle.
 */
const MediaDiagnostics = () => {
  const [visible, setVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [permissions, setPermissions] = useState({ camera: 'unknown', microphone: 'unknown' });
  const [sfuTokenResult, setSfuTokenResult] = useState('not tested');
  const [sharedNotesError, setSharedNotesError] = useState(null);
  const [hocuspocusResult, setHocuspocusResult] = useState('not tested');

  // GraphQL subscriptions
  const { error: meetingError } = useMeeting();
  const { data: currentUserData, error: userError } = useCurrentUser();
  const { data: userListData, error: userListError } = useUserList();
  const { error: sNotesError } = useSubscription(
    Queries.SHARED_NOTES_SUBSCRIPTION,
    { variables: { externalId: 'bbb-notes' } }
  );
  const sharedNotesPadId = sharedNotesData?.sharedNotes?.[0]?.padId;
  const sharedNotesExtId = sharedNotesData?.sharedNotes?.[0]?.sharedNotesExtId;

  // Redux state
  const client = useSelector((state) => state.client);

  const userId = currentUserData?.user_current?.[0]?.userId;

  useEffect(() => {
    if (visible && sNotesError) {
      setSharedNotesError(sNotesError.message || String(sNotesError));
    }
  }, [visible, sNotesError]);

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      const mic = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
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
        try { ws = new WebSocket(wsUrl); } catch (e) { resolve(`FAIL: ${e.message || 'constructor error'}`); return; }
        const timeout = setTimeout(() => { try { ws.close(); } catch {} resolve('TIMEOUT (5s)'); }, 5000);
        ws.onopen = () => { clearTimeout(timeout); try { ws.close(); } catch {} resolve('OK: authenticated WebSocket opened'); };
        ws.onerror = () => { clearTimeout(timeout); resolve('FAIL: server rejected connection'); };
        ws.onclose = (e) => { clearTimeout(timeout); resolve(`CLOSED: code=${e.code}`); };
      });
      setSfuTokenResult(result);
    } catch (e) {
      setSfuTokenResult(`FAIL: ${e.message || 'unknown error'}`);
    }
  }, [client]);

  // Test Hocuspocus WebSocket (used by shared notes)
  const testHocuspocus = useCallback(async () => {
    setHocuspocusResult('testing...');
    try {
      const host = client?.meetingData?.host;
      const token = client?.meetingData?.sessionToken;
      if (!host || !token) {
        setHocuspocusResult('FAIL: missing host or token');
        return;
      }
      const wsUrl = `wss://${host}/hocuspocus/collaboration?sessionToken=${token}`;
      const result = await new Promise((resolve) => {
        let ws;
        try { ws = new WebSocket(wsUrl); } catch (e) { resolve(`FAIL: ${e.message}`); return; }
        const timeout = setTimeout(() => { try { ws.close(); } catch {} resolve('TIMEOUT (5s)'); }, 5000);
        ws.onopen = () => { clearTimeout(timeout); try { ws.close(); } catch {} resolve('OK: Hocuspocus connected'); };
        ws.onerror = () => { clearTimeout(timeout); resolve('FAIL: server rejected'); };
        ws.onclose = (e) => { clearTimeout(timeout); resolve(`CLOSED: code=${e.code}`); };
      });
      setHocuspocusResult(result);
    } catch (e) {
      setHocuspocusResult(`FAIL: ${e.message || 'unknown'}`);
    }
  }, [client]);

  useEffect(() => {
    if (visible) checkPermissions();
  }, [visible, checkPermissions]);

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

  const Row = ({ label, value, ok }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, ok !== undefined && (ok ? styles.ok : styles.error)]}>{value}</Text>
    </View>
  );

  const ErrorLine = ({ label, error }) => (
    <Text style={styles.errorText}>{label}: {error ? error.slice(0, 150) : 'none'}</Text>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Diagnostics</Text>

        <Section title="Subscription Errors (read)">
          <ErrorLine label="user_current" error={userError?.message || String(userError)?.slice(0,120)} />
          <ErrorLine label="user_list" error={userListError?.message || String(userListError)?.slice(0,120)} />
          <ErrorLine label="meeting" error={meetingError?.message || String(meetingError)?.slice(0,120)} />
          <ErrorLine label="shared_notes" error={sharedNotesError} />
        </Section>

        <Section title="Media Init">
          <Row label="userId" value={userId || 'MISSING'} ok={!!userId} />
          <Row label="currentUser count" value={String(currentUserData?.user_current?.length ?? 0)} ok={(currentUserData?.user_current?.length ?? 0) > 0} />
          <Row label="userList count" value={String(userListData?.user?.length ?? 0)} ok={(userListData?.user?.length ?? 0) > 0} />
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

        <Section title="Shared Notes">
          <Row label="padId" value={sharedNotesPadId || 'N/A'} ok={!!sharedNotesPadId} />
          <Row label="extId" value={sharedNotesExtId || 'N/A'} ok={!!sharedNotesExtId} />
          <TouchableOpacity style={styles.testButton} onPress={testHocuspocus}>
            <Text style={styles.testButtonText}>Test Hocuspocus WS</Text>
          </TouchableOpacity>
          {hocuspocusResult !== 'not tested' && (
            <Text style={[styles.resultText, hocuspocusResult.startsWith('OK') ? styles.ok : styles.error]}>
              {hocuspocusResult}
            </Text>
          )}
        </Section>

        <Section title="Connectivity">
          <TouchableOpacity style={styles.testButton} onPress={testSfuWithToken}>
            <Text style={styles.testButtonText}>Test SFU WebSocket</Text>
          </TouchableOpacity>
          {sfuTokenResult !== 'not tested' && (
            <Text style={[styles.resultText, sfuTokenResult.startsWith('OK') ? styles.ok : styles.error]}>
              {sfuTokenResult}
            </Text>
          )}
        </Section>

        <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
          <Text style={styles.closeText}>Close</Text>
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

const styles = StyleSheet.create({
  hiddenTrigger: { position: 'absolute', top: 0, right: 0, width: 60, height: 60, zIndex: 9999, backgroundColor: 'transparent' },
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9998, padding: 16, paddingTop: 40 },
  title: { color: '#00ff00', fontSize: 18, fontWeight: 'bold', marginBottom: 12, fontFamily: 'monospace' },
  section: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 8 },
  sectionTitle: { color: '#ffcc00', fontSize: 14, fontWeight: 'bold', marginBottom: 6, fontFamily: 'monospace' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  label: { color: '#cccccc', fontSize: 12, fontFamily: 'monospace' },
  value: { color: '#ffffff', fontSize: 12, fontFamily: 'monospace' },
  ok: { color: '#00ff00' },
  error: { color: '#ff4444' },
  closeButton: { marginTop: 20, padding: 12, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#ffffff', fontSize: 14, fontFamily: 'monospace' },
  permButton: { backgroundColor: '#ff6600', padding: 8, borderRadius: 4, marginVertical: 6, alignItems: 'center' },
  permButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  testButton: { backgroundColor: '#0066ff', padding: 8, borderRadius: 4, marginVertical: 6, alignItems: 'center' },
  testButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  resultText: { fontSize: 11, fontFamily: 'monospace', marginTop: 4, padding: 4, backgroundColor: '#222' },
  errorText: { color: '#ff8888', fontSize: 11, fontFamily: 'monospace', marginVertical: 2 },
});

export default MediaDiagnostics;
