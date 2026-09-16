import { gql } from '@apollo/client';

// Minimal subscription: only fields actually read by the SDK / present on
// older hasura schemas (virtual.swecha.org). Extra fields cause the whole
// subscription to fail ("field X not found in type user_current").
const USER_CURRENT_SUBSCRIPTION = gql`
  subscription userCurrentSubscription {
    user_current {
      authToken
      avatar
      away
      clientType
      color
      ejectReason
      ejected
      reactionEmoji
      extId
      guest
      guestStatus
      isModerator
      currentlyInMeeting
      joined
      locked
      name
      presenter
      raiseHand
      role
      userId
      meeting {
        ended
        endedReasonCode
        endedByUserName
        logoutUrl
      }
      cameras {
        streamId
      }
      voice {
        joined
        spoke
        listenOnly
      }
    }
  }
`;

export default USER_CURRENT_SUBSCRIPTION;
