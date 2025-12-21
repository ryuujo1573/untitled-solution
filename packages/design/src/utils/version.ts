declare const __BUILD_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __GIT_HASH__: string | undefined;
declare const __GIT_DIRTY__: boolean | undefined;

export function getVersionInfo() {
  const version = __BUILD_VERSION__;
  const buildTime = __BUILD_DATE__;
  const gitHash = __GIT_HASH__;
  const isDirty = __GIT_DIRTY__;
  const isDev = !!import.meta.env.DEV;

  return { version, buildTime, gitHash, isDirty, isDev };
}
