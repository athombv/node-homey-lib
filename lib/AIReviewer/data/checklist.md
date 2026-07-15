# Homey App Store Reviewer Reference

> This document is the working companion to the public [Homey App Store Guidelines](https://apps.developer.homey.app/app-store/guidelines). Every rule below either restates or drills into a rule from those guidelines. If you find a rule here that is *not* in the public guidelines, that is a bug — either the guidelines should be extended, or the rule should be removed.
>
> **Severity wording is load-bearing.** The AI parses verbs literally:
> - "must" / "required" / "is not allowed" / "will be rejected" / "always reject" → blocker
> - "should" / "avoid" / "make sure" → warning
> - "ideally" / "consider" → suggestion
>
> When the guidelines say "should", do not write "must" here. When they say "not allowed", do not soften to "should avoid". Wording mismatches drive incorrect severity and thus incorrect verdicts.
>
> **Guideline references are mandatory in developer-facing findings.** Every rule in this document has a `Guideline reference:` line naming the section of the public [App Store Guidelines](https://apps.developer.homey.app/app-store/guidelines) it derives from. When emitting a finding for a rule, the developer-facing `explanation` **must include the exact URL from that rule's `Guideline reference:` line** so the developer can go directly to the source. Never write "per the checklist" — the developer has no access to this document; only the public guidelines URL belongs in the message.

The submission's **type** is provided in the user message header. Use the matching section below.

---

## 1. Checklist for NEW apps

### Official Badge (verified developer)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#3-2-testing-verified-developers

- If the developer has a blue checkmark (verified), check whether sample devices have been received for testing.
- If devices cannot be provided (too large, etc.), the developer must instead submit a screen recording of:
  - Pairing process
  - Available device controls
  - Device advanced settings (if available)
  - App settings (if available)
  - Custom Flow cards (if available)

### Duplicate
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#2-1-1-duplicate-apps

- Check whether a similar app already exists in the App Store (see guidelines 2.1.1).
- If one exists: the developer should reach out to the existing developer first to cooperate or submit a PR. Submissions that resemble an existing app without explanation are rejected.
- Exception: a community app **and** a verified app for the same brand may coexist.

### App ID
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-1-app-name

- Must not contain "Athom" or "Homey". If so, reject.
- Apps approved in the past that contain either name are exempt (grandfathered).

### Account Name
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-13-account

- For Official-badge apps: the publishing account name must be the company name.

### App Name
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-1-app-name

- "Homey" and "Athom" in the app name is not allowed.
- Company names are not permitted; **brand names** are encouraged.
- Names of 5 or more words are not allowed. Exactly 4 words is at the limit and allowed.
- (Cross-reference: guidelines section 1.1.)

### SDK
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-14-sdk-version

- New apps **must** use SDK v3. Reject if SDK v2 or older.

### Platform
Guideline reference: https://apps.developer.homey.app/app-store/guidelines

- Usually local only.
- Official apps should ideally support both local and cloud (unless cloud is technically infeasible).
- Local = works on Homey Pro. Cloud = works on Homey Cloud.

### Readme (`README.txt` per locale)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-3-readme

The readme is a summary that describes and sells the app.

**Rejection triggers:**
- Changelog within the readme — **reject**
- Markdown syntax inside the readme — **reject**
- Description and readme are identical or near-identical — **reject**
- A donation link in the readme — **reject**
- Other URLs (these belong in app.json: bugs/support/homepage/source) — **reject**

### Description
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-2-description

Short subtitle shown above the readme in the App Store. Avoid repetition.

**Rejection triggers:**
- The app name **is** the description — **reject**
- Description identical to readme — **reject**
- Obvious filler like "Adds support for …" — **reject**

### Permissions
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-15-permissions

- If `manager:homey:api` is requested, the app must be a tool whose primary function justifies it. It is **not** needed to switch on a light bulb. Reject if usage doesn't justify the permission.

### URLs (in app.json)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-8-urls

- **Bugs URL**: if present, verify it works.
- **Homepage URL**: if present, must be a working URL.
- **Support URL**: if present, must be a working URL. **Mandatory** for Official apps.
- **Source URL**: if present, must be a working URL to the app source.
- **Community Topic ID**: if present, must be a working URL to a Homey Community Topic page.

### Icon
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-5-icons

- App icon is required.
- Icon should have a transparent background.
- The default rocket icon is **not allowed** — reject.
- App icon cannot be the same as a driver icon — reject.

### Images
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-4-images

- The app itself requires an image.
- Images must be clear, not pixelated, well-designed, and recognizable for the brand/app.
- White or transparent backgrounds are **not allowed**. Avoid white background with a black shape.
- The Homey name/logo inside the image is **not allowed**.

### Driver

#### Driver: Platform
Guideline reference: https://apps.developer.homey.app/app-store/guidelines

- Usually local. Official apps add cloud (unless infeasible).

#### Driver: Name
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-1-app-name

- Required. "Homey" in the driver name is not allowed.

#### Driver: Class
Guideline reference: https://apps.developer.homey.app/app-store/guidelines

- Type of driver (socket, sensor, button, etc.).

#### Driver: Capabilities
Guideline reference: https://apps.developer.homey.app/the-basics/devices/best-practices/battery-status

- The functions of the driver. Watch out for double UI capabilities such as:
  - `alarm_battery` AND `measure_battery` together (see https://apps.developer.homey.app/the-basics/devices/best-practices/battery-status)
  - `windowcoverings_state` AND `windowcoverings_set` together (see https://apps.developer.homey.app/the-basics/devices/best-practices/window-coverings)

#### Driver: Icon
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-5-icons

- Driver icon is required. Should resemble the driver and should have a transparent background.

#### Driver: Images
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-4-images

- Driver image is required. Should depict the device itself on a **white or transparent** background. Backgrounds that are neither white nor transparent (colored, photographic, scene-based) are not appropriate — flag as warning, not blocker.

### Flow conditions
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-9-flow-cards

- **Title**: required, must not be too long. "When", "And", "Then" must not appear in the title.
- **Formatted title**: must read as a short sentence with the arguments incorporated.
- **Hint**: explanation of what the Flow card does.
- **Arguments**: validate types and titles.

---

## 2. Checklist for EXISTING apps (UPDATE submissions)

Mainly check the **difference** between the current live version and the new submission. Quickly scan the rest to confirm overall standards are met.

### App Name (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-1-app-name

- Same rules as new apps: "Homey"/"Athom" not allowed, company names not permitted, brand names encouraged, 5+ words not allowed.

### Platform (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines

- Usually local only.
- If cloud is **newly added** to an existing app, the app has recently become Official — **the app must be tested** before approval.

### Readme (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-3-readme

Same rejection triggers as for new apps:
- Changelog in readme — **reject**
- Markdown syntax — **reject**
- Description and readme identical — **reject**
- Donation link — **reject**
- URLs that belong in app.json — **reject**

### Description (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-2-description

Same rejection triggers:
- App name **is** the description — **reject**
- Description identical to readme — **reject**
- Obvious "Adds support for …" filler — **reject**

### Permissions (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-15-permissions

- If a **new** permission has been added (especially `manager:homey:api`), verify with the developer why. Flag for follow-up rather than auto-reject.

### URLs in app.json (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-8-urls

- **Bugs URL**: if newly added, check it works.
- **Homepage URL**: if newly added, must work.
- **Support URL**: if newly added, must work. Mandatory for verified apps.
- **Source URL**: if newly added, must work.
- **Community Topic ID**: if newly added, must work.

### Icon (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-5-icons

- App icon is required.
- Icon should have a transparent background.
- Default rocket icon **not allowed** — reject.
- App icon cannot be the same as a driver icon — reject.

### Images (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-4-images

- Same rules as new apps: clear, not pixelated, recognizable, no white/transparent background, no Homey name/logo in the image.

### Driver (update)

#### Driver: Name (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-1-app-name

- Required. "Homey" not allowed in name.

#### Driver: Class (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines

- Type of driver.

#### Driver: Capabilities (update)
Guideline reference: https://apps.developer.homey.app/the-basics/devices/best-practices/battery-status

- The functions of the driver. Watch for double UI capabilities (see new-app section).

#### Driver: Icon (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-5-icons

- Required. Should resemble the driver and should have a transparent background.

#### Driver: Images (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-4-images

- Required. Should depict the device itself on a **white or transparent** background. Backgrounds that are neither white nor transparent (colored, photographic, scene-based) are not appropriate — flag as warning, not blocker.

### Flow conditions (update)
Guideline reference: https://apps.developer.homey.app/app-store/guidelines#1-9-flow-cards

- **Title**: required, not too long, no "When/And/Then".
- **Formatted title**: short sentence with arguments incorporated.
- **Hint**: explanation of what the Flow card does.

---

## How to apply this checklist in findings

- Every checklist-driven finding should set `guidelineRef` to `checklist:<key>` (e.g. `checklist:duplicate`, `checklist:driver-icon`, `checklist:readme`). That is the internal machine-readable tag.
- The developer-facing `explanation` **must include the URL from the matching rule's `Guideline reference:` line** — verbatim, one URL per finding, at a natural spot near the closing sentence. This lets the developer jump directly to the App Store Guidelines section that the rule enforces.
- "Reject" triggers in this checklist are **blocker** severity.
- "Should" / "avoid" wording produces **warning** severity. Do not upgrade these to blocker, even if the issue feels significant — the wording is chosen deliberately to signal that reviewers approve-with-feedback rather than reject.
- "Verify with developer" items (e.g. new permission) are **warning** severity that the human reviewer can escalate.
- Optional/best-practice items are **suggestion** severity.
