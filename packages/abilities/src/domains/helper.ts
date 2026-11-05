import type { BaseSubject } from "..";

export type GetBaseType<T> = Extract<T, BaseSubject>;
