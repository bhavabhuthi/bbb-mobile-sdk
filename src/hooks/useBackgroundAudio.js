import { useEffect, useCallback, useRef } from 'react';
import { NativeModules, Platform, AppState, PermissionsAndroid } from 'react-native';

const { AudioForegroundModule } = NativeModules;

/**
 * Hook to manage the audio foreground service.
 * Starts the service when audio is joined, stops when audio is left.
 * Keeps audio active when the app is backgrounded.
 *
 * @param {boolean} isAudioConnected - Whether the user is currently in audio
 * @param {string} meetingName - Display name for the notification
 */
const useBackgroundAudio = (isAudioConnected, meetingName) => {
  const serviceStarted = useRef(false);
  const appState = useRef(AppState.currentState);

  const startService = useCallback(async () => {
    if (!AudioForegroundModule || Platform.OS !== 'android') return;
    if (serviceStarted.current) return;

    // Android 13+ requires POST_NOTIFICATIONS permission for foreground service notification
    if (Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          // Permission denied, but we can still start the service
          // The notification just won't show
        }
      } catch (e) {
        // Ignore permission errors, service can still run
      }
    }

    try {
      AudioForegroundModule.startService(
        meetingName || 'BigBlueButton',
        'Audio in progress — tap to return'
      );
      serviceStarted.current = true;
    } catch (e) {
      console.warn('Failed to start audio foreground service:', e);
    }
  }, [meetingName]);

  const stopService = useCallback(() => {
    if (!AudioForegroundModule || Platform.OS !== 'android') return;
    if (!serviceStarted.current) return;

    try {
      AudioForegroundModule.stopService();
      serviceStarted.current = false;
    } catch (e) {
      console.warn('Failed to stop audio foreground service:', e);
    }
  }, []);

  // Start/stop service based on audio state
  useEffect(() => {
    if (isAudioConnected) {
      startService();
    } else {
      stopService();
    }
  }, [isAudioConnected, startService, stopService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopService();
    };
  }, [stopService]);

  // Restart service if app comes back to foreground (service may have been killed)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isAudioConnected && !serviceStarted.current) {
        startService();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isAudioConnected, startService]);

  return { startService, stopService };
};

export default useBackgroundAudio;
