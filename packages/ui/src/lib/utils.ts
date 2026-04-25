import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type OnKeyDownMap = Record<
  string,
  (e: React.KeyboardEvent<HTMLInputElement>) => void
>;
export function onKeyDown(config: OnKeyDownMap) {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    const handler = config[e.key];
    if (handler) handler(e);
  };
}
