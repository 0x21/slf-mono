/* eslint-disable @typescript-eslint/no-unused-vars */
import type { VisibilityState } from "@tanstack/react-table";

const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};

export const getLocalStorage = (): Storage | void => {
  if (isBrowser()) {
    return window.localStorage;
  }
};

export const getGenericItemPerPage = (key: string, defaultItemCount = 10) => {
  const localStorage = getLocalStorage();
  return parseInt(localStorage?.getItem(key) ?? defaultItemCount.toString());
};

export const setGenericItemPerPage = (key: string, pageSize: number) => {
  const localStorage = getLocalStorage();
  localStorage?.setItem(key, pageSize.toString());
  return;
};

export const getGenericVisibleColumns = (key: string) => {
  const localStorage = getLocalStorage();
  const columnsJson = localStorage?.getItem(key);
  if (columnsJson) {
    try {
      const data = JSON.parse(columnsJson) as VisibilityState;
      return data;
    } catch (error) {
      return {};
    }
  }
  return {};
};

export const setGenericVisibleColumns = (
  key: string,
  state: VisibilityState,
) => {
  const localStorage = getLocalStorage();
  localStorage?.setItem(key, JSON.stringify(state));
  return;
};
