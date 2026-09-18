import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '../src/store/redux/store';
import HomeScreen from '../src/screens/home-screen';
import AddRoomScreen from '../src/screens/add-room-screen';
import LoginScreen from '../src/screens/login-screen';

import GreenlightWebView from '../src/screens/greenlight-webview';
import useRoomHistory from '../src/hooks/useRoomHistory';
import useAuth from '../src/hooks/useAuth';
import Colors from '../src/constants/colors';

/**
 * Standalone app wrapper that provides:
 * - Home screen with quick-access room cards
 * - Add room manually
 * - Greenlight WebView join flow
 * - Direct BBB URL join
 *
 * All standalone-specific UI is isolated here. The core App.js is used
 * only for the actual conference (BBB meeting).
 */

// Simple navigation context (no react-navigation dependency needed)
const NavigationContext = createContext({});

const useNavigation = () => useContext(NavigationContext);

/**
 * Navigation: Home → WebView → Conference → Home (after leave)
 */
const StandaloneApp = (props) => {
  const [currentScreen, setCurrentScreen] = useState('home'); // home | addRoom | login | serverInput | webview | conference
  const [serverUrl, setServerUrl] = useState(null);
  const [webviewUrl, setWebviewUrl] = useState(null);
  const { saveRoom } = useRoomHistory();
  const { credentials, saveCredentials } = useAuth();

  const injectStore = useCallback(() => {
    const { injectStore: injectStoreVM } = require('../src/services/webrtc/video-manager');
    const { injectStore: injectStoreSM } = require('../src/services/webrtc/screenshare-manager');
    const { injectStore: injectStoreAM } = require('../src/services/webrtc/audio-manager');
    injectStoreVM(store);
    injectStoreSM(store);
    injectStoreAM(store);
  }, []);

  useEffect(() => {
    injectStore();
  }, [injectStore]);

  // Navigate to WebView for a room (from quick URL or room card)
  const handleJoinRoom = useCallback((room) => {
    // Save/update room in history (updates lastJoined timestamp)
    saveRoom(room);
    // Open WebView to resolve the Greenlight join URL
    setWebviewUrl(room.greenlightUrl || room.bbbUrl);
    setCurrentScreen('webview');
  }, [saveRoom]);

  // Navigate to Add Room screen
  const handleAddRoom = useCallback(() => {
    setCurrentScreen('addRoom');
  }, []);

  // Handle WebView join URL interception
  const handleWebViewJoin = useCallback((bbbJoinUrl) => {
    setServerUrl(bbbJoinUrl);
    setWebviewUrl(null);
    setCurrentScreen('conference');
  }, []);

  // Go back from WebView
  const handleWebViewBack = useCallback(() => {
    setWebviewUrl(null);
    setCurrentScreen('home');
  }, []);

  // Handle leaving the meeting
  const handleLeaveSession = useCallback(() => {
    setServerUrl(null);
    setCurrentScreen('home');
  }, []);

  // Handle saving a new room from AddRoomScreen
  const handleSaveRoom = useCallback((room) => {
    saveRoom(room);
  }, [saveRoom]);

  // Handle login/logout
  const handleLogin = useCallback(async (creds) => {
    saveCredentials(creds);
    // Save any rooms captured from Greenlight API
    if (creds.rooms?.length) {
      // Save all rooms in parallel
      await Promise.all(creds.rooms.map((room) => saveRoom({
        name: room.name || room.friendly_id || 'Room',
        greenlightUrl: `https://${creds.server?.replace(/^https?:\/\//, '')}/rooms/${room.friendly_id}`,
        bbbHost: creds.server?.replace(/^https?:\/\//, '') || '',
        roomId: room.friendly_id || room.id || '',
        icon: '📅',
      })));
    }
    setCurrentScreen('home');
  }, [saveCredentials, saveRoom]);

  const { default: CoreApp } = require('../App');

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'addRoom':
        return (
          <AddRoomScreen
            onSave={handleSaveRoom}
            onBack={() => setCurrentScreen('home')}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onLoggedIn={handleLogin}
            onBack={() => setCurrentScreen('home')}
            existingCredentials={credentials}
          />
        );

      case 'webview':
        return (
          <GreenlightWebView
            roomUrl={webviewUrl}
            onJoinUrl={handleWebViewJoin}
            onBack={handleWebViewBack}
          />
        );

      case 'conference':
        return (
          <CoreApp
            {...props}
            joinURL={serverUrl}
            onLeaveSession={handleLeaveSession}
          />
        );

      case 'home':
      default:
        return (
          <HomeScreen
            onJoinRoom={handleJoinRoom}
            onAddRoom={handleAddRoom}
            credentials={credentials}
            onLogin={() => setCurrentScreen('login')}
            onLogout={() => saveCredentials(null)}
          />
        );
    }
  };

  return (
    <Provider store={store}>
      <View style={{ flex: 1, backgroundColor: Colors.blueBackgroundColor }}>
        {renderScreen()}
      </View>
    </Provider>
  );
};

export default StandaloneApp;
