# Prayer Odyssey — Flutter Web PWA Rebuild Spec

**Status:** Draft v2 (decisions from review applied; palette choice pending)
**Date:** 2026-10-04
**Replaces:** `prayer-odyssey-pwa` (SvelteKit 2 / Svelte 5 / Tailwind, v4.3.2)
**Target:** New repository, Flutter web, installable PWA. Android and iOS are out of scope for now.

---

## 0. Summary

Rebuild Prayer Odyssey in Flutter as a web-only PWA in a new repository. Keep every feature the app has today and redesign the UI on Material 3, with a warmer and more contemplative color scheme and a layout that works on phones first and on desktop too.

The **Firebase backend stays the same**: same project (`prayer-odyssey-96025`), same Firestore data, same Auth users, same Cloud Functions and FCM. The new app is a different client for the data that already exists. Nobody needs to migrate data or create a new account, and the switch is a hosting deploy.

This follows the setup that has worked for **omtb**: Flutter stable, `firebase_core` + `firebase_messaging`, a hand-written `sw.js` + `firebase-messaging-sw.js`, Firebase Hosting deployed from GitHub Actions on the `release` branch, and config passed in with `--dart-define`.

### Goals

1. Full feature parity with v4.3.2 (checklist in §2).
2. A UI that feels calm, consistent and native-app-like on phones and desktop.
3. A clean, testable architecture: typed models, repositories, and reactive state.
4. Reliable web push notifications and offline viewing of data already loaded.
5. A cutover with no downtime and no data migration.

### Non-goals (for this rebuild)

- Native Android/iOS builds. The code should stay platform-clean so they can be added later, but nothing should be built specifically for them.
- Moving off Firebase. Supabase, Drift/SQLite and similar are not needed. Firestore's offline cache already covers local persistence.
- New major features. A short list of optional enhancements is in §16. Ship parity first.

---

## 1. Decisions at a glance

| Area | Decision | Notes |
|---|---|---|
| Framework | Flutter (stable channel), Dart 3.x | Web target only. Use `flutter create --platforms=web`. |
| Renderer | CanvasKit (default `flutter build web`) | Try `--wasm` (skwasm) later, once all plugins are confirmed wasm-compatible. |
| Backend | Existing Firebase project and live data | Decided. Auth, Firestore, Functions (2nd gen, Node 22), FCM, Hosting. |
| Firebase SDK | FlutterFire: `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_messaging`, `firebase_analytics` (optional) | |
| State management | **Riverpod 3** (`flutter_riverpod`) | Decided. omtb uses Provider; Riverpod fits this app's many Firestore streams that depend on auth and parameters (see §5). |
| Routing | **go_router** with path URL strategy | Required so existing URLs keep working: `/prayers/:id`, `/groups/:id`, invite links, QR codes, push links. |
| Models | `freezed` + `json_serializable` (or hand-written `fromFirestore`) | Custom `Timestamp` converters. |
| Design | Material 3, custom palette (§7); Dawn Voyage recommended, choice pending the mockups | Light + dark + follow-system. |
| Fonts | Bundled: **Lora** (headings) + **Inter** (body/UI) | Bundled as assets, not fetched at runtime, so they work offline. |
| Icons | `material_symbols_icons` (Rounded) | No emoji in the UI (see §15). |
| QR codes | `qr_flutter` with embedded logo | Same as omtb. |
| Sharing | `share_plus` (Web Share API, falls back to clipboard) | |
| Export | `archive`, `csv`, `pdf` + `printing`; keep **both** Word and PDF | Decided (§11). |
| Service workers | `sw.js` (precache via Workbox CLI, post-build) + `firebase-messaging-sw.js` (push) | §10 |
| Config | `--dart-define-from-file=env/<env>.json` | Firebase web config is also injected into the SW at build time. No hardcoded credentials (keeps the 4.3.2 security fix). |
| Hosting/CI | Firebase Hosting; PR preview channels (no separate beta site); deploy `live` on push to `release` | Decided. Same pattern as both current repos. |
| Version | Start at **5.0.0** | Continues the product's version history and CHANGELOG. |

---

## 2. Current app inventory (parity checklist)

All of the following must work in the Flutter app before cutover.

### 2.1 Auth
- [ ] Email/password sign-in
- [ ] Email/password sign-up with display name (`updateProfile`)
- [ ] Google sign-in (popup)
- [ ] Friendly error messages for auth error codes (invalid email, disabled, not found, wrong password, email in use, weak password)
- [ ] Sign out
- [ ] On every auth state change, merge-write `users/{uid}`: `displayName`, `photoURL`, `email`, `lastLogin: serverTimestamp()`
- [ ] Logged-out landing page (hero, "Get started", "Learn more", three feature tiles: Track Prayers / Groups / Notifications)
- [ ] Logged-in users visiting `/` or `/login` are redirected to `/prayers`

### 2.2 My Prayers (`/prayers`)
- [ ] Lists only the current user's own prayers, newest first
- [ ] Filter: Active (default) / Answered / All
- [ ] View mode: List (grid of cards) / Carousel, saved in local storage across sessions (key `prayerViewMode`)
- [ ] Loading skeletons; empty state with a CTA; "No {filter} prayers found" state
- [ ] "+ New Prayer" opens the add form

### 2.3 Prayer card
- [ ] Optional owner avatar and name
- [ ] Summary (title) and description (clamped in list view, full in carousel)
- [ ] Legacy fallback: older docs have `content` and no `summary`
- [ ] Optional "Latest update" preview (carousel)
- [ ] Owner only: chips for the groups the prayer is shared with
- [ ] Owner only: toggle Answered/Active; Share with groups (hidden when answered)
- [ ] Created date; "N Update(s)" count; status badge
- [ ] Non-owner: "🙏 N" pray button (increments `prayedCount`, adds the user to `prayedBy`, notifies the owner); 1-second debounce; shows "already prayed" styling
- [ ] Owner: read-only prayed count when > 0
- [ ] Tapping the card opens `/prayers/:id`

### 2.4 Carousel view
- [ ] One prayer at a time with an "X of Y" counter
- [ ] Prev/next buttons, left/right arrow keys, swipe gestures
- [ ] Dot indicators (on touch devices with more than 5 prayers, a compact "n / N" instead)
- [ ] Clamps the index when the list shrinks

### 2.5 Prayer detail (`/prayers/:id`)
- [ ] Live subscription to the prayer document; "not found" and error states
- [ ] Non-owner: "{Owner} shared this prayer" header with avatar
- [ ] Summary, full description, "Shared with" chips (owner)
- [ ] Owner actions: toggle status, share with groups, edit, delete (with confirmation, then navigate home)
- [ ] Created date and status badge
- [ ] Updates section: list newest first; owner can add ("+ Add Update"); the author can edit inline or delete (with confirmation); "(edited)" marker; timestamps

### 2.6 Add/Edit prayer
- [ ] Summary (required, max 100 characters), description (optional, multiline)
- [ ] Add: pick groups to share with (multi-select), pre-filled when opened from a group page
- [ ] Inline error message on failure

### 2.7 Share prayer with groups
- [ ] Multi-select of the user's groups, pre-selected from `sharedWith`
- [ ] Empty state: "You are not a member of any groups yet" plus a link to Groups
- [ ] Only **newly added** groups receive a `prayer_shared` notification

### 2.8 Groups (`/groups`)
- [ ] List of groups the user belongs to (`members array-contains uid`): name, description, member count, created date
- [ ] Create group (name required, description optional). The creator becomes admin and member, and the group id is added to `users/{uid}.groups`
- [ ] Loading skeletons and empty state

### 2.9 Group detail (`/groups/:id`)
- [ ] Live group doc; "Group not found" state
- [ ] Header: name, member count, "Member" badge, description
- [ ] Invite menu: copy link; show a QR code (logo overlay, error level H) in a dialog
- [ ] Non-member who is signed in: "Join Group" (adds the user to `members` and the group to `users/{uid}.groups`)
- [ ] Members: the group's prayers (`sharedWith array-contains groupId`, newest first), with the Active/Answered/All filter and the list/carousel toggle
- [ ] "+ New Prayer" with this group pre-selected

### 2.10 Notifications (in-app)
- [ ] Live inbox (`receiverId == uid`, newest first), unread badge (shown as 9+ above 9)
- [ ] Item types: `prayer_reaction`, `prayer_update`, `prayer_answered`, `prayer_shared`, `group_invite`, with icon and copy per type (Appendix B)
- [ ] Tap: mark as read, then navigate to `/prayers/:prayerId`
- [ ] Delete one; "Clear all" (batched in chunks of 499)
- [ ] "All caught up!" empty state

### 2.11 Push notifications (FCM web)
- [ ] Request permission, get a token with the VAPID key, store it on `users/{uid}`: `fcmTokens[]` (max 10, newest kept) and `fcmTokenInfo[token] = {isPWA, timestamp, createdAt, lastUsed}`
- [ ] Remove tokens older than 30 days whenever a new token is requested
- [ ] Disable: remove this device's token from the profile and call `deleteToken`
- [ ] "Clear all devices": empty `fcmTokens` and `fcmTokenInfo`
- [ ] Foreground message: show a notification that opens `data.url` when tapped
- [ ] Background message: the service worker shows the notification

### 2.12 Profile (`/profile`)
- [ ] Avatar, name, email
- [ ] Push notification state: Enable / Disable / "Denied" badge
- [ ] Advanced (collapsible): Export my data; Clear all devices
- [ ] Sign out

### 2.13 Export
- [ ] Formats: JSON, CSV (ZIP: prayers, updates, summary), Markdown, Word (.docx), Print/Save as PDF
- [ ] Optional start/end date filter on `createdAt`, validated (start ≤ end)
- [ ] Includes the owner's prayers with their updates, prayed counts, and a summary block (totals, date range, exported-at time, app version)

### 2.14 About (`/about`)
- [ ] Dillie-O Digital logo, "Created by Dillie-O Digital", version badge
- [ ] Website card (prayerodyssey.com) plus a "Share App" QR for `https://app.prayerodyssey.com`
- [ ] Discord card (`https://discord.gg/7wfWS6sXXr`)
- [ ] "Recent Updates" release notes (currently hardcoded)

### 2.15 Theme and app
- [ ] Light/dark toggle, defaulting to the system preference and saved across sessions
- [ ] Installable PWA: manifest, icons (192/512, any + maskable), screenshots (wide/narrow)
- [ ] Offline caching of the app shell; Firestore offline persistence (multi-tab)

---

## 3. Architecture

### 3.1 Layers

```
UI (screens, widgets)
   │ watches
   ▼
Riverpod providers (state, derived data, controllers)
   │ call
   ▼
Repositories (Firestore/Auth/FCM access, the only place that imports Firebase)
   │
   ▼
FlutterFire SDKs  ──►  Firebase (Auth, Firestore, FCM)  ◄── Cloud Functions
```

Rules:
- Widgets never import `cloud_firestore` or `firebase_auth` directly. They go through providers and repositories.
- Repositories return typed models and `Stream<T>`s. Write methods are `Future<void>` and throw typed `AppException`s.
- Anything that only works in a browser (download blob, `matchMedia`, `navigator.clipboard` fallbacks, `Notification.permission`) lives in `lib/core/platform/web_*.dart` and uses `package:web` + `dart:js_interop`. Do **not** use the deprecated `dart:html`.

### 3.2 Project structure

```
prayer_odyssey/
├── lib/
│   ├── main.dart                      # bootstrap: Firebase init, URL strategy, ProviderScope
│   ├── app/
│   │   ├── app.dart                   # MaterialApp.router, theme wiring
│   │   ├── router.dart                # go_router config + auth redirects
│   │   ├── shell.dart                 # responsive nav shell (bar / rail)
│   │   └── theme/
│   │       ├── tokens.dart            # color, spacing, radius, motion constants
│   │       ├── color_schemes.dart     # light/dark ColorScheme
│   │       ├── app_theme.dart         # ThemeData builders + component themes
│   │       └── status_colors.dart     # ThemeExtension: active/answered/pray colors
│   ├── core/
│   │   ├── firebase/firebase_options.dart   # from --dart-define
│   │   ├── platform/                  # web_download.dart, web_display_mode.dart, ...
│   │   ├── errors/app_exception.dart
│   │   ├── prefs/prefs.dart           # shared_preferences wrapper
│   │   └── utils/                     # date formatting, validators
│   ├── features/
│   │   ├── auth/       {data, application, presentation}
│   │   ├── prayers/    {data, domain, application, presentation}
│   │   ├── updates/    {data, domain, presentation}
│   │   ├── groups/     {data, domain, application, presentation}
│   │   ├── activity/   {data, domain, presentation}      # in-app notifications
│   │   ├── push/       {data, application}                # FCM token lifecycle
│   │   ├── profile/    {presentation}
│   │   ├── export/     {application, formatters/}
│   │   └── about/      {presentation}
│   └── shared/widgets/                # AppCard, StatusBadge, PrayButton, EmptyState, ...
├── web/
│   ├── index.html                     # splash, SW registration
│   ├── manifest.json
│   ├── icons/, splash/, screenshots/
│   ├── sw-src.js                      # Workbox injectManifest source
│   └── firebase-messaging-sw.template.js
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── functions/                     # moved from old repo
├── assets/
│   ├── fonts/  (Lora, Inter)
│   ├── images/ (logo, dillieo logo)
│   └── release_notes.json
├── env/
│   ├── example.json                   # committed
│   └── prod.json, dev.json            # git-ignored
├── tool/
│   ├── build_web.sh                   # flutter build + SW generation + workbox
│   └── gen_messaging_sw.dart          # fills the SW template from env JSON
├── test/
├── firebase.json, .firebaserc
├── CLAUDE.md                          # agent/contributor rules (see §17)
└── CHANGELOG.md
```

### 3.3 Packages (use the latest stable at project start)

| Package | Purpose |
|---|---|
| `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_messaging`, `firebase_analytics` | Backend |
| `flutter_riverpod` (+ optionally `riverpod_generator`, `riverpod_annotation`) | State |
| `go_router` | Routing |
| `flutter_web_plugins` (SDK) | `usePathUrlStrategy()` |
| `freezed`, `freezed_annotation`, `json_serializable`, `json_annotation`, `build_runner` | Models |
| `shared_preferences` | Theme mode, view mode, dismissed hints |
| `package_info_plus` | App version (About, export metadata, update check) |
| `qr_flutter` | QR codes |
| `share_plus` | Web Share API |
| `url_launcher` | External links |
| `intl` | Date formatting |
| `material_symbols_icons` | Icon set |
| `archive`, `csv` | CSV ZIP and DOCX packaging |
| `pdf`, `printing` | Print / Save as PDF |
| `web` | Browser APIs through JS interop |
| Dev: `flutter_lints` (or `very_good_analysis`), `mocktail`, `fake_cloud_firestore`, `firebase_auth_mocks` | Testing |

---

## 4. Backend (Firebase), reused

### 4.1 Data model (unchanged contract)

The Flutter models must read and write **exactly** these shapes, because the old app and the Cloud Functions depend on them during the transition.

**`users/{uid}`**
```
displayName: string
photoURL: string | null
email: string
lastLogin: Timestamp
groups: string[]                    // groupIds; used by security rules
fcmTokens: string[]                 // ≤10
fcmTokenInfo: map<token, {isPWA: bool, timestamp: ISO string, createdAt: Timestamp, lastUsed: Timestamp}>
lastTokenSync: Timestamp
lastTokenCleanup: Timestamp
```

**`prayers/{prayerId}`**
```
summary: string (≤100)              // legacy docs may have `content` instead
description?: string
ownerId: string
status: 'active' | 'answered' | 'archived'
createdAt: Timestamp
updatedAt?: Timestamp
sharedWith: string[]                // groupIds
prayedCount?: number
prayedBy?: string[]
// NEW (written only by Cloud Functions, see §4.4):
updatesCount?: number
latestUpdate?: { content: string, createdAt: Timestamp }
```

**`prayers/{prayerId}/updates/{updateId}`**
```
prayerId: string
content: string
authorId: string
createdAt: Timestamp
updatedAt?: Timestamp
```

**`groups/{groupId}`**
```
name: string
description?: string
admins: string[]
members: string[]
createdAt: Timestamp
```

**`notifications/{notificationId}`**
```
receiverId, senderId, senderName: string
type: 'prayer_reaction' | 'prayer_update' | 'prayer_answered' | 'prayer_shared' | 'group_invite'
prayerId?, prayerSummary?, groupId?, groupName?: string
read: bool
createdAt: Timestamp
```

Model notes:
- `Prayer.fromFirestore` maps a missing `summary` to the legacy `content`. A missing `sharedWith` becomes `[]`, and missing counts become `0`.
- Unknown `type` or `status` values become an `unknown` enum case and must never crash.
- While a write is pending, `serverTimestamp()` fields read back as `null`. Show "Just now" in that case, the same as the current app.

### 4.2 Queries and indexes

| Provider | Query | Index |
|---|---|---|
| `myPrayersProvider` | `prayers where ownerId == uid orderBy createdAt desc` | exists |
| `groupPrayersProvider(groupId)` | `prayers where sharedWith array-contains groupId orderBy createdAt desc` | exists |
| `myGroupsProvider` | `groups where members array-contains uid` | single-field (auto) |
| `activityProvider` | `notifications where receiverId == uid orderBy createdAt desc` | exists |
| `prayerUpdatesProvider(prayerId)` | `prayers/{id}/updates orderBy createdAt desc` | auto |

**Change from today:** the current app runs one `or(ownerId == uid, sharedWith array-contains-any myGroupIds)` query and then filters to owned prayers on `/prayers`. That downloads every shared prayer for nothing, and `array-contains-any` is capped at 30 values. The rebuild uses the separate queries above. If the optional "Praying for others" feed (§16) is built, it should use per-group queries merged on the client.

Move `firestore.indexes.json` into the new repo unchanged.

### 4.3 Security rules

Move `firestore.rules` as-is for parity. The client must stay within what the rules allow today:
- Shared (non-owner) prayer updates may only touch `prayedCount`, `prayedBy`, `updatedAt`.
- Group updates by non-admins may only touch `members`, and the user must be in the new `members` list. That means joining works, but **leaving a group is not allowed by the current rules** (see §16).
- Only the prayer owner may create updates.
- A notification can only be created with `senderId == auth.uid`, all required fields set, and `read == false`.

Recommended rule hardening (separate PR, can ship before or after cutover):
1. **Privacy:** `users/{uid}` can be read by any signed-in user, which exposes `email` and `fcmTokens`. Split it into `users/{uid}` (public: `displayName`, `photoURL`) and `users/{uid}/private/account` (email, groups, tokens), and update the rules and functions to match. This is a data migration, so do it **after** cutover, when only one client is live. Ship it with a backfill script.
2. Validate prayer creates: `status == 'active'`, `summary` is a string of 1–100 characters, `sharedWith` is a list ⊆ the user's groups.
3. Pray action: require `prayedCount == resource.data.prayedCount + 1`.
4. Allow a member to remove themselves from `members` (leave group).

### 4.4 Cloud Functions (move into `firebase/functions/`)

Existing functions (keep):
- `sendPushNotification`: `notifications/{id}` created → FCM multicast to the receiver's tokens.
- `onPrayerCreated`: fan out `prayer_shared` to the members of the shared groups.
- `onPrayerUpdateCreated`: fan out `prayer_update` to the members of the shared groups, excluding the author.

Changes (bundle with the cutover release):
1. **`sendPushNotification`**
   - Add `webpush.fcmOptions.link` with an absolute URL (`https://app.prayerodyssey.com/prayers/{id}`, or `/groups/{id}` for group-only types). The FCM SW then handles clicks without custom code.
   - Add `webpush.notification.icon` and `badge`, and a `tag` per prayer so repeated notifications collapse.
   - **Prune dead tokens**: for responses with `messaging/registration-token-not-registered` or `invalid-argument`, `arrayRemove` the token and delete its `fcmTokenInfo` entry.
   - Respect per-user preferences if added (§16).
2. **New `onPrayerStatusChanged`** (`onDocumentUpdated('prayers/{id}')`): when `status` changes to `answered`, fan out `prayer_answered` to group members, excluding the owner. This replaces the client-side `notifyGroupMembersPrayerAnswered`. The Flutter client must **not** send `prayer_answered` itself.
3. **New `onPrayerUpdateWritten`** (`onDocumentWritten('prayers/{p}/updates/{u}')`): keep `updatesCount` and `latestUpdate` on the parent prayer up to date. Cards then show "N Updates" and the latest-update preview without one updates listener per card. Include a one-off backfill script (`firebase/functions/scripts/backfill_update_counts.js`).
4. **New `onPrayerDeleted`**: `recursiveDelete` the `updates` subcollection. Today these are left orphaned.

Which notifications the client still sends: only `prayer_reaction`, written straight to `notifications` (allowed by the rules). `prayer_shared` for prayers **edited** to add groups stays client-side as today (only newly added groups). Alternatively, move it into `onPrayerUpdated` by diffing `sharedWith`. Recommended: move it, so all group fan-out happens on the server.

> **Transition caveat:** while the old Svelte client is still live, it sends `prayer_answered` from the client. If `onPrayerStatusChanged` is deployed while the old client is in use, group members get duplicates. Deploy change 2 at the same time as the cutover (§14).

---

## 5. State management (Riverpod)

### 5.1 Core providers

Illustrative only. Check the exact Riverpod 3 API names at implementation time; for example, `StateProvider` now lives in `legacy.dart`, so prefer `Notifier`.

```dart
// Auth
final firebaseAuthProvider        = Provider((_) => FirebaseAuth.instance);
final authStateProvider           = StreamProvider<User?>((ref) => ref.watch(firebaseAuthProvider).authStateChanges());
final currentUidProvider          = Provider<String?>((ref) => ref.watch(authStateProvider).value?.uid);

// Repos
final prayerRepositoryProvider    = Provider((ref) => PrayerRepository(FirebaseFirestore.instance));
final groupRepositoryProvider     = Provider(...);
final activityRepositoryProvider  = Provider(...);
final pushRepositoryProvider      = Provider(...);

// Streams (autoDispose + family where parameterized)
final myPrayersProvider           = StreamProvider.autoDispose<List<Prayer>>(...);    // depends on uid
final prayerProvider              = StreamProvider.autoDispose.family<Prayer?, String>(...);
final prayerUpdatesProvider       = StreamProvider.autoDispose.family<List<PrayerUpdate>, String>(...);
final myGroupsProvider            = StreamProvider.autoDispose<List<Group>>(...);
final groupProvider               = StreamProvider.autoDispose.family<Group?, String>(...);
final groupPrayersProvider        = StreamProvider.autoDispose.family<List<Prayer>, String>(...);
final userProfileProvider         = StreamProvider.autoDispose.family<UserProfile?, String>(...); // cached by family key
final activityProvider            = StreamProvider.autoDispose<List<AppNotification>>(...);
final unreadCountProvider         = Provider<int>((ref) => ...);

// UI prefs
final themeModeProvider           = NotifierProvider<ThemeModeNotifier, ThemeMode>(...);   // system/light/dark
final prayerViewModeProvider      = NotifierProvider<ViewModeNotifier, PrayerViewMode>(...); // list/carousel
final prayerFilterProvider        = NotifierProvider.family<PrayerFilterNotifier, PrayerFilter, String>(...); // per screen key

// Derived
final filteredPrayersProvider     = Provider.family<AsyncValue<List<Prayer>>, PrayerListSource>(...);
```

Rules:
- Every stream that depends on the user `ref.watch`es `currentUidProvider`, so signing out tears all listeners down. This replaces the store-subscription and `queueMicrotask` debouncing in the Svelte app.
- Mutations go through `AsyncNotifier` controllers (`PrayerActionsController`, `GroupActionsController`, …) that expose loading and error state to buttons, and send failures to a global SnackBar via a `ScaffoldMessengerKey`.
- `userProfileProvider` should use `ref.keepAlive()` with a timeout so avatars don't re-subscribe on every scroll.

### 5.2 Write operations (repository API)

```dart
// PrayerRepository
Future<String> addPrayer({required String summary, String? description, List<String> sharedWith});
Future<void> updatePrayer(String id, {required String summary, String? description}); // empty description → FieldValue.delete()
Future<void> setStatus(String id, PrayerStatus status);    // also sets updatedAt (today markActive forgets to)
Future<void> updateSharing(String id, List<String> groupIds); // returns newly added ids if client-side notify is kept
Future<void> deletePrayer(String id);
Future<void> prayFor(Prayer p);                             // increment(1), arrayUnion(uid), updatedAt; then notify owner if not owner
// Updates
Future<void> addUpdate(String prayerId, String content);
Future<void> editUpdate(String prayerId, String updateId, String content);
Future<void> deleteUpdate(String prayerId, String updateId);

// GroupRepository
Future<String> createGroup(String name, {String description = ''}); // + users/{uid}.groups arrayUnion (set-merge if missing)
Future<void> joinGroup(String groupId);                            // members arrayUnion + users/{uid}.groups arrayUnion

// ActivityRepository
Future<void> markRead(String id);
Future<void> delete(String id);
Future<void> clearAll();                                           // batches of 499
Future<void> sendReaction(Prayer p);                               // prayer_reaction

// PushRepository
Future<PushState> enable();      // permission → cleanup stale → getToken(vapidKey) → save (cap 10)
Future<void> disable();          // remove token from profile, deleteToken
Future<void> clearAllDevices();
Stream<RemoteMessage> foregroundMessages();
```

Fixes compared with today, covered by tests:
- `updatePrayer` can now **clear** a description. Today it only writes the field when it isn't empty.
- `markActive` sets `updatedAt`.
- `createGroup` and `joinGroup` use `set(..., SetOptions(merge: true))` with `arrayUnion` instead of the update-then-catch-`not-found` pattern.

---

## 6. Routing

`usePathUrlStrategy()` in `main.dart`, so URLs have no `#`. Firebase Hosting keeps rewriting `**` → `/index.html`.

| Path | Screen | Auth | Shell tab |
|---|---|---|---|
| `/` | Redirect to `/prayers` if signed in, else `/welcome` | – | – |
| `/welcome` | Landing (logged out) | public | – |
| `/login` | Sign in / sign up | public only | – |
| `/prayers` | My Prayers | required | Prayers |
| `/prayers/:id` | Prayer detail | required | Prayers |
| `/groups` | Groups list | required | Groups |
| `/groups/:id` | Group detail / join | required* | Groups |
| `/activity` | Activity (notifications) | required | Activity |
| `/profile` | Profile & settings | required | Profile |
| `/profile/export` | Export | required | Profile |
| `/about` | About | public | Profile (when signed in) |

Redirect logic (`GoRouter.redirect` + `refreshListenable` bound to the auth stream):
- While auth is unresolved, show a splash route. This avoids the flicker the current app hides with a global spinner.
- Unauthenticated visits to a protected route go to `/login?from=<encoded original path>`. After signing in, return to `from`. *This matters for invite links:* today a logged-out user who opens `/groups/abc` sees no way to join.
- Authenticated visits to `/login` or `/welcome` go to `from` or `/prayers`.

Shell: `StatefulShellRoute.indexedStack` with four branches (Prayers, Groups, Activity, Profile), so each tab keeps its own navigation stack and scroll position.

Deep links that must keep working: `/prayers/{id}` (push `data.url` and the new `fcmOptions.link`), `/groups/{id}` (existing invite links and printed QR codes), `/login`, `/about`, `/profile`.

PWA manifest shortcuts (like omtb): "New prayer" → `/prayers?new=1`, "Pray now" → `/prayers?view=carousel`.

---

## 7. Design system

### 7.1 Direction

The current UI is generic dark slate with indigo accents and glassmorphism. The rebuild should feel like a **quiet journal at dawn**: warm paper-like surfaces, deep harbor blue for structure, a candle-amber accent for the moment of prayer, and soft sage for answered prayers. It uses calm motion, generous spacing, and serif headings for warmth.

### 7.2 Palette: "Dawn Voyage" (proposed)

All text/background pairs below were checked against WCAG: every one is ≥ 4.5:1 (AA), and most are ≥ 7:1.

**Light**

| Role | Hex | Use |
|---|---|---|
| primary | `#24456B` | Harbor blue: app bar accents, primary buttons, links, selected nav |
| onPrimary | `#FFFFFF` | 9.8:1 |
| primaryContainer | `#D6E3F3` | Selected chips, active filter segment |
| onPrimaryContainer | `#0E2440` | 12.0:1 |
| secondary | `#8A5A12` | Candle amber (text-level): prayed counts, highlights |
| secondaryContainer | `#FBE3B8` | **Pray button** background, pray-mode accents |
| onSecondaryContainer | `#4A2E00` | 10.0:1 |
| tertiary | `#3F7350` | Sage: **Answered** status |
| tertiaryContainer | `#CFE8D5` | Answered badge background |
| onTertiaryContainer | `#10301B` | 11.1:1 |
| surface / background | `#FBF8F3` | Warm parchment |
| surfaceContainerLowest | `#FFFFFF` | Cards |
| surfaceContainerLow | `#F4EFE7` | Sections |
| surfaceContainer | `#EEE8DE` | Nav bar, inputs |
| surfaceContainerHigh | `#E7E0D4` | Dialogs/sheets |
| onSurface | `#1D232B` | Body text (14.9:1) |
| onSurfaceVariant | `#4D5560` | Secondary text (7.1:1 on surface, 5.8:1 on high) |
| outline | `#8A8F96` | |
| outlineVariant | `#D5CEC2` | Dividers, card borders |
| error | `#B3261E` | Delete, destructive |

**Dark**

| Role | Hex | Use |
|---|---|---|
| primary | `#A9C7EC` | 10.4:1 on surface |
| onPrimary | `#0E2A47` | |
| primaryContainer | `#2B4A6E` | |
| onPrimaryContainer | `#D6E3F3` | 7.0:1 |
| secondary | `#F0C374` | Amber glow, 11.0:1 |
| onSecondary | `#422C00` | |
| secondaryContainer | `#5E4210` | Pray button |
| onSecondaryContainer | `#FBE3B8` | 7.4:1 |
| tertiary | `#9FD2AC` | Answered, 10.6:1 |
| tertiaryContainer | `#2A5537` | |
| onTertiaryContainer | `#CFE8D5` | 6.6:1 |
| surface / background | `#11161D` | Night sea |
| surfaceContainerLowest | `#0C1015` | |
| surfaceContainerLow | `#171D25` | Cards |
| surfaceContainer | `#1C232C` | Nav bar |
| surfaceContainerHigh | `#252D37` | Dialogs/sheets |
| onSurface | `#E8E4DC` | 14.3:1 |
| onSurfaceVariant | `#B9BEC6` | 8.5:1 |
| outline | `#868C94` | |
| outlineVariant | `#3A424C` | |
| error | `#F2B8B5` | |

Implementation: start from `ColorScheme.fromSeed(seedColor: Color(0xFF24456B), brightness: …)` and `copyWith` the values above, so roles not listed still get sensible tonal values. Put status colors (active, answered, pray) in a `ThemeExtension<StatusColors>` so widgets never hardcode hex values.

**Mockups:** all three palettes are rendered on phone screens (My Prayers list in light, Prayer detail in light, Carousel in dark) at https://claude.ai/artifact/AVx1WmNX4Wk73DSbSW1Ugt. Each screen has palette and light/dark tweaks. The full token values for the alternatives are in those mockups.

**Alternative palettes:**
- *Olive & Linen*: primary `#4E5D3A`, accent `#C0763E` (terracotta), surface `#F7F4EC`. Earthier and more rustic.
- *Twilight Plum*: primary `#4B3B6B`, accent `#D9A441`, surface `#F8F6FA`. Closest to today's indigo, but warmer.

### 7.3 Typography

| Style | Font | Size/weight | Use |
|---|---|---|---|
| displaySmall | Lora | 36 / 600 | Landing hero |
| headlineMedium | Lora | 28 / 600 | Screen titles ("My Prayers") |
| titleLarge | Lora | 22 / 600 | Prayer summary on detail and carousel |
| titleMedium | Inter | 16 / 600 | Card titles |
| bodyLarge | Inter | 16 / 400, height 1.5 | Descriptions |
| bodyMedium | Inter | 14 / 400 | Default |
| labelLarge | Inter | 14 / 600 | Buttons |
| labelSmall | Inter | 11 / 600, +0.5 tracking | Badges, overlines |

Bundle the variable font files in `assets/fonts/` and declare them in `pubspec.yaml`. Don't use `google_fonts` runtime fetching, because the PWA must render offline.

### 7.4 Shape, spacing, elevation, motion
- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Page padding is 16 on compact layouts and 24 on medium and larger.
- Radii: cards 16, dialogs/sheets 28 (M3 default), chips/badges 8, buttons stadium.
- Elevation: cards are flat (`surfaceContainerLowest` + 1px `outlineVariant` border). Use tonal elevation, not shadows.
- Motion: the M3 standard easing, 200–300 ms. A container transform or Hero from card to detail. The pray button gets a short scale and glow pulse plus a count tick animation. Marking a prayer answered gets a gentle sage shimmer (one-shot, respects `MediaQuery.disableAnimations`).

### 7.5 Responsive layout

| Width | Class | Navigation | Prayer list | Dialogs |
|---|---|---|---|---|
| < 600 | compact | `NavigationBar` (bottom), FAB | 1 column | Forms open as full-screen dialogs or modal bottom sheets |
| 600–839 | medium | `NavigationRail` | 2 columns | Centered dialogs (max 560) |
| ≥ 840 | expanded | `NavigationRail` (extended ≥ 1200) | 2–3 columns; detail max width 720 | Centered dialogs |

The top app bar holds the screen title and the avatar menu. Notifications live in **one place only**: the **Activity** navigation destination with an unread `Badge` (§9.0). There is no app-bar bell.

### 7.6 Shared components (build these first; add a debug-only `/dev/gallery` route)

- `PrayerCard`: summary, clamped description, optional owner row, group chips, footer (date, updates count, `StatusBadge`, `PrayButton` or count). For the owner, a ⋮ overflow menu on the card holds Mark answered/active, Share with groups, and Edit, instead of a row of icon buttons (see the mockups)
- `StatusBadge`: Active (primaryContainer) / Answered (tertiaryContainer)
- `PrayButton`: amber tonal button with a praying-hands icon and count; "prayed" state; debounce; haptic-free animation
- `FilterBar`: `SegmentedButton<PrayerFilter>` + view-mode toggle
- `EmptyState`: illustration/icon, title, body, CTA
- `SkeletonCard`: shimmer placeholder
- `Avatar`: network photo, falling back to **local initials**, so the external ui-avatars.com dependency goes away
- `GroupChip`, `ConfirmDialog` (replaces `confirm()`), `AppSnackBar` (replaces `alert()`)
- `QrDialog`: `QrImageView` with `embeddedImage` logo, error level H, plus Copy and Share buttons
- `UpdateTile`: content, timestamp, "(edited)", author actions (inline edit)

### 7.7 Accessibility
- Every interactive target is at least 48×48.
- Semantic labels on icon buttons (the current app relies on `title` attributes).
- Keyboard: focus traversal order, Esc closes dialogs (M3 default), arrow keys in the carousel, Enter submits forms.
- Text scaling up to 200% without clipping.
- Long-form text (descriptions, updates) inside a `SelectionArea` so users can select and copy it.
- Contrast ratios as listed in §7.2.

---

## 8. Screen specs

Each screen handles **loading**, **empty**, **error**, and **offline** states (a cached-data banner via `SnapshotMetadata.isFromCache` where useful).

### 8.1 Splash (`index.html` + router splash)
Native HTML splash in the palette colors (like omtb's `flutter_native_splash`), with the logo centered, shown until the first Flutter frame. Then the router splash runs until the auth state resolves.

### 8.2 Welcome (`/welcome`)
- Hero: logo, "Prayer Odyssey" (Lora display), tagline "Track your spiritual journey, create prayer groups, and encourage one another."
- Buttons: **Get started** (filled → `/login`), **Learn more** (text → `/about`).
- Three feature cards (Track Prayers, Groups, Notifications), keeping the current copy.
- This screen fixes a current bug where the hero text and "Learn more" are white-on-light in light mode.

### 8.3 Login (`/login`)
- Card with the logo and a "Welcome back" / "Create account" title.
- `AutofillGroup` with email (`AutofillHints.email`) and password (`password` / `newPassword`) so password managers work. Name field in sign-up mode.
- Primary button: Sign in / Sign up (with loading state). Divider "or". **Continue with Google** (outlined, with the Google "G" logo).
- Toggle link between sign-in and sign-up. **New:** "Forgot password?" → `sendPasswordResetEmail` (small, cheap, often needed).
- Errors are mapped from `FirebaseAuthException.code` to the friendly strings in §2.1, including `invalid-credential` (newer SDKs return this instead of `user-not-found`/`wrong-password`).
- Google on web: `signInWithPopup(GoogleAuthProvider())`. If it throws `popup-blocked` or the app runs as an iOS standalone PWA, fall back to `signInWithRedirect`. See §15 for the `authDomain` note.

### 8.4 My Prayers (`/prayers`)
- App bar title "My Prayers". FAB "New prayer" on compact; a filled button in the header on wider layouts.
- `FilterBar`: Active | Answered | All, plus a view toggle (List / Carousel).
- **List view:** responsive grid of `PrayerCard`s (owner info hidden, group chips shown).
- **Carousel view:** see §8.5.
- Empty (no prayers): illustration, "No prayers yet", "Start your prayer journey by creating your first prayer request.", CTA.
- Filtered empty: "No answered prayers yet", etc.

### 8.5 Carousel view
- Keep the name **Carousel**. Build it with a `PageView`, **not** Flutter's M3 `CarouselView` widget: that widget shows several items at once in a scrolling strip, while this view shows one prayer at a time.
- `PageView` with one prayer per page and a large-type layout (summary in Lora titleLarge, full description, latest update preview from the denormalized `latestUpdate`).
- Header: "3 of 12", prev/next icon buttons. Footer: page dots (compact "n / N" when there are more than 5 on narrow screens), and a hint ("Swipe or use ← →").
- Arrow-key `Shortcuts`/`Actions` on desktop.
- For the owner, the primary action is "Mark answered". For shared prayers it is the **Pray** button.
- The index is clamped when the list changes.

### 8.6 Add / Edit Prayer
- Compact: full-screen dialog with Save in the app bar. Wider layouts: a 560px dialog.
- Fields: Summary (required, `maxLength: 100` with counter), Details (multiline, 4–10 lines), and on Add: "Share with groups" as `FilterChip`s, pre-selected from the route or caller.
- Validation inline; the Save button is disabled while saving. Errors show in a banner inside the form.
- When there are unsaved changes, dismissing asks "Discard changes?".

### 8.7 Prayer detail (`/prayers/:id`)
- App bar: back button and title. For the owner, an overflow menu: Edit, Share with groups, Delete. Mark Answered/Active is a prominent tonal button in the body, not hidden in the menu.
- Body (max width 720):
  - Shared-by row for non-owners (avatar, "{name} shared this prayer")
  - Summary (Lora), description (`SelectionArea`)
  - "Shared with" chips (owner)
  - Meta row: created date, `StatusBadge`, prayed count / `PrayButton`
- **Updates** section as a vertical timeline (dot + line), newest first. Owner: an "Add update" button that opens a sheet. Author: Edit (inline `TextField` that swaps in) and Delete (confirm). "(edited)" marker.
- Delete prayer: `ConfirmDialog`, then `context.go('/prayers')` and a SnackBar "Prayer deleted".
- Not found / no permission: friendly message plus "Back to prayers".

### 8.8 Share with groups
A modal bottom sheet (compact) or dialog listing the user's groups as `CheckboxListTile`s. Empty state links to `/groups`. "Save" calls `updateSharing`.

### 8.9 Groups (`/groups`)
- List of `GroupCard`s: name, description (2 lines), member count, created date, and an "Admin" chip when relevant.
- FAB / header button "Create group" opens a dialog with name (required) and description.
- Empty state: "No groups yet — create a group to share prayers with friends and family." Secondary text: "Have an invite link? Just open it to join."

### 8.10 Group detail (`/groups/:id`)
- Header card: name (Lora), description, member count, "Member" / "Admin" chip.
- Actions: **Invite** split/menu button with *Copy link*, *Show QR code*, and *Share…* (`share_plus`, Web Share on mobile). The invite URL is `https://app.prayerodyssey.com/groups/{id}`, built from config rather than `window.location`.
- Non-member: a prominent "Join this group" card with the group description and a Join button. Prayers are not loaded (the rules would block them anyway).
- Member: `FilterBar`, then the group prayer list or carousel (owner info shown). FAB "New prayer" with this group pre-selected.

### 8.11 Activity (`/activity`)
- App bar actions: "Mark all read" (**new**, batch update) and "Clear all" (confirm).
- List grouped by day (Today / Yesterday / Earlier). Each tile shows a type icon in a tonal circle, a rich-text message (sender bold, quoted summary, "in {group}"), a relative time, and an unread dot.
- Tap: mark read, then navigate (prayer → `/prayers/:id`; group-only → `/groups/:id`).
- Swipe to dismiss (`Dismissible`) deletes the item, with Undo in a SnackBar where feasible (re-create isn't allowed by the rules for another sender, so "undo" means delaying the delete by 4 s).
- Empty: "All caught up!".
- Top-of-list card when push is off: "Get notified when someone prays for you" → Enable (§9).

### 8.12 Profile (`/profile`)
Sections (`ListTile`-based settings page):
1. **Account**: avatar, name, email.
2. **Appearance**: theme mode System / Light / Dark (`SegmentedButton`). Today there's only a light/dark toggle; adding "System" is new.
3. **Notifications**: push status with Enable/Disable, "Blocked in browser settings" help text when denied, and "Install the app to enable notifications" guidance on iOS Safari when not installed.
4. **Your data**: Export → `/profile/export`.
5. **Advanced** (expansion tile): Clear all devices (confirm).
6. **About** → `/about`.
7. **Sign out** (destructive text button).

### 8.13 Export (`/profile/export`)
- Format radio list with the existing descriptions.
- Date range: `showDateRangePicker` with a "Clear" option.
- Action button: "Export" / "Open print view". Shows progress, then a success or error message.
- Details in §11.

### 8.14 About (`/about`)
- Dillie-O Digital logo, name, "Version 5.x.y" (`package_info_plus`).
- Cards: Website (open link, plus a "Share app" QR dialog), Discord.
- **Recent updates**, rendered from `assets/release_notes.json` (`[{version, date, title, items[]}]`), the newest marked "Latest". This removes the hand-edited markup. Keep CHANGELOG.md as the developer-facing source; the JSON holds the user-facing copy.

---

## 9. Notifications

### 9.0 Where notifications live (decided)
Following Material 3 guidance, notifications are a **top-level navigation destination** ("Activity") with a `Badge` showing the unread count. It is the third of four destinations in the `NavigationBar` on phones and in the `NavigationRail` on wider screens. This is the right choice when notifications are a core part of the app ("someone is praying for you"), and it gives one consistent location at every screen size. M3 reserves top-app-bar action icons for actions on the current screen. About moves under Profile, so there are four destinations: Prayers, Groups, Activity, Profile (M3 recommends 3–5).

### 9.1 In-app activity feed
See §8.11. Backed by `activityProvider`. `unreadCountProvider` drives the badges (the Activity destination badge and the browser tab title prefix "(3) Prayer Odyssey" through `SystemChrome.setApplicationSwitcherDescription` / `Title`).

### 9.2 Push permission UX (change from today)
Today the app calls `Notification.requestPermission()` **automatically on every login**. Browsers penalize this: Chrome quiets the prompt, and Safari requires a user gesture. The new flow:
1. Never prompt automatically.
2. Show a soft-ask card (top of Activity, and once after the first prayer is created) explaining the benefit. Tapping **Enable** triggers the browser prompt.
3. iOS/iPadOS: Web Push works **only in an installed PWA** (16.4+). If the app isn't running standalone (`matchMedia('(display-mode: standalone)')`), show "Add to Home Screen" instructions instead of Enable.
4. On every app start, if permission is already `granted` and this device's token is registered, refresh the token silently and update `lastUsed`. Listen to `onTokenRefresh` and swap the token in the profile.

### 9.3 Token lifecycle (`PushRepository`)
Keep today's semantics: cap 10, prune > 30 days, `fcmTokenInfo` without the user agent or platform. Use **one** `set(merge)` write per change, not today's read-modify-write chains. Server-side pruning of dead tokens is in §4.4.

### 9.4 Foreground messages
`FirebaseMessaging.onMessage` shows an in-app `SnackBar` with a "View" action that navigates to `data.url`, **not** an OS notification while the app is focused. The Activity feed already updates live.

### 9.5 Background messages
`firebase-messaging-sw.js` (from a template, §12) uses the compat SDK to call `onBackgroundMessage` → `showNotification`. With `webpush.fcmOptions.link` set by the function, clicks are handled automatically. Also add a `notificationclick` handler as a fallback, which focuses an existing client and navigates it, or opens a new window.

### 9.6 Notification copy (Appendix B)

---

## 10. PWA

### 10.1 Manifest (`web/manifest.json`)
```json
{
  "name": "Prayer Odyssey",
  "short_name": "Prayer Odyssey",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"],
  "background_color": "#11161D",
  "theme_color": "#24456B",
  "description": "Track your prayers and share with groups.",
  "icons": [192/512 any + 192/512 maskable],
  "screenshots": [wide 1280x720, narrow 720x1280],
  "shortcuts": [
    {"name": "New prayer", "url": "/prayers?new=1"},
    {"name": "Pray now", "url": "/prayers?view=carousel"}
  ],
  "prefer_related_applications": false
}
```
Keep `id: "/"` and `start_url: "/"` the same as the current install, so existing installed PWAs update in place instead of becoming a "different app". Add `<meta name="theme-color">` tags for light and dark in `index.html`, and set the iOS `apple-touch-icon` and status-bar meta tags (see omtb's `index.html`).

### 10.2 Service worker strategy
Flutter deprecated its generated service worker, so (like omtb) we own it:

1. `flutter build web --release --no-web-resources-cdn --dart-define-from-file=env/prod.json`
   - `--no-web-resources-cdn` bundles CanvasKit locally. **Without it, CanvasKit loads from gstatic and the app can't start offline.**
2. `tool/gen_messaging_sw.dart` writes `build/web/firebase-messaging-sw.js` from the template plus env values (no committed keys).
3. `npx workbox-cli injectManifest workbox-config.cjs` generates `build/web/sw.js` from `web/sw-src.js` with a revisioned precache of `index.html`, `flutter_bootstrap.js`, `main.dart.js`, `canvaskit/**`, `assets/**`, `icons/**`, `manifest.json`.
4. `sw-src.js`: `precacheAndRoute(self.__WB_MANIFEST)`, `cleanupOutdatedCaches()`, navigation fallback to `index.html`, `skipWaiting` on message, no runtime caching of Firestore (the SDK handles that).
5. `index.html` registers `/sw.js`. FCM registers `/firebase-messaging-sw.js` itself, under its own `/firebase-cloud-messaging-push-scope`, so the two don't conflict. Push handling lives **only** in the messaging SW (omtb's `sw.js` push handler is effectively dead code; don't copy it).

### 10.3 Update flow
- Flutter emits `version.json`. Every 30 minutes and on app resume (`visibilitychange`), the app fetches `/version.json?ts=…` with no-store and compares it with the compiled version.
- If it's newer, show a persistent banner: "A new version of Prayer Odyssey is available — Refresh". Refresh posts `SKIP_WAITING` to the waiting SW and reloads.

### 10.4 Hosting headers (`firebase.json`)
- `no-cache` for: `/index.html`, `/sw.js`, `/firebase-messaging-sw.js`, `/manifest.json`, `/version.json`, `/flutter_bootstrap.js`, `/main.dart.js` (Flutter does not fingerprint `main.dart.js`, so it must revalidate).
- `max-age=31536000, immutable` for `/canvaskit/**`, `/assets/fonts/**`, `/icons/**`.

### 10.5 Install prompt
Capture `beforeinstallprompt` in `index.html` and expose it to Dart through a small JS interop shim. Show an "Install app" item on the Profile page (and in the soft-ask card on Android/desktop Chrome). On iOS, show instructions instead.

### 10.6 Offline behavior
- The app shell loads offline from the precache.
- Firestore persistence: `FirebaseFirestore.instance.settings = const Settings(persistenceEnabled: true, webPersistentTabManager: WebPersistentMultipleTabManager())`. Check the current `cloud_firestore` web API names at implementation time.
- Writes made offline are queued by Firestore and show as pending. The connectivity banner reads "You're offline — changes will sync when you reconnect".
- Sign-in requires a connection, so the login screen shows a clear message when offline.

---

## 11. Export

Port `src/lib/utils/prayerExport.ts` (733 lines) to `features/export/`:

- `ExportService.fetch(uid, DateRange?)` → `PrayerExportData`: the owned prayers (`where ownerId == uid`, plus `createdAt >= start` / `<= end-of-day` when set), each with its updates, and the summary (totals for active/answered/archived, updates, prayed counts, date range, `exportedAt`, `appVersion`).
- Formatters (pure Dart, **unit-tested with golden fixtures**):
  - `JsonFormatter` → `prayer-odyssey-export-YYYY-MM-DD.json` (keep the same schema as today, so old and new exports are interchangeable)
  - `CsvZipFormatter` → `prayers.csv`, `updates.csv`, `summary.csv` zipped with `archive`
  - `MarkdownFormatter` → `.md`
  - `DocxFormatter` (**required**: people edit their prayers after export or merge them into other documents) → build minimal OOXML (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`, `word/styles.xml`, `docProps/core.xml`) and zip it with `archive`. To make the file easy to edit and merge:
    - Use Word's **built-in style IDs** (`Title`, `Heading1`, `Heading2`, `Normal`, `ListBullet`) rather than direct formatting. Then the navigation pane, table of contents and "merge styles" all work, and pasted content picks up the destination document's styles.
    - One `Heading1` per prayer (the summary), a small metadata line (status, created date, groups, prayed count), the description as `Normal` paragraphs, and an "Updates" `Heading2` with dated entries.
    - No text boxes, tables or floating shapes for layout. Plain paragraphs survive copy, paste and merge best.
    - Open-test the output in Word, Google Docs and LibreOffice (part of M6 done criteria).
    - If hand-rolled OOXML gets fiddly, use a `.dotx`-style template stored in `assets/export/` with placeholders filled in, but keep the same style IDs.
  - `PdfFormatter` (**required**, alongside Word) → a journal-styled PDF with the `pdf` package (embedded Lora/Inter, cover page, one prayer per section, update timeline). "Print" calls `Printing.layoutPdf` (opens the browser print dialog); "Download PDF" calls `Printing.sharePdf`. This replaces the pop-up window, so "Please allow pop-ups" goes away.
- `web_download.dart`: `Blob` → object URL → `<a download>` click → revoke after 1 s.

---

## 12. Configuration and secrets

`env/example.json` (committed):
```json
{
  "FIREBASE_API_KEY": "",
  "FIREBASE_AUTH_DOMAIN": "",
  "FIREBASE_PROJECT_ID": "",
  "FIREBASE_STORAGE_BUCKET": "",
  "FIREBASE_MESSAGING_SENDER_ID": "",
  "FIREBASE_APP_ID": "",
  "FIREBASE_MEASUREMENT_ID": "",
  "FIREBASE_VAPID_KEY": "",
  "APP_BASE_URL": "https://app.prayerodyssey.com"
}
```
- Dart reads these with `String.fromEnvironment(...)` in `core/firebase/firebase_options.dart`. **No `defaultValue`s containing real keys**, unlike omtb's `fcm_service.dart`. The app fails fast with a clear message if they're missing.
- CI writes `env/prod.json` from GitHub Secrets (reuse the existing `VITE_FIREBASE_*` secrets or rename them to `FIREBASE_*`).
- `firebase-messaging-sw.js` is generated from a template at build time (§10.2, step 2), keeping the 4.3.2 fix that removed hardcoded credentials. Note that omtb still hardcodes its config in `web/firebase-messaging-sw.js` and `web/firebase-config.js`, which is worth cleaning up there too.
- Local dev: `flutter run -d chrome --web-port 5173 --dart-define-from-file=env/dev.json`. Add `localhost:5173` to Firebase Auth authorized domains. Optionally use the Firebase Emulator Suite (`--dart-define=USE_EMULATORS=true`).

---

## 13. Testing and quality

| Layer | Tooling | What |
|---|---|---|
| Static | `flutter analyze` (`flutter_lints` or `very_good_analysis`), `dart format --set-exit-if-changed` | CI gate |
| Unit | `flutter test` | Models (`fromFirestore` incl. legacy `content`, null timestamps, unknown enums), filters, export formatters (golden text fixtures), date-range logic, token cap/prune logic |
| Repository | `fake_cloud_firestore`, `firebase_auth_mocks` | Every write method from §5.2 produces the exact document shape in §4.1 |
| Widget | `flutter test` + `ProviderScope` overrides | PrayerCard (owner/non-owner/answered), FilterBar, carousel navigation (keys, swipe), dialogs, login error mapping, activity tap → navigation |
| Golden | `matchesGoldenFile` (light + dark, compact + expanded) | Key components and screens; catches visual regressions |
| Rules | `@firebase/rules-unit-testing` in `firebase/` (Node) | Codify the current rules plus the hardening in §4.3 |
| Functions | `firebase-functions-test` + emulator | Fan-out recipients, dead-token pruning, count maintenance |
| E2E smoke | Playwright against `flutter build web` served locally, with semantics enabled (`SemanticsBinding.instance.ensureSemantics()` behind `--dart-define=E2E=true`) | Login → create prayer → open detail → screenshots for PRs (keeps the current audit flow). Flutter renders to canvas, so selectors use ARIA roles/labels from semantics |

Target: 80%+ coverage of `features/*/data`, `application`, and `export/formatters`.

---

## 14. CI/CD, cutover and rollback

### 14.1 Workflows (new repo)
- `ci.yml` (PRs): `subosito/flutter-action` (stable, cached) → `flutter pub get` → `dart run build_runner build -d` → `flutter analyze` → `flutter test` → `tool/build_web.sh` → Playwright smoke → `FirebaseExtended/action-hosting-deploy` **preview channel**, with the URL commented on the PR.
- `deploy.yml` (push to `release`): same build → deploy `live` → `firebase deploy --only firestore:rules,firestore:indexes,functions` (the latter only when `firebase/**` changed, via a paths filter or a separate job).
- Use the existing `FIREBASE_SERVICE_ACCOUNT_PRAYER_ODYSSEY_96025` secret (add it to the new repo).

### 14.2 Cutover plan (no downtime, no data migration)
Testing happens on **PR preview channels** only. There is no separate beta site.

1. **Test on preview channels.** Every PR deploys to a Firebase Hosting preview channel in the same project (`prayer-odyssey-96025--pr-<n>-<hash>.web.app`), so testers use the real data and real accounts.
   - **Google sign-in on previews:** Firebase Auth only allows OAuth popups/redirects from domains on its authorized list, and preview channel domains aren't on it by default. Either sign in with email/password on previews (the E2E audit account already does), or add a long-lived channel's domain to Auth → Settings → Authorized domains. A long-lived channel can be created with `firebase hosting:channel:deploy dogfood --expires 30d`, which gives a stable URL to share with a few testers while the old app stays live.
   - Push tokens are scoped per origin, so push on a preview channel must be enabled separately. That's fine for testing.
   - Do **not** deploy function change 2 (`onPrayerStatusChanged`) yet. Until cutover, the Flutter client sends `prayer_answered` client-side, the same as today, behind a `CLIENT_ANSWERED_FANOUT` flag.
2. **Parity sign-off** against the §2 checklist on the final preview.
3. **Find the old service worker's URL** (DevTools → Application on app.prayerodyssey.com; vite-pwa's injectManifest output, likely `/sw.js` or `/service-worker.js`). The new build **must serve a SW at that same path**, either the new `sw.js` itself or a tiny "replacement" SW that calls `skipWaiting`, clears all old caches, `clients.claim()`, and reloads its clients. Otherwise installed users can stay stuck on the cached Svelte app.
4. **Cutover release:** merge to `release`, which deploys the Flutter app to `live` on app.prayerodyssey.com. Deploy the functions changes (§4.4) and turn the client fan-out flag off in the same release. Same origin + same `id`/`start_url` + same `firebase-messaging-sw.js` path means installed PWAs update in place and existing FCM tokens should keep working (verify on one device first).
5. **Post-cutover:** watch the Functions logs and client error logging (Analytics `app_exception` events, or Sentry if desired). Ship the §4.3 privacy split as a follow-up.
6. **Rollback:** Firebase Hosting → release history → roll back `live` to the last Svelte release (one click). Functions: redeploy the previous `functions/` from the old repo tag `v4.3.2`. The data stays compatible both ways because the schema only gains optional fields.
7. **Archive** `prayer-odyssey-pwa` once the app has been stable for ~30 days. Tag the final state `v4.3.2-final`.

---

## 15. Flutter web trade-offs and mitigations

| Trade-off | Mitigation |
|---|---|
| Larger first load (~2–3 MB compressed with CanvasKit) than SvelteKit | HTML splash in brand colors; SW precache makes later loads instant; consider `--wasm` later |
| Canvas rendering: no native Ctrl+F, text selection is opt-in | `SelectionArea` on detail and carousel views; search within the app is a possible enhancement |
| Emoji need fallback-font downloads at runtime (and render as tofu offline) | Use Material Symbols icons in the UI (`volunteer_activism`, `edit_note`, `auto_awesome`, `share`, `notifications`) or a custom praying-hands SVG. Keep emoji only in OS push titles, which the OS renders |
| Cross-origin images (Google profile photos) can fail under CanvasKit's CORS requirements | `Image.network(..., webHtmlElementStrategy: WebHtmlElementStrategy.fallback)` plus the initials-avatar fallback |
| Password-manager autofill is weaker than native forms | `AutofillGroup` + `autofillHints`; call `TextInput.finishAutofillContext()` on submit |
| Google sign-in popups in an iOS standalone PWA | Redirect fallback; set `FIREBASE_AUTH_DOMAIN` to **app.prayerodyssey.com** (served from Firebase Hosting, which proxies `/__/auth/*`), so redirect auth stays first-party and isn't broken by third-party storage partitioning |
| `dart:html` deprecation | Use `package:web` + `dart:js_interop` exclusively |
| Playwright can't see canvas widgets | Enable semantics in E2E builds; rely mainly on widget and golden tests |

---

## 16. Optional enhancements (after parity, each its own PR)

Ordered by value versus effort:
1. **Leave group** and **admin tools** (edit name/description, remove member, delete group, promote admin). Needs the rule change in §4.3.4.
2. **Mark all read** in Activity (cheap; listed in §8.11).
3. **"Praying for others" feed**: one stream of active prayers shared to all my groups, newest first, so users can pray through them without visiting each group. Could become the Prayers tab's second segment ("Mine | Shared").
4. **Notification preferences** per type (stored in `users/{uid}/private/settings`, respected by functions).
5. **Archive** status in the UI (the enum already exists).
6. **Prayer reminders** (daily "pray now" push at a chosen time). Scheduled functions + per-user time zone; omtb's reminder pattern is a reference.
7. **Search and tags** on My Prayers.
8. **Import** from a JSON export.
9. **Answered-prayer testimony**: an optional note when marking answered, shown on the card.

---

## 17. Repo conventions (carry over from the current `.github/copilot-instructions.md`)

Create `CLAUDE.md` (and/or `AGENTS.md`) in the new repo:
1. Every PR with app changes: bump `version:` in `pubspec.yaml` (`X.Y.Z+build`), add a `CHANGELOG.md` entry (Keep a Changelog), and add an entry to `assets/release_notes.json` when it's user-facing.
2. Attach refreshed screenshots (light and dark, mobile and desktop) **in the PR description**, not committed to the repo. The Playwright smoke job produces them.
3. Never commit `env/*.json` (except `example.json`) or generated SW files containing config.
4. Run `dart format`, `flutter analyze`, `flutter test` before pushing.
5. Widgets don't talk to Firebase directly (see §3.1).
6. Colors come only from `Theme.of(context).colorScheme` or `StatusColors`, never as hex literals in widgets.

---

## 18. Implementation plan (milestones)

Each milestone ends in a deployable preview channel and a version bump (5.0.0-alpha.N while pre-cutover).

**M0: Repo and skeleton**
- [ ] Create the repo; `flutter create --platforms=web --org com.dillieo prayer_odyssey`
- [ ] Add packages; analysis options; `build_runner`
- [ ] `env/` + `firebase_options.dart`; `usePathUrlStrategy()`
- [ ] Move `firestore.rules`, `firestore.indexes.json`, `functions/` into `firebase/`
- [ ] CI workflow (analyze, test, build, preview deploy) green on a hello-world
- [ ] `CLAUDE.md`, `CHANGELOG.md` (5.0.0-alpha.1)
- **Done when:** the PR preview URL loads the app with a Firebase connection.

**M1: Design system and shell**
- [ ] Theme tokens, light/dark `ColorScheme`s, `StatusColors`, typography with bundled fonts
- [ ] Theme mode provider (System/Light/Dark, saved)
- [ ] Responsive shell (bar / rail / extended rail) with 4 tabs and badges
- [ ] Shared components + debug `/dev/gallery` + golden tests
- **Done when:** the gallery looks right in light and dark at 375px, 800px and 1280px.

**M2: Auth and routing**
- [ ] Auth repository (email, Google popup and redirect fallback, reset password, sign out, user doc sync)
- [ ] go_router with splash, redirect and `from` return path
- [ ] Welcome and Login screens with error mapping and autofill
- **Done when:** sign up, sign in, Google sign-in, sign out and invite-link return all work on the preview.

**M3: Prayers**
- [ ] Models + `PrayerRepository` + providers (with repository tests)
- [ ] My Prayers: filter, list grid, skeleton, empty states
- [ ] Add/Edit (with group selection), delete, status toggle, share sheet
- [ ] Prayer detail + updates timeline CRUD
- [ ] Pray button (non-owner) + `prayer_reaction` notification
- [ ] Carousel (PageView, keys, swipe, dots), with the view mode saved
- **Done when:** checklists §2.2–§2.7 pass.

**M4: Groups**
- [ ] `GroupRepository` + providers
- [ ] Groups list, create
- [ ] Group detail: join, members view, filter, carousel, add prayer pre-selected
- [ ] Invite: copy, QR (logo), share
- **Done when:** checklists §2.8–§2.9 pass, and a second account can join through a QR scan on a phone.

**M5: Activity and push**
- [ ] Activity screen, unread badges, mark read, delete, clear all, mark all read
- [ ] `firebase-messaging-sw.js` template + generator; `sw.js` via Workbox; `tool/build_web.sh`
- [ ] Permission soft-ask, iOS install guidance, token lifecycle, foreground SnackBar
- **Done when:** push arrives on desktop Chrome, Android Chrome (installed) and iOS (installed PWA), and tapping it opens the right prayer.

**M6: Profile, export, about**
- [ ] Profile settings page
- [ ] Export: all five formats with date range, formatter golden tests
- [ ] About + `release_notes.json` + app share QR
- **Done when:** checklists §2.12–§2.14 pass, exports match the old JSON schema, and the .docx opens cleanly in Word, Google Docs and LibreOffice with working heading styles.

**M7: PWA polish and performance**
- [ ] Manifest, icons (regenerate maskable icons in the new palette), splash, shortcuts, screenshots
- [ ] Offline shell test (DevTools offline → reload works), connectivity banner
- [ ] Update banner via `version.json`
- [ ] Install prompt
- [ ] Lighthouse PWA/accessibility pass; check whether `--wasm` is worth it
- **Done when:** the app installs on Android, iOS and desktop, launches offline, and the update banner shows after a redeploy.

**M8: Backend improvements**
- [ ] Functions: `fcmOptions.link`, dead-token pruning, `onPrayerUpdateWritten` (+ backfill), `onPrayerDeleted`, `onPrayerStatusChanged` (deployed at cutover)
- [ ] Rules unit tests for current behavior
- **Done when:** the emulator tests pass and the backfill has been dry-run against prod (read-only mode).

**M9: Dogfood, cutover, cleanup**
- [ ] Dogfood on a preview channel with real groups
- [ ] Replacement SW at the old SW path
- [ ] Cutover per §14.2; release 5.0.0
- [ ] Follow-up: privacy split of `users` (§4.3.1)
- [ ] Archive the old repo after ~30 days

---

## 19. Decisions log and open questions

### Decided (review of v1)

| # | Topic | Decision |
|---|---|---|
| D1 | Backend/data | Use the same Firebase project and live database. |
| D2 | State management | Riverpod. |
| D3 | Notification location | Follow Material 3: an "Activity" navigation destination with an unread badge, in the bottom bar on phones and the rail on wider screens. No app-bar bell. About moves under Profile (§9.0). |
| D4 | Carousel | Keep the name "Carousel". Implemented with `PageView` (§8.5). |
| D5 | Export | Keep **both** Word (.docx, editable and mergeable, §11) and PDF. |
| D6 | Testing before cutover | PR preview channels only. No beta site or extra DNS (§14.2). |

### Still open

**Q3. Palette.** Mockups of all three palettes (list, detail, carousel) are on the design canvas. Pick one, or mix (for example, Dawn Voyage structure with Olive's warmer surfaces). Will the app icon and logo be refreshed to match, or stay as they are?

**Q8. Backend ownership.** Move `functions/` and the rules into the new repo (recommended, one source of truth), or keep backend deploys in the old repo until cutover?

**Q9. Repo/package name.** Is `prayer-odyssey` / `prayer_odyssey` OK? Should it be public or private?

**Q10. Analytics and error reporting.** Keep Firebase Analytics? Add Sentry (or similar) for Flutter web error reporting?

---

## Appendix A: Firebase config/rules files to copy verbatim
- `firestore.rules` (then harden per §4.3 in a later PR)
- `firestore.indexes.json`
- `functions/index.js`, `functions/package.json` (Node 22, firebase-functions v6, firebase-admin v13)
- `.firebaserc` (`prayer-odyssey-96025`)
- `firebase.json`: change `hosting.public` to `build/web`, add the headers from §10.4, keep the `**` → `/index.html` rewrite, and set `firestore` and `functions` paths to `firebase/…`

## Appendix B: Notification types

| Type | Created by | In-app copy | Push title / body | Icon (Material Symbols) | Tap target |
|---|---|---|---|---|---|
| `prayer_reaction` | Client (pray button) | **{sender}** is praying for "{summary}" | 🙏 Someone is praying! / {sender} is praying for "{summary}" | `volunteer_activism` | `/prayers/{id}` |
| `prayer_update` | Function `onPrayerUpdateCreated` | **{sender}** added an update to "{summary}" in {group} | 📝 Prayer Update / {sender} added an update to "{summary}" | `edit_note` | `/prayers/{id}` |
| `prayer_answered` | Function `onPrayerStatusChanged` (new) | **{sender}** marked "{summary}" as answered | ✨ Prayer Answered! / {sender} marked "{summary}" as answered | `auto_awesome` | `/prayers/{id}` |
| `prayer_shared` | Function `onPrayerCreated` (+ sharing edits) | **{sender}** shared "{summary}" with your group {group} | 📤 Prayer Shared / {sender} shared "{summary}" with your group | `share` | `/prayers/{id}` |
| `group_invite` | (reserved, not currently sent) | **{sender}** invited you to join {group} | 👥 Group Invitation / {sender} invited you to join a group. | `group_add` | `/groups/{groupId}` |

## Appendix C: omtb patterns reused vs. changed

| omtb | Prayer Odyssey rebuild |
|---|---|
| `MaterialApp` + named routes | `MaterialApp.router` + go_router (deep links needed) |
| Provider + ChangeNotifier | Riverpod (D2) |
| `colorSchemeSeed` only | Seed + explicit role overrides + ThemeExtension |
| Drift/SQLite (wasm) local DB | Not needed; Firestore offline cache |
| Supabase + edge functions for reminders | Firebase Functions (already in place) |
| `firebase_messaging` + `firebase-messaging-sw.js` | Same, but the SW is generated from env (no hardcoded keys) |
| Hand-written `sw.js` (network-first) | Workbox-generated precache `sw.js` (true offline shell) |
| `qr_flutter`, `package_info_plus`, `shared_preferences` | Same |
| `flutter_native_splash` web splash | Same |
| Deploy on push to `release` via GitHub Actions | Same, plus PR preview channels and a test gate |
