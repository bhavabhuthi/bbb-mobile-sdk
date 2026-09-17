/**
 * Parse room URLs to extract metadata.
 * Supports Greenlight room URLs and BBB join URLs.
 */

/**
 * Extract room info from a Greenlight room URL.
 * e.g., https://server/rooms/ran-fjv-7yd
 *        https://server/rooms/ran-fjv-7yd/join
 */
export const parseGreenlightUrl = (url) => {
  if (!url) return null;
  try {
    const match = url.match(/https?:\/\/([^/]+)\/rooms\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return {
        type: 'greenlight',
        host: match[1],
        roomId: match[2],
        greenlightUrl: `https://${match[1]}/rooms/${match[2]}`,
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
};

/**
 * Extract host from a BBB join URL.
 * e.g., https://server/bigbluebutton/api/join?meetingID=xxx
 */
export const parseBbbUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const meetingId = parsed.searchParams.get('meetingID');
    if (meetingId) {
      return {
        type: 'bbb',
        host: parsed.hostname,
        meetingId,
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
};

/**
 * Auto-detect URL type and parse accordingly.
 */
export const parseRoomUrl = (url) => {
  return parseGreenlightUrl(url) || parseBbbUrl(url);
};

/**
 * Format relative time (e.g., "2h ago", "yesterday").
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};
