import { SVGProps } from 'react';

export function PylonLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Crystal top */}
      <path
        d="M12 2L20 7V9L12 4L4 9V7L12 2Z"
        fill="currentColor"
        className="text-blue-500"
      />
      {/* Main crystal body */}
      <path
        d="M12 4L20 9V15L12 20L4 15V9L12 4Z"
        fill="currentColor"
        className="text-blue-400"
      />
      {/* Energy glow lines */}
      <path
        d="M12 8L16 10.5V13.5L12 16L8 13.5V10.5L12 8Z"
        fill="currentColor"
        className="text-blue-300"
      />
      {/* Base */}
      <path
        d="M12 20L18 16V18L12 22L6 18V16L12 20Z"
        fill="currentColor"
        className="text-blue-600"
      />
    </svg>
  );
}