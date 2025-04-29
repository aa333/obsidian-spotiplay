# Obsidian Spotiplayer Plugin

A plugin to play specific tracks on your Spotify device directly from Obsidian.

- Embed links to Spotify tracks, playlists, or albums in your notes as convenient buttons.
- On button click, your Spotify device/client will play this track (or playlist).
- OAuth PKCE flow.

This plugin does not play music by itself, it only controls your Spotify player via WebAPI
Unfortunately, these API functions are only available for premium Spotify subscribers. You will also need to create your own Spotify app, although it's quite easy to do at the moment.

## Prerequisites

1. Ensure you have Premium Spotify subscription
2. Create your Spotify app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
3. Note down your `client_id` and `client_secret`.
4. Configure the app's redirect URI to `obsidian://obsidian-spotiplay`.

## Installation

1. Open your vault's plugins folder (`.obsidian/plugins`).
2. Clone the repository:
   ```
   git clone https://github.com/aa333/obsidian-spotiplay.git
   ```
3. Install dependencies (NPM should work as well):
   ```
   pnpm i
   ```
4. Build the plugin:
   ```
   pnpm build
   ```
5. Enable the plugin in Obsidian settings.

## Usage

Add a code block in your note with the `spotiplayer` language tag and following format:

~~~
```spotiplayer
label: Tavern Theme
uri: spotify:track:2uFaJJtFpPDc5Pa95XzTvg
```
~~~

- `label`: The button label.
- `uri`: The Spotify URI for a track, playlist, or album. No quotes, `spotify:` prefix required.
Example: https://open.spotify.com/track/0NNCkIadCP6VnV7LeGL1zx will turn into `spotify:track:0NNCkIadCP6VnV7LeGL1zx`

Click the button. Browser window will open - allow access to your account and redirect back to Obsidian. Your music should play.

## Development

- Run in watch mode:
  ```
  pnpm dev
  ```
- Use [hot-reload](https://github.com/pjeby/hot-reload) for automatic plugin reloads, or reload plugin manually in Obsidian.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes. 

## License

This project is licensed under the MIT License.