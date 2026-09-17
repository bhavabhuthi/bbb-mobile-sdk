import styled from 'styled-components/native';
import { ActivityIndicator, IconButton } from 'react-native-paper';
import Colors from '../../constants/colors';

const ContainerScreen = styled.View`
  width: 100%;
  height: 100%;
`;

const CenteredContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const MessageText = styled.Text`
  color: ${Colors.white};
  font-size: 16px;
  line-height: 24px;
  text-align: center;
`;

const Spinner = styled(ActivityIndicator).attrs(() => ({
  color: Colors.orange,
}))``;

const ToggleActionsBarIconButton = ({
  onPress
}) => {
  return (
    <IconButton
      style={{
        position: 'absolute', right: 5, top: 5, margin: 0, zIndex: 1,
      }}
      icon="more"
      mode="contained"
      iconColor={Colors.white}
      containerColor={Colors.orange}
      size={14}
      onPress={onPress}
    />
  );
};

const ConnectionErrorOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 24px;
`;

const ConnectionErrorText = styled.Text`
  color: ${Colors.white};
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  margin-bottom: 24px;
`;

const OpenInBrowserButton = styled.TouchableOpacity`
  background-color: ${Colors.orange};
  padding-vertical: 12px;
  padding-horizontal: 24px;
  border-radius: 8px;
`;

const OpenInBrowserText = styled.Text`
  color: ${Colors.white};
  font-size: 16px;
  font-weight: bold;
`;

export default {
  ContainerScreen,
  CenteredContainer,
  MessageText,
  Spinner,
  ToggleActionsBarIconButton,
  ConnectionErrorOverlay,
  ConnectionErrorText,
  OpenInBrowserButton,
  OpenInBrowserText,
};
