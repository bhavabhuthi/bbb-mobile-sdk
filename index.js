import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import Settings from './settings.json';
import { registerGlobals } from '@livekit/react-native';
registerGlobals();

import App from './App';

// export for sdk purposes (host apps import this)
export default App;

// In standalone mode (dev: true), use the standalone wrapper which provides
// server URL input and Greenlight room detection. In embedded mode (dev: false),
// use the core App directly.
// The MainActivity expects a component registered as "main", so we must always
// register regardless of dev mode.
const RootComponent = (() => {
  if (Settings.dev) {
    try {
      return require('./standalone/App').default;
    } catch {
      // Standalone wrapper not available, fall back to core App
      return App;
    }
  }
  return App;
})();

registerRootComponent(RootComponent);
