import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { registerGlobals } from '@livekit/react-native';
registerGlobals();

import App from './App';

// export for sdk purposes (host apps import this)
export default App;

// Always use the standalone wrapper as the root component.
// The standalone wrapper provides:
//   - Server URL input screen (when no joinURL prop is provided)
//   - Greenlight room URL detection (auto-resolves /rooms/ links)
//   - WebView-based join flow
//   - Proper leave handling (returns to input screen)
//
// The standalone wrapper renders the core App internally when a joinURL
// is available (either via prop or after user input). Host apps that embed
// the SDK can still pass joinURL directly to the exported App component.
const RootComponent = (() => {
  try {
    return require('./standalone/App').default;
  } catch {
    // Standalone wrapper not available (e.g., SDK consumed as library)
    return App;
  }
})();

registerRootComponent(RootComponent);
