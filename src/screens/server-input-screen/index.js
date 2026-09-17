import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { URL_TYPES, detectUrlType } from '../../utils/url-detection';
import Styled from './styles';

const ServerInputScreen = ({ onSubmit, onBack }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    if (!url.trim()) return;

    const { type, url: normalizedUrl } = detectUrlType(url.trim());

    switch (type) {
      case URL_TYPES.GREENLIGHT_ROOM:
        onSubmit({ type: 'webview', url: normalizedUrl });
        break;
      case URL_TYPES.BBB_JOIN:
        onSubmit({ type: 'bbb', url: normalizedUrl });
        break;
      case URL_TYPES.INVALID:
        // Don't submit invalid URLs — user feedback could be added here
        break;
      default:
        // Unknown format — try as BBB URL for backward compatibility
        onSubmit({ type: 'bbb', url: normalizedUrl });
        break;
    }
  };

  const isValidUrl = detectUrlType(url.trim()).type !== URL_TYPES.INVALID;

  return (
    <Styled.Container>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 16, padding: 8 }}>
          <Text style={{ color: '#ffffff', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
      )}
      <Styled.Label>Enter BBB or Greenlight URL</Styled.Label>
      <Styled.Input
        placeholder="https://virtual.swecha.org/rooms/your-room"
        placeholderTextColor="#666666"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={true}
      />
      <Styled.Button
        disabled={!url.trim() || !isValidUrl}
        onPress={handleSubmit}
      >
        <Styled.ButtonText>Join</Styled.ButtonText>
      </Styled.Button>
      <Styled.HelperText>
        Paste a Greenlight room link or BigBlueButton join URL
      </Styled.HelperText>
    </Styled.Container>
  );
};

export default ServerInputScreen;
