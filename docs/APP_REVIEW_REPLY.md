# Reply to Apple (Guideline 2.1, information needed)

Paste the text below into the reply to Apple's message in App Store Connect, and into the Notes field of App Review Information. Attach or link the screen recording (see the end).

---

Thank you for the review. Here is the information requested.

**1. Screen recording**
Recorded on a physical iPhone running the latest iOS, starting from launching the app. It shows: sign-up, the AI permission screen, the first-run tour, adding a vehicle, a diagnosis with a follow-up question, a repair quote analysis, OBD code lookup, recalls, repair history and reminders, sign out and sign in, and account deletion (Settings, Delete Account). There is no user-generated content shared between users, so no reporting or blocking is needed, and there are no paid features in this version.

**2. Purpose and audience**
Engine Eye helps vehicle owners and drivers (rated 4+, no objectionable content) understand car trouble. The problem it solves: people do not know how serious a warning light or noise is, what is likely wrong, or whether a mechanic's quote is fair. The user describes the problem or photographs a warning light, part or estimate, and gets a plain-English explanation with urgency, likely causes, simple self-checks, rough DIY and shop cost ranges, and which quote items look necessary or overpriced. It also looks up OBD-II codes, shows open safety recalls, and keeps a repair and maintenance log with reminders.

**3. How to use it**
Sign in with the demo account in the App Review Information (email and password are in the Sign-In fields), or create an account. First launch shows an AI permission screen (tap Agree and Continue), then a short optional tour and an optional vehicle step (Skip is available). Then: type a problem in the box at the bottom (for example "my brakes are soft"), tap + for Camera, Gallery or OBD Code, tap Quotes to analyze a photographed estimate, open the menu for recalls and history. No sample files are needed.

**4. External services used**
- Anthropic (Claude AI): generates diagnoses and quote analysis. Text and photos are sent only after the user agrees on the permission screen, which can be withdrawn in Settings.
- Supabase: account sign-in and storage of the user's saved diagnoses (private to each user).
- Railway: hosts our backend API.
- U.S. NHTSA recalls database: open safety recalls for the user's vehicle.
- YouTube: suggested repair videos open in YouTube via a link.
- Apple Maps: the Shops button opens a search for nearby repair shops.
There are no payment processors or ads in this version.

**5. Regional differences**
The app works the same in every region where it is available. Recall data comes from the U.S. NHTSA database, so recall results are most useful for vehicles sold in the United States; cost estimates are shown in U.S. dollars. The app is not offered in the EU in this version.

**6. Regulated industry or protected material**
None. The app gives general information, says it is not a substitute for a professional inspection, and does not handle regulated or protected third-party material.

---

## Recording checklist (user, on the iPhone)
Use a NEW throwaway account for the recording (not the demo account), so deleting it does not break the demo login. For example sign up as jack.evans4408+review1@gmail.com.
1. Swipe into Control Center and start Screen Recording (turn the microphone off).
2. Launch the app from the home screen. Sign up with the throwaway account.
3. Show the AI permission screen, tap Agree and Continue. Skip or play the tour. Skip or add a vehicle.
4. Ask "my brakes are soft", wait for the full answer, ask one follow-up question.
5. Tap + then OBD Code and look up P0420. Open Quotes and analyze a photographed estimate. Open the menu and show recalls and repair history.
6. Settings: Sign Out, then sign in again.
7. Settings: Delete Account, confirm. Show the app returning to the sign-in screen.
8. Stop the recording. Keep it under about 5 minutes.
