# Chrome Cookie Profile Manager

This is a Chrome extension designed for developers, with the core function of enabling you to easily create, save, load, and manage multiple sets of different cookie profiles. This tool can significantly improve your workflow on websites that require frequent switching between different user accounts or testing various user scenarios.

## Core Features

*   **Cloud Sync**: Uses the `chrome.storage.sync` API to automatically sync all your profiles across different computers where you are logged into the same Chrome account.
*   **Multi-profile Management**: Save multiple sets of cookie collections and name them for easy identification and switching.
*   **One-click Load and Apply**: Select a profile from the popup interface to apply all cookies in that profile to the current page with a single click.
*   **Create from Current Page**: Quickly save all cookies from the current page as a new profile.
*   **Create from String**: Create a new profile by directly pasting a cookie string in the `key=value; ...` format.
*   **Edit and Preview**: Preview, add, or delete individual cookies in a profile before applying it.
*   **Import and Export**: Easily export your profiles in JSON format for backup or sharing with team members.
*   **Clear Page Cookies**: Clear all cookies on the current page with a single click to start fresh.

## Installation and Setup

As this extension is still under development, you need to load it manually:

1.  Open the Chrome browser, enter `chrome://extensions` in the address bar, and go.
2.  Enable **"Developer mode"** in the upper right corner of the page.
3.  Click **"Load unpacked"** in the upper left corner.
4.  In the dialog that appears, select the root directory of this project (the directory containing the `manifest.json` file).
5.  Once completed, the extension icon will appear in the Chrome toolbar.

## How to Use

1.  Click the extension icon in the Chrome toolbar to open the popup interface.
2.  **Manage Profiles**: In the "Profile Management" tab, you can select a saved profile and click "Load", or delete unwanted profiles.
3.  **Edit and Create**:
    *   In the "Editor & Create" tab, you can view the currently loaded cookies or manually create a new profile.
    *   Click "Save changes to current profile" to update the loaded profile.
    *   Click "Save cookies from the current tab as a new profile" to quickly create one.
    *   Paste a cookie string and name it to create a profile from a string.
4.  **Tools**: In the "Tools" tab, you can export selected profiles or import from a JSON file.

## Development

To set up the development environment, you need to have Node.js and npm installed.

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run tests**:
    ```bash
    npm test
    ```

## Technical Details

*   **Data Sync**: This extension uses the `chrome.storage.sync` API to store your profiles. This allows your data to be automatically synced across multiple devices through your Google account.
*   **Storage Structure**: To circumvent the 8KB size limit for a single item in `chrome.storage.sync`, we have adopted a split storage strategy. Each cookie profile is stored as a separate item (e.g., `profile_MyProfile`), while an array named `profile_list` is maintained to track all profile names. This structure ensures that the extension remains stable even when storing a large number of or large profiles.

## Project Structure

```
/
├── manifest.json         # The core configuration file for the extension
├── popup.html            # The HTML structure of the popup window
├── popup.css             # The stylesheet for the popup window
├── js/
│   ├── main.js           # Main logic, entry point, and data migration
│   ├── editor.js         # Cookie editing and application logic
│   ├── profiles.js       # Profile loading, saving, and deletion
│   ├── state.js          # Global state management (DOM references and variables)
│   ├── tabs.js           # Tab switching logic within the popup
│   ├── tools.js          # Tools like import/export
│   └── ui.js             # UI rendering and update logic
├── images/               # Contains icons and other image resources
└── README.md             # This documentation file
```
