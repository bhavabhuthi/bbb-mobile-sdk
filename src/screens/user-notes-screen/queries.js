import { gql } from '@apollo/client';

// A subscription rather than the web's `useQuery`: this screen mounts on drawer
// focus, possibly before akka-apps has created the pad.
// sharedNotesExtId is typically "notes" (the default pad for a meeting).
const SHARED_NOTES_SUBSCRIPTION = gql`
  subscription sharedNotes {
    sharedNotes {
      padId
      sharedNotesExtId
    }
  }
`;

export default {
  SHARED_NOTES_SUBSCRIPTION,
};
