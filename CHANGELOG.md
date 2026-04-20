# Changelog

All notable changes to Prayer Odyssey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.1.1] - 2026-04-20

### Changed
- The app now remembers your list/card view preference when you return to your prayers or a group

---

## [4.1.0] - 2026-04-17

### Added
- Light/dark mode toggle with sun/moon icon in the navbar
- System preference detection (`prefers-color-scheme`) on first load
- Persistent theme selection saved to `localStorage`
- FOUC (flash of unstyled content) prevention via inline script in `<head>`
- `ThemeToggle` component (`src/lib/components/ThemeToggle.svelte`)
- `theme` store (`src/lib/stores/theme.ts`) for reactive theme management
- Indigo background badge around navbar logo for improved visibility in light mode
- Profile avatar `onerror` fallback to ui-avatars when Google photo URL fails

### Changed
- App background updated to `slate-100` in light mode for better card contrast
- Prayer cards now use solid `bg-white` with `border-slate-200 shadow-sm` in light mode
- Group list cards hover state updated — no longer turns dark in light mode
- Filter tab and view toggle buttons use `hover:bg-slate-200` instead of `hover:bg-white/10` in light mode
- All modal panels updated to use light backgrounds (`bg-white`) in light mode
- Dark gradient decorations on modals scoped to `dark:` only
- Profile avatar button padding made responsive (`sm:pr-3`) so it renders as a circle on mobile
- About page version badge and changelog entry updated to reflect 4.1.0

### Fixed
- `AddUpdateModal` panel was hardcoded to `bg-slate-900` with no light-mode default
- `EditPrayerModal` and `CreateGroupModal` dark gradient was applied unconditionally
- `PrayerUpdates` modal had entirely hardcoded dark text and background colors
- All `hover:bg-white/10` instances on toggle buttons were invisible in light mode
- `AddUpdateModal` missing `role="dialog"`, `aria-modal`, `tabindex`, and close button `aria-label`
- `EditPrayerModal` `autofocus` a11y warning removed
- `CreateGroupModal` `autofocus` a11y warning removed
- `AddPrayerModal` section label changed from `<label>` to `<p>` (no associated control)
- Unused `getFirestore` import removed from `firebase.ts`
- `EditPrayerModal` Svelte 5 `state_referenced_locally` warnings resolved

---

## [4.0.20] - 2026-02-13

### Added
- Latest prayer update preview displayed in carousel/card view

### Changed
- Improved carousel layout to better fit viewport
- Enhanced carousel navigation spacing

---

## [4.0.10] - 2026-02-12

### Added
- Group prayer sharing functionality
- Group member management UI

### Changed
- Enhanced group navigation and filtering

---

## [4.0.0] - 2026-02-10

### Added
- Initial launch of Prayer Odyssey PWA
- Prayer tracking and creation system
- Prayer status management (Active / Answered)
- Real-time push notifications
- Responsive mobile navigation with bottom nav bar
- Google authentication
- Prayer group creation and management
- Prayer sharing across groups
- Progressive Web App (PWA) support with offline caching
