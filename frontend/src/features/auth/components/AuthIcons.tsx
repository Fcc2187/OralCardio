interface IconProps {
  className?: string;
}

export function OralCardioLogo({ className = "size-20 text-primary-action" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Heart */}
      <path
        d="M32 55.5C32 55.5 11.5 42 11.5 25.5C11.5 17.2 17.5 11 25.5 11C29.5 11 31.5 13.5 32 15C32.5 13.5 34.5 11 38.5 11C46.5 11 52.5 17.2 52.5 25.5C52.5 42 32 55.5 32 55.5Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Tooth */}
      <path
        d="M24.8 24.8C23.5 24.8 22.2 26.5 22.5 30C22.7 33.5 24.5 37.8 25.6 42.2C26.1 43.8 27.6 44.2 28.5 42.6C29.5 40.6 30.8 36.8 32 36.8C33.2 36.8 34.5 40.6 35.5 42.6C36.4 44.2 37.9 43.8 38.4 42.2C39.5 37.8 41.3 33.5 41.5 30C41.8 26.5 40.5 24.8 39.2 24.8C37.5 24.8 36.2 26.5 32 26.5C27.8 26.5 26.5 24.8 24.8 24.8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmailIcon({ className = "size-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 7.2 5.4c.5.4 1.1.4 1.6 0L20 7" />
    </svg>
  );
}

export function LockIcon({ className = "size-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 1 1 8 0v3.5" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

export function UserIcon({ className = "size-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
    </svg>
  );
}

export function EyeIcon({ className = "size-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = "size-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.4 0 9.3 5.1 9.3 8s-1.5 4.4-3.6 5.8" />
      <path d="M6.2 6.2C4.1 7.6 2.7 9.8 2.7 12c0 2.9 3.9 8 9.3 8 1 0 2-.2 2.9-.6" />
    </svg>
  );
}
