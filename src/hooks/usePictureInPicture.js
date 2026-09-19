import { useEffect, useCallback, useRef, useState } from 'react';
import { NativeModules, Platform, AppState } from 'react-native';

const { PictureInPictureModule } = NativeModules;

/**
 * Hook to manage Picture-in-Picture mode.
 * Automatically enters PiP when the app is backgrounded during a meeting.
 *
 * @param {boolean} isInMeeting - Whether the user is currently in a meeting
 * @param {boolean} isAudioConnected - Whether audio is connected (PiP is useful)
 */
const usePictureInPicture = (isInMeeting, isAudioConnected) => {
  const [pipSupported, setPipSupported] = useState(false);
  const [inPipMode, setInPipMode] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  // Check PiP support on mount
  useEffect(() => {
    if (Platform.OS === 'android' && PictureInPictureModule) {
      PictureInPictureModule.isPipSupported().then(setPipSupported);
    }
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    if (!pipSupported) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextAppState;

      // App going to background during a meeting → enter PiP
      if (nextAppState === 'background' && prevState === 'active') {
        if (isInMeeting && isAudioConnected) {
          PictureInPictureModule.enterPip().then((success) => {
            if (success) setInPipMode(true);
          }).catch(() => {});
        }
      }

      // App coming back to foreground → update state
      if (nextAppState === 'active' && prevState === 'background') {
        if (PictureInPictureModule) {
          PictureInPictureModule.isInPipMode().then((isInPip) => {
            setInPipMode(isInPip);
          });
        }
      }
    });

    return () => subscription.remove();
  }, [pipSupported, isInMeeting, isAudioConnected]);

  // Manually enter PiP
  const enterPip = useCallback(async () => {
    if (!PictureInPictureModule) return false;
    try {
      const result = await PictureInPictureModule.enterPip();
      setInPipMode(result);
      return result;
    } catch {
      return false;
    }
  }, []);

  // Manually exit PiP (return to full screen)
  const exitPip = useCallback(() => {
    setInPipMode(false);
  }, []);

  return {
    pipSupported,
    inPipMode,
    enterPip,
    exitPip,
  };
};

export default usePictureInPicture;
