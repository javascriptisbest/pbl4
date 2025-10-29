// Default avatars - hosted locally or from reliable CDN
// Sử dụng UI Avatars API (fast & reliable) hoặc emoji avatars
export const defaultAvatars = [
  // Emoji style avatars (instant load, no external dependency)
  {
    id: 1,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%234F46E5'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E😊%3C/text%3E%3C/svg%3E",
    label: "Happy"
  },
  {
    id: 2,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310B981'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E😎%3C/text%3E%3C/svg%3E",
    label: "Cool"
  },
  {
    id: 3,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23F59E0B'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🥳%3C/text%3E%3C/svg%3E",
    label: "Party"
  },
  {
    id: 4,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23EF4444'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E😍%3C/text%3E%3C/svg%3E",
    label: "Love"
  },
  {
    id: 5,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%238B5CF6'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🤓%3C/text%3E%3C/svg%3E",
    label: "Nerd"
  },
  {
    id: 6,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2306B6D4'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🚀%3C/text%3E%3C/svg%3E",
    label: "Rocket"
  },
  {
    id: 7,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23EC4899'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🌟%3C/text%3E%3C/svg%3E",
    label: "Star"
  },
  {
    id: 8,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2314B8A6'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🎮%3C/text%3E%3C/svg%3E",
    label: "Game"
  },
  {
    id: 9,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23F97316'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🎨%3C/text%3E%3C/svg%3E",
    label: "Art"
  },
  {
    id: 10,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2384CC16'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🎵%3C/text%3E%3C/svg%3E",
    label: "Music"
  },
  {
    id: 11,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236366F1'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E⚡%3C/text%3E%3C/svg%3E",
    label: "Energy"
  },
  {
    id: 12,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23A855F7'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white' font-family='Arial'%3E🔥%3C/text%3E%3C/svg%3E",
    label: "Fire"
  },
];

// Hàm random một avatar
export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * defaultAvatars.length);
  return defaultAvatars[randomIndex];
};
