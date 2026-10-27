export const TEAM_EMOJIS = [
  '👩‍💻', '👨‍💻', '🧑‍💻', '🧙‍♂️', '🦉', '🦊', '🦁', '⚡',
  '🚀', '🛡️', '🤖', '🎯', '🔍', '🧪', '👑', '💎',
  '💡', '🦾', '🕵️‍♂️', '🐞', '🐺', '🐱', '🦄', '🦅'
];

export function getUserEmoji(avatar?: string, role?: string): string {
  if (avatar && !avatar.startsWith('http') && !avatar.startsWith('data:') && avatar.trim().length > 0) {
    return avatar.trim();
  }
  switch (role) {
    case 'admin':
      return '👑';
    case 'test_manager':
      return '🎯';
    case 'qa_lead':
      return '🛡️';
    case 'qa_engineer':
      return '🧪';
    case 'product_owner':
      return '💼';
    case 'viewer':
      return '👀';
    default:
      return '👩‍💻';
  }
}
