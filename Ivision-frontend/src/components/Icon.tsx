import type { ReactNode, SVGProps } from "react";

export type IconName = "camera" | "sparkles" | "scan" | "text" | "search" | "help" | "arrow" | "close" | "sound" | "speech" | "wifi" | "target";

const paths: Record<IconName, ReactNode> = {
  camera: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="m8 6 1.5-2h5L16 6" /><circle cx="12" cy="13" r="3.2" /></>,
  sparkles: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" /><circle cx="12" cy="12" r="2.5" /></>,
  text: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /><path d="M8 11h5.6M10.8 8.2v5.6" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-1.1 1.1-1.9 1.3-1.9 3M12 17.2h.01" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  sound: <><path d="M4 10v4h3l5 4V6l-5 4H4Z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
  speech: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.5-3.3A7.1 7.1 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M9 11v2M12 9v6M15 11v2" /></>,
  wifi: <><path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a8.5 8.5 0 0 1 11 0M10 16a3.2 3.2 0 0 1 4 0M12 20h.01" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /><path d="m15.5 8.5 5-5M17 3.5h3.5V7" /></>,
};

export function Icon({ name, size = 24, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name]}</svg>;
}
