type AccessTokenSyncHandler = (accessToken: string) => void;

let accessTokenSyncHandler: AccessTokenSyncHandler | null = null;

export const registerAccessTokenSyncHandler = (
  handler: AccessTokenSyncHandler,
): void => {
  accessTokenSyncHandler = handler;
};

export const syncAuthStateFromAccessToken = (accessToken: string): void => {
  accessTokenSyncHandler?.(accessToken);
};
