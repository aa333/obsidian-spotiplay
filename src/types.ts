export const DEFAULT_SETTINGS: PlayerPluginSettings = {
  clientId: '',
  clientSecret: '',
  deviceId: null,
  accessToken: null,
};

export interface PlayerPluginSettings {
  clientId: string;
  clientSecret: string;
  deviceId: string | null;
  accessToken: string | null;
}
