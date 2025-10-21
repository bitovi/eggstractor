import { FC, SVGAttributes } from 'react';

export const CopyIcon: FC<SVGAttributes<SVGSVGElement>> = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
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

export default CopyIcon;
