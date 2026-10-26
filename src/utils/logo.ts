/**
 * Utility to get correct URL for static assets (logo, icon) across all deployment
 * environments, especially GitHub Pages subpath hosting (e.g. https://username.github.io/repo/).
 */

export const getLogoUrl = (): string => {
  const base = import.meta.env.BASE_URL || './';
  // If base is relative './', resolve to relative 'logo.jpg'
  if (base === './' || base === '') {
    return 'logo.jpg';
  }
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}logo.jpg`;
};

export const getIconSvgUrl = (): string => {
  const base = import.meta.env.BASE_URL || './';
  if (base === './' || base === '') {
    return 'icon.svg';
  }
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}icon.svg`;
};
