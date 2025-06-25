# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
## 2.8.0
### Changed
- BREAKING: static/img/nsfw.2958239.png is now static/img/nsfw.DepQPhG0.png, which may affect people who specify exactly this path as the cover image
- BREAKING: static/emoji.json is replaced with a properly hashed path under static/js in the production build, meaning server admins cannot provide their own set of unicode emojis by overriding this file (custom (image-based) emojis not affected)
- Speed up initial boot.
- Updated our build system to support browsers:
  Safari >= 15
  Firefox >= 115
  Android > 4
  no Opera Mini support
  no IE support
  no "dead" (unmaintained) browsers support

This does not guarantee that browsers will or will not work.

- Use /api/v1/accounts/:id/follow for account subscriptions instead of the deprecated routes
- Modal layout for mobile has new layout to make it easy to use
- Better display of mute reason on posts
- Simplify the OAuth client_name to 'PleromaFE'
- Partially migrated from vuex to pinia
- Authenticate and subscribe to streaming after connection
- Tabs now have indentation for better visibility of which tab is currently active
- Upgraded Vue to version 3.5

### Added
- Support bookmark folders
- Some new default color schemes
- Added support for fetching /{resource}.custom.ext to allow adding instance-specific themes without altering sourcetree
- Post actions customization
- Support displaying time in absolute format
- Add draft management system
- Compress most kinds of images on upload.
- Added option to always convert images to JPEG format instead of using WebP when compressing images. 
- Added configurable image compression option in general settings, allowing users to control whether images are compressed before upload. 
- Inform users that Smithereen public polls are public
- Splash screen + loading indicator to make process of identifying initialization issues and load performance
- UI for making v3 themes and palettes, support for bundling v3 themes
- Make UserLink wrappable

### Fixed
- Fixed occasional overflows in emoji picker and made header scrollable
- Updated shadow editor, hopefully fixed long-standing bugs, added ability to specify shadow's name.
- Checkbox vertical alignment
- Check for canvas extract permission when initializing favicon service
- Fix some of the color manipulation functions
- Fix draft saving when auto-save is off
- Switch from class hack to normalButton attribute for emoji count popover
- Fix emoji inconsistencies in notifications,
- Fix some emoji not scaling with interface
- Make sure hover style is also applied to :focus-visible
- Improved ToS and registration
- Fix small markup inconsistencies
- Fixed modals buttons overflow
- Fix whitespaces for multiple status mute reasons, display bot status reason
- Create an OAuth app only when needed
- Fix CSS compatibility issues in style_setter.js for older browsers like Palemoon
- Proper sticky header for conversations on user page
- Add text label for more actions button in post status form
- Reply-or-quote buttons now take less space
- Allow repeats of own posts with private scopes
- Bookmarks visible again on mobile
- Remove focusability on hidden popover in subject input
- Show only month and day instead of weird "day, hour" format.

### Removed
- BREAKING: drop support for browsers that do not support `<script type="module">`
- BREAKING: css source map does not work in production (see https://github.com/vitejs/vite/issues/2830 )
- Remove emoji annotations code for unused languages from final build

## 2.7.1
Bugfix release. Added small optimizations to emoji picker that should make it a bit more responsive, however it needs rather large change to make it more performant which might come in a major release.

### Fixed
- Instance default theme not respected
- Nested panel header having wrong sticky position if navbar height != panel header height
- Toggled buttons having bad contrast (when using v2 theme)

### Changed
- Simplify the OAuth client_name to 'PleromaFE'
- Small optimizations to emoji picker


## 2.7.0

### Known issues
We got some reports related to emoji picker performance, this hopefully will be fixed in 2.7.1.

### Notes
This release overhauls how themes work, themes now need to be "compiled", which can cause some delay when loading for the first time and temporarily look "wrong" in some places (popups, menus, dialogs). Please do report any issues, especially if your theme looks wrong or breaks interface when loading. Also report issues if you're experiencing constant performance issues.

To admins: remember that you can update PleromaFE to recent `master` or `develop` in admin dashboard in "Front-ends" tab, scroll down to find PleromaFE box and click "Reinstall `master`" or dropdown and then "Reinstall `develop`". Currently there is no mechanism to check if there is an update or not.

### Changed
- Overhauled the way themes work, migrating to new Pleroma Interface Style Sheets system aka "Themes 3".
- Notifications are no longer sorted by "seen" status since interacting with them can change their read status and makes UI jumpy. Old behavior can be restored in settings.
- Notifications are now shown through a ServiceWorker (since mobile chrome does not allow them otherwise), it's always enabled, even if previously we only enabled it for WebPush notifications only. If you don't like websites "running" while closed, check how to disable them in your browser. Old way to show notifications will be used as a fallback but might not have all the new features.
- Reorganized Settings modal to move out visual stuff into Appearance tab

### Added
- Emoji pack management to the admin panel
- Support `status` notification type (subscriptions/bell, fixes PleromaFE on newer PleromaBE versions)
- Poll end notifications.
- Added option to not mark all notifications when closing notifications drawer on mobile, this creates a new button to mark all as seen.
- Option to always "show" notifications when using web push for better compatibility with some browsers (chrome, edge, safari)
- Option to toggle what notification types appear in native notifications, by default less important ones (likes, repeats, etc) will no longer show up in native notifications.
- Option to treat non-interactive notifications (likes, repeats et all) as seen for visual purposes (no read mark, ignored in counters, still can show in native notifications)
- Ability to resize UI (and certain components) scale independent of browser/text scale
- Ability to override certain aspects of UI style independent of theme used (UI roundness, fonts, underlay)
- Theme selector with visual previews of the theme
- Display loading and error indicator for conversation page
- Option to only show scrobbles that are recent enough
- Interacting (opening reply box etc) or simply clicking on non-interactive notifications now marks them as read. Clicking on native notifications for non-interactive ones also marks them as seen.
- Support group actors
- Focusing into a tab clears all current desktop notifications
- Ability to change size of emoji
- Ability to view APNG (Animated PNG) attachments.
- Support showing extra notifications in the notifications column
- Create a link to the URL of the scrobble when it's present
- Allow hiding custom emojis in picker.
- Ability to mute sensitive posts (ported from eintei).
- Native notifications now also have "badge" property that matches instance's favicon (visible in Android Chromium at least)
- Display public favorites on user profiles
- Display quotes count on posts and add quotes list page
- Show a dedicated registration notice page when further action is required after registering

### Fixed
- Synchronized requested notification types with backend, hopefully should fix missing notifications for polls and follow requests
- Error that appeared on mobile Chromium (and derivatives) when native notifications are allowed
- Being unable to set notification visibility for reports and follow requests
- Native notifications appearing as many times as there are open tabs. Clicking on notification will focus last focused tab.
- The expiry date indication won't be shown if the poll never expires
- Profile mentions causing a 422 error on newer PleromaBE versions.
- Color inputs are less ugly now
- Unread notifications should now properly catch up between sessions (eventually) in polling mode
- Video posters on Safari


## 2.6.1
### Fixed
- fix admin dashboard not having any feedback on frontend installation
- Fix frontend admin tab crashing when no primary frontend is set
- Add aria attributes to react and extra buttons

## 2.6.0
### Added
- add the initial i18n translation file for Taiwanese (Hokkien), and modify some related files.
- Implemented a very basic instance administration screen
- Implement quoting

### Fixed
- Keep aspect ratio of custom emoji reaction in notification
- Fix openSettingsModalTab so that it correctly opens Settings modal instead of Admin modal
- Add alt text to emoji picker buttons
- Use export-subst gitattribute to allow tarball builds
- fix reports now showing reason/content
- Fix HTML attribute parsing, discard attributes not strating with a letter
- Make MentionsLine aware of line breaking by non-br elements
- Fix a bug where mentioning a user twice will not fill the mention into the textarea
- Fix parsing non-ascii tags
- Fix OAuth2 token lingering after revocation
- fix regex issue in HTML parser/renderer
- don't display quoted status twice
- fix typo in code that prevented cards from showing at all
- Fix react button not working if reaction accounts are not loaded
- Fix react button misalignment on safari ios
- Fix pinned statuses gone when reloading user timeline
- Fix scrolling emoji selector in modal in safari ios

## 2.5.1
### Fixed
- Checkboxes in settings can now work with screenreaders
- Autocomplete in edit boxes can now work with screenreaders
- Status interact buttons now have focus indicator for anonymous users
- Top bar buttons now correctly have text labels
- It is now possible to register if the site admin requires birthday to register
- User cards from search results will correctly popup
- Fix notification attachment icon overflow
- Editing mute words is less laggy
- Repeater's name will no longer mess up with the directionality of the text sitting on the same line
- Unauthenticated access will give better error messages
- It is now easier to close the media viewer with a mouse when there is only one image
- Deleting profile fields can work properly
- Clicking the react button will correctly focus the search box
- Clicking buttons on the top-bar will no longer bring you to the top of the page
- Emoji picker is much faster to load
- `blockquote`s have a better display style
- Announcements posting and editing are now available to everyone with such a privilege, not just admins
- Adding or removing list members will actually work
- Emojis without a pack are now correctly displayed in emoji picker
- Changing notification settings will actually work

### Added
- You can now set and see birthdays
- Optional confirmation dialogs when performing various actions
- You can now set fallback languages

## 2.5.0 - 23.12.2022
### Fixed
- UI no longer lags when switching between mobile and desktop mode
- Popovers no longer constrained by DOM hierarchy, shouldn't be cut off by anything
- Emoji autocomplete popover and picker popover stick to the text cursor.
- Attachments are ALWAYS in same order as user uploaded, no more "videos first"
- Pinned statuses no longer appear at bottom of user timeline (still appear as part of the timeline when fetched deep enough)
- Fixed many many bugs related to new mentions, including spacing and alignment issues
- Links in profile bios now properly open in new tabs
- "Always show mobile button" is working now
- Inline images now respect their intended width/height attributes
- Links with `&` in them work properly now
- Attachment description is prefilled with backend-provided default when uploading
- Proper visual feedback that next image is loading when browsing
- Additional HTML sanitization on frontend side in case backend sanitization fails
- Interaction list popovers now properly emojify names
- AdminFE button no longer scrolls page to top when clicked
- User handles with non-ascii domains now have less intrusive indicator for the domain name
- Completely hidden posts still no longer have 1px border
- A lot of accessibility improvements

### Changed
- Using Vue 3 now
- A lot of internal dependencies updated
- "(You)s" are optional (opt-in) now, bolding your nickname is also optional (opt-out)
- User highlight background now also covers the `@`
- Reverted back to textual `@`, svg version is opt-in.
- Settings window has been thoroughly rearranged to make more sense and make navigation settings easier.
- Uploaded attachments are uniform with displayed attachments
- Flash is watchable in media-modal (takes up nearly full screen though due to sizing issues)
- Notifications about likes/repeats/emoji reacts are now minimized so they always take up same amount of space irrelevant to size of post. (You can expand them to full if need be)
- Slight width/spacing adjustments
- More sizing stuff is font-size dependent now
- Scrollbars are styled/colorized now
- Scrollbars are toggleable (for stuff that didn't have visible scrollbars before) (opt-in)
- Updated localization files
- Top bar is more useful in mobile mode now.
- "Show new" button is way more compact in mobile mode
- Slightly adjusted placement and spacing of the topbar buttons so it's less easy to accidentally log yourself out

### Added
- 3 column mode: only enables when there's space for it (opt-out, customizable)
- Apologetic pleroma-tan
- New button on timeline header to change some of the new and often-used settings
- Support for lists
- Added ability to edit posts and view post edit history etc.
- Added ability to add personal note to users
- Added initial support for admin announcements
- Added ui for account migration
- Added ui for backups
- Added ability to force-unfollow a user from you
- Emoji are now grouped by pack
- Ability to pin navigation items and collapse the navigation menu
- Ability to rearrange order of attachments when uploading
- Ability to scroll column (or page) to top via panel header button
- Options to show domains in mentions
- Option to show user avatars in mention links (opt-in)
- Option to disable the tooltip for mentions
- Option to completely hide muted threads
- Option to customize what clicking user avatar does in user popover
- Notifications for poll results
- "Favorites" link in navigation
- Very early and somewhat experimental system for automatic settings sync (used only for pinned navigation and apologetic pleroma-tan)
- Implemented remote interaction with statuses for anon visitors
- Ability to open videos in modal even if you disabled that feature, via an icon button
- New button on attachment that indicates that attachment has a description and shows a bar filled with description
- Attachments are truncated just like post contents
- Media modal now also displays description and counter position in gallery (i.e. 1/5)
- Enabled users to zoom and pan images in media viewer with mouse and touch
- Timelines/panels and conversations have sticky headers now (a bit glitchy on some browsers like safari) (opt-out)


## [2.4.2] - 2022-01-09
### Added
- Added Apply and Reset buttons to the bottom of theme tab to minimize UI travel
- Implemented user option to always show floating New Post button (normally mobile-only)
- Display reasons for instance specific policies
- Added functionality to cancel follow request

### Fixed
- Fixed link to external profile not working on user profiles
- Fixed mobile shoutbox display
- Fixed favicon badge not working in Chrome
- Escape html more properly in subject/display name


## [2.4.0] - 2021-08-08
### Added
- Added a quick settings to timeline header for easier access
- Added option to mark posts as sensitive by default
- Added quick filters for notifications
- Implemented user option to change sidebar position to the right side
- Implemented user option to hide floating shout panel
- Implemented "edit profile" button if viewing own profile which opens profile settings

### Fixed
- Fixed follow request count showing in the wrong location in mobile view


## [2.3.0] - 2021-03-01
### Fixed
- Button to remove uploaded media in post status form is now properly placed and sized.
- Fixed shoutbox not working in mobile layout
- Fixed missing highlighted border in expanded conversations again
- Fixed some UI jumpiness when opening images particularly in chat view
- Fixed chat unread badge looking weird
- Fixed punycode names not working properly
- Fixed notifications crashing on an invalid notification

### Changed
- Display 'people voted' instead of 'votes' for multi-choice polls
- Changed the "Timelines" link in side panel to toggle show all timeline options inside the panel
- Renamed "Timeline" to "Home Timeline" to be more clear
- Optimized chat to not get horrible performance after keeping the same chat open for a long time
- When opening emoji picker or react picker, it automatically focuses the search field
- Language picker now uses native language names

### Added
- Added reason field for registration when approval is required
- Group staff members by role in the About page


## [2.2.3] - 2021-01-18
### Added
- Added Report button to status ellipsis menu for easier reporting

### Fixed
- Follows/Followers tabs on user profiles now display the content properly.
- Handle punycode in screen names
- Fixed local dev mode having non-functional websockets in some cases
- Show notices for websocket events (errors, abnormal closures, reconnections)
- Fix not being able to re-enable websocket until page refresh
- Fix annoying issue where timeline might have few posts when streaming is enabled

### Changed
- Don't filter own posts when they hit your wordfilter


## [2.2.2] - 2020-12-22
### Added
- Mouseover titles for emojis in reaction picker
- Support to input emoji into the search box in reaction picker
- Added some missing unicode emoji
- Added the upload limit to the Features panel in the About page
- Support for solid color wallpaper, instance doesn't have to define a wallpaper anymore

### Fixed
- Fixed the occasional bug where screen would scroll 1px when typing into a reply form
- Fixed timeline errors locking timelines
- Fixed missing highlighted border in expanded conversations
- Fixed custom emoji not working in profile field names
- Fixed pinned statuses not appearing in user profiles
- Fixed some elements not being keyboard navigation friendly
- Fixed error handling when updating various profile images
- Fixed your latest chat messages disappearing when closing chat view and opening it again during the same session
- Fixed custom emoji not showing in poll options before voting
- Fixed link color not applied to instance name in topbar

### Changed
- Errors when fetching are now shown with popup errors instead of "Error fetching updates" in panel headers
- Made reply/fav/repeat etc buttons easier to hit
- Adjusted timeline menu clickable area to match the visible button
- Moved external source link from status heading to the ellipsis menu
- Disabled horizontal textarea resize
- Wallpaper is now top-aligned, horizontally centered.


## [2.2.1] - 2020-11-11
### Fixed
- Fixed regression in react popup alignment and overflowing


## [2.2.0] - 2020-11-06
### Added
- New option to optimize timeline rendering to make the site more responsive (enabled by default)
- New instance option `logoLeft` to move logo to the left side in desktop nav bar
- Import/export a muted users
- Proper handling of deletes when using websocket streaming
- Added optimistic chat message sending, so you can start writing next message before the previous one has been sent
- Added a small red badge to the favicon when there's unread notifications
- Added the NSFW alert to link previews

### Fixed
- Fixed clicking NSFW hider through status popover
- Fixed chat-view back button being hard to click
- Fixed fresh chat notifications being cleared immediately while leaving the chat view and not having time to actually see the messages
- Fixed multiple regressions in CSS styles
- Fixed multiple issues with input fields when using CJK font as default
- Fixed search field in navbar infringing into logo in some cases
- Fixed not being able to load the chat history in vertical screens when the message list doesn't take the full height of the scrollable container on the first fetch.

### Changed
- Clicking immediately when timeline shifts is now blocked to prevent misclicks
- Icons changed from fontello (FontAwesome 4 + others) to FontAwesome 5 due to problems with fontello.
- Some icons changed for better accessibility (lock, globe)
- Logo is now clickable
- Changed default logo to SVG version


## [2.1.2] - 2020-09-17
### Fixed
- Fixed chats list not updating its order when new messages come in
- Fixed chat messages sometimes getting lost when you receive a message at the same time


## [2.1.1] - 2020-09-08
### Changed
- Polls will be hidden with status content if "Collapse posts with subjects" is enabled and the post is collapsed.

### Fixed
- Network fetches don't pile up anymore but wait for previous ones to finish to reduce throttling.
- Autocomplete won't stop at the second @, so it'll still work with "@lain@l" and not start over.
- Fixed weird autocomplete behavior when you write ":custom_emoji: ?"


## [2.1.0] - 2020-08-28
### Added
- Autocomplete domains from list of known instances
- 'Bot' settings option and badge
- Added profile meta data fields that can be set in profile settings
- Added option to reset avatar/banner in profile settings
- Descriptions can be set on uploaded files before posting
- Added status preview option to preview your statuses before posting
- When a post is a reply to an unavailable post, the 'Reply to'-text has a strike-through style
- Added ability to see all favoriting or repeating users when hovering the number on highlighted statuses
- Bookmarks

### Changed
- Change heart to thumbs up in reaction picker
- Close the media modal on navigation events
- Add colons to the emoji alt text, to make them copyable
- Add better visual indication for drag-and-drop for files
- When disabling attachments, the placeholder links now show an icon and the description instead of just IMAGE or VIDEO etc
- Remove unnecessary options for 'automatic loading when loading older' and 'reply previews'
- Greentext now has separate color slot for it
- Removed the use of with_move parameters when fetching notifications
- Push notifications now are the same as normal notfication, and are localized.
- Updated Notification Settings to match new BE API

### Fixed
- Custom Emoji will display in poll options now.
- Status ellipsis menu closes properly when selecting certain options
- Cropped images look correct in Chrome
- Newlines in the muted words settings work again
- Clicking on non-latin hashtags won't open a new window
- Uploading and drag-dropping multiple files works correctly now.
- Subject field now appears disabled when posting
- Fix status ellipsis menu being cut off in notifications column
- Fixed autocomplete sometimes not returning the right user when there's already some results
- Videos and audio and misc files show description as alt/title properly now
- Clicking on non-image/video files no longer opens an empty modal
- Audio files can now be played back in the frontend with hidden attachments
- Videos are not cropped awkwardly in the uploads section anymore
- Reply filtering options in Settings -> Filtering now work again using filtering on server
- Don't show just blank-screen when cookies are disabled
- Add status idempotency to prevent accidental double posting when posting returns an error
- Weird bug related to post being sent seemingly after pasting with keyboard (hopefully)
- Multiple issues with muted statuses/notifications

## [2.0.5] - 2020-05-12
### Added
- Added private notifications option for push notifications
- 'Copy link' button for statuses (in the ellipsis menu)

### Changed
- Registration page no longer requires email if the server is configured not to require it

### Fixed
- Status ellipsis menu closes properly when selecting certain options

## [2.0.3] - 2020-05-02
### Fixed
- Show more/less works correctly with auto-collapsed subjects and long posts
- RTL characters won't look messed up in notifications

### Changed
- Emoji autocomplete will match any part of the word and not just start, for example :drool will now helpfully suggest :blobcatdrool: and :blobcatdroolreach:

### Added
- Follow request notification support

## [2.0.2] - 2020-04-08
### Fixed
- Favorite/Repeat avatars not showing up on private instances/non-public posts
- Autocorrect getting triggered in the captcha field
- Overflow on long domains in follow/move notifications

### Changed
- Polish translation updated

## [2.0.0] - 2020-02-28
### Added
- Tons of color slots including ones for hover/pressed/toggled buttons
- Experimental `--variable[,mod]` syntax support for color slots in themes. the `mod` makes color brighter/darker depending on background color (makes darker color brighter/darker depending on background color)
- Paper theme by Shpuld
- Icons in nav panel
- Private mode support
- Support for 'Move' type notifications
- Pleroma AMOLED dark theme
- User level domain mutes, under User Settings -> Mutes
- Emoji reactions for statuses
- MRF keyword policy disclosure
### Changed
- Updated Pleroma default themes
- theme engine update to 3 (themes v2.1 introduction)
- massive internal changes in theme engine - slowly away from "generate things separately with spaghetti code" towards "feed all data into single 'generateTheme' function and declare slot inheritance and all in a separate file"
- Breezy theme updates to make it closer to actual Breeze in some aspects
- when using `--variable` in shadows it no longer uses the actual CSS3 variable, instead it generates color from other slots
- theme doesn't get saved to local storage when opening FE anonymously
- Captcha now resets on failed registrations
- Notifications column now cleans itself up to optimize performance when tab is left open for a long time
- 403 messaging
### Fixed
- Fixed loader-spinner not disappearing when a status preview fails to load
- anon viewers won't get theme data saved to local storage, so admin changing default theme will have an effect for users coming back to instance.
- Single notifications left unread when hitting read on another device/tab
- Registration fixed
- Deactivation of remote accounts from frontend
- Fixed NSFW unhiding not working with videos when using one-click unhiding/displaying
- Improved performance of anything that uses popovers (most notably statuses)

## [1.1.7 and earlier] - 2019-12-14
### Added
- Ability to hide/show repeats from user
- User profile button clutter organized into a menu
- Emoji picker
- Started changelog anew
- Ability to change user's email
- About page
- Added remote user redirect

### Changed
- changed the way fading effects for user profile/long statuses works, now uses css-mask instead of gradient background hacks which weren't exactly compatible with semi-transparent themes

### Fixed
- improved hotkey behavior on autocomplete popup
