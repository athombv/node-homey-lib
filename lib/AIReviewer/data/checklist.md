# Homey App Store Reviewer Reference

> This document is the working companion to the public [Homey App Store Guidelines](https://apps.developer.homey.app/app-store/guidelines). Every rule below either restates or drills into a rule from those guidelines. If you find a rule here that is *not* in the public guidelines, that is a bug — either the guidelines should be extended, or the rule should be removed.
>
> **Severity wording is load-bearing.** The AI parses verbs literally:
> - "must" / "required" / "is not allowed" / "will be rejected" / "always reject" → blocker
> - "should" / "avoid" / "make sure" → warning
> - "ideally" / "consider" → suggestion
>
> When the guidelines say "should", do not write "must" here. When they say "not allowed", do not soften to "should avoid". Wording mismatches drive incorrect severity and thus incorrect verdicts.

The submission's **type** is provided in the user message header. Use the matching section below.

---

## 1. Checklist for NEW apps

### Official Badge (verified developer)
- If the developer has a blue checkmark (verified), check whether sample devices have been received for testing.
- If devices cannot be provided (too large, etc.), the developer must instead submit a screen recording of:
  - Pairing process
  - Available device controls
  - Device advanced settings (if available)
  - App settings (if available)
  - Custom Flow cards (if available)

### Duplicate
- Check whether a similar app already exists in the App Store (see guidelines 2.1.1).
- If one exists: the developer should reach out to the existing developer first to cooperate or submit a PR. Submissions that resemble an existing app without explanation are rejected.
- Exception: a community app **and** a verified app for the same brand may coexist.

### App ID
- Must not contain "Athom" or "Homey". If so, reject.
- Apps approved in the past that contain either name are exempt (grandfathered).

### Account Name
- For Official-badge apps: the publishing account name must be the company name.

### App Name
- "Homey" and "Athom" in the app name is not allowed.
- Company names are not permitted; **brand names** are encouraged.
- (Cross-reference: guidelines section 1.1.)

### SDK
- New apps **must** use SDK v3. Reject if SDK v2 or older.

### Platform
- Usually local only.
- Official apps should ideally support both local and cloud (unless cloud is technically infeasible).
- Local = works on Homey Pro. Cloud = works on Homey Cloud.

### Readme (\`README.txt\` per locale)
The readme is a summary that describes and sells the app.

**Rejection triggers:**
- Changelog within the readme — **reject**
- Markdown syntax inside the readme — **reject**
- Description and readme are identical or near-identical — **reject**
- A donation link in the readme — **reject**
- Other URLs (these belong in app.json: bugs/support/homepage/source) — **reject**

### Description
Short subtitle shown above the readme in the App Store. Avoid repetition.

**Rejection triggers:**
- The app name **is** the description — **reject**
- Description identical to readme — **reject**
- Obvious filler like "Adds support for …" — **reject**

### Permissions
- If \`manager:homey:api\` is requested, the app must be a tool whose primary function justifies it. It is **not** needed to switch on a light bulb. Reject if usage doesn't justify the permission.

### URLs (in app.json)
- **Bugs URL**: if present, verify it works.
- **Homepage URL**: if present, must be a working URL.
- **Support URL**: if present, must be a working URL. **Mandatory** for Official apps.
- **Source URL**: if present, must be a working URL to the app source.
- **Community Topic ID**: if present, must be a working URL to a Homey Community Topic page.

### Icon
- App icon is required.
- Icon should have a transparent background.
- The default rocket icon is **not allowed** — reject.
- App icon cannot be the same as a driver icon — reject.

### Images
- The app itself requires an image.
- Images must be clear, not pixelated, well-designed, and recognizable for the brand/app.
- White or transparent backgrounds are **not allowed**. Avoid white background with a black shape.
- The Homey name/logo inside the image is **not allowed**.

### Driver
- **Platform**: usually local. Official apps add cloud (unless infeasible).
- **Name**: required. "Homey" in the driver name is not allowed.
- **Class**: type of driver (socket, sensor, button, etc.).
- **Capabilities**: the functions of the driver. Watch out for double UI capabilities such as:
  - \`alarm_battery\` AND \`measure_battery\` together
  - \`windowcoverings_state\` AND \`windowcoverings_set\` together
- **Icon**: driver icon is required. Should resemble the driver and should have a transparent background.
- **Images**: driver image is required. Should depict the device itself on a **white or transparent** background. Backgrounds that are neither white nor transparent (colored, photographic, scene-based) are not appropriate — flag as warning, not blocker.

### Flow conditions
- **Title**: required, must not be too long. "When", "And", "Then" must not appear in the title.
- **Formatted title**: must read as a short sentence with the arguments incorporated.
- **Hint**: explanation of what the Flow card does.
- **Arguments**: validate types and titles.

---

## 2. Checklist for EXISTING apps (UPDATE submissions)

Mainly check the **difference** between the current live version and the new submission. Quickly scan the rest to confirm overall standards are met.

### App Name
- Same rules as new apps: "Homey"/"Athom" not allowed, company names not permitted, brand names encouraged.

### Platform
- Usually local only.
- If cloud is **newly added** to an existing app, the app has recently become Official — **the app must be tested** before approval.

### Readme
Same rejection triggers as for new apps:
- Changelog in readme — **reject**
- Markdown syntax — **reject**
- Description and readme identical — **reject**
- Donation link — **reject**
- URLs that belong in app.json — **reject**

### Description
Same rejection triggers:
- App name **is** the description — **reject**
- Description identical to readme — **reject**
- Obvious "Adds support for …" filler — **reject**

### Permissions
- If a **new** permission has been added (especially \`manager:homey:api\`), verify with the developer why. Flag for follow-up rather than auto-reject.

### URLs (in app.json)
- **Bugs URL**: if newly added, check it works.
- **Homepage URL**: if newly added, must work.
- **Support URL**: if newly added, must work. Mandatory for verified apps.
- **Source URL**: if newly added, must work.
- **Community Topic ID**: if newly added, must work.

### Icon
- App icon is required.
- Icon should have a transparent background.
- Default rocket icon **not allowed** — reject.
- App icon cannot be the same as a driver icon — reject.

### Images
- Same rules as new apps: clear, not pixelated, recognizable, no white/transparent background, no Homey name/logo in the image.

### Driver
- **Name**: required. "Homey" not allowed in name.
- **Class**: type of driver.
- **Capabilities**: the functions of the driver. Watch for double UI capabilities (see new-app section).
- **Icon**: required. Should resemble the driver and should have a transparent background.
- **Images**: required. Should depict the device itself on a **white or transparent** background. Backgrounds that are neither white nor transparent (colored, photographic, scene-based) are not appropriate — flag as warning, not blocker.

### Flow conditions
- **Title**: required, not too long, no "When/And/Then".
- **Formatted title**: short sentence with arguments incorporated.
- **Hint**: explanation of what the Flow card does.

---

## How to apply this checklist in findings

- Every checklist-driven finding should set \`guidelineRef\` to \`checklist:<key>\` (e.g. \`checklist:duplicate\`, \`checklist:driver-icon\`, \`checklist:readme\`).
- "Reject" triggers in this checklist are **blocker** severity.
- "Should" / "avoid" wording produces **warning** severity. Do not upgrade these to blocker, even if the issue feels significant — the wording is chosen deliberately to signal that reviewers approve-with-feedback rather than reject.
- "Verify with developer" items (e.g. new permission) are **warning** severity that the human reviewer can escalate.
- Optional/best-practice items are **suggestion** severity.
