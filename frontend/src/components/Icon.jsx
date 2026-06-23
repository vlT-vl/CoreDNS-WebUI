import {
  FiGlobe, FiRepeat, FiSearch, FiFileText, FiInfo, FiPlus,
  FiTrash2, FiRefreshCw, FiCopy, FiX, FiCheck, FiServer, FiAlertCircle,
} from 'react-icons/fi';

const ICONS = {
  globe:   FiGlobe,
  reverse: FiRepeat,
  search:  FiSearch,
  file:    FiFileText,
  info:    FiInfo,
  plus:    FiPlus,
  trash:   FiTrash2,
  refresh: FiRefreshCw,
  copy:    FiCopy,
  x:       FiX,
  check:   FiCheck,
  server:  FiServer,
  alert:   FiAlertCircle,
};

export const Icon = ({ name, size = 16, color = "currentColor", className }) => {
  const Comp = ICONS[name];
  if (!Comp) return null;
  return <Comp size={size} color={color} className={className} />;
};

export const CoreDNSLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#071428"/>
    <g transform="translate(58,42) rotate(-15)">
      <rect x="-24" y="-24" width="48" height="48" rx="12" fill="#0d2550"/>
    </g>
    <g transform="translate(42,58) rotate(-15)">
      <rect x="-24" y="-24" width="48" height="48" rx="12" fill="#1a4a9a"/>
    </g>
    <g transform="translate(42,58) rotate(-15)">
      <rect x="-13" y="-13" width="26" height="26" rx="7" fill="#e0eaf8"/>
      <rect x="-7" y="-7" width="14" height="14" rx="4" fill="#1a4a9a"/>
    </g>
  </svg>
);
