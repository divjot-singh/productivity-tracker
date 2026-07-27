import { FC } from 'react';

const SettingsIcon: FC = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.983 3.5a1 1 0 01.986.835l.247 1.47a6.99 6.99 0 011.522.879l1.387-.555a1 1 0 011.235.43l1 1.732a1 1 0 01-.25 1.285l-1.14.915a7.1 7.1 0 010 1.758l1.14.915a1 1 0 01.25 1.285l-1 1.732a1 1 0 01-1.235.43l-1.387-.555a6.99 6.99 0 01-1.522.879l-.247 1.47a1 1 0 01-.986.835h-2a1 1 0 01-.986-.835l-.247-1.47a6.99 6.99 0 01-1.522-.879l-1.387.555a1 1 0 01-1.235-.43l-1-1.732a1 1 0 01.25-1.285l1.14-.915a7.1 7.1 0 010-1.758l-1.14-.915a1 1 0 01-.25-1.285l1-1.732a1 1 0 011.235-.43l1.387.555a6.99 6.99 0 011.522-.879l.247-1.47A1 1 0 0110.017 3.5h1.966z"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    />
  </svg>
);

export default SettingsIcon;