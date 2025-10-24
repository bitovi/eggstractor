import { FC, SVGAttributes } from 'react';

interface CopyIconProps extends SVGAttributes<SVGSVGElement> {
  copied?: boolean;
}

export const CopyIcon: FC<CopyIconProps> = ({ copied = false, ...props }) =>
  copied ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <title>Check mark icon</title>
      <path
        d="M8.25 12.75L10.5 15L15.75 9.75"
        stroke="#01A6AE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="#01A6AE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M15.75 15.75H20.25V3.75H8.25V8.25"
        stroke="#01A6AE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.75 8.25H3.75V20.25H15.75V8.25Z"
        stroke="#01A6AE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
