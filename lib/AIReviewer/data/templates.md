# Homey App Store Feedback Message Templates

> Canonical source: the "Feedback Templates" section of the internal Google Doc
> "Checklist for App Review". Keep this file in sync with the source doc.
>
> These are the exact messages the Homey review team sends to developers when
> approving-with-feedback or rejecting an app. They define the tone-of-voice,
> phrasing, and level of detail the team expects.
>
> **How the AI reviewer must use these templates:**
>
> - When a finding matches one of the templated categories, use the template as
>   the base of the `explanation`. Preserve the sentence structure and phrasing.
> - Replace every `[PLACEHOLDER]` with a concrete, app-specific value —
>   the real app name, real driver id, real observed text, real language, etc.
>   Never leave a `[PLACEHOLDER]` in the output.
> - Keep the App Store Guidelines URL that the template links to.
> - When no template matches exactly, write in the same tone: opening sentence
>   stating what is in the app, one polite "please" imperative, closing
>   sentence linking to the relevant App Store Guidelines section.
> - Never invent your own tone. Match a template or match the template pattern.

---

## Permissions

- Your app uses the `homey.manager.api`, could you clarify why your app uses this permission?

## Duplicate apps

- After reviewing your submission, we have found that your app is similar to an already existing app, namely [EXISTING APP NAME] by [EXISTING DEVELOPER NAME] (https://homey.app/a/[APP ID]). Ideally we would like to see one app per [brand/concept] in the App Store, as this makes it clear and easy for end-users.

  We noticed that your app [LIST A DIFFERENCE]. It would be great if this could be integrated with the existing [EXISTING APP NAME] app, so all features and functions are available within one app. Therefore we would like to encourage you to reach out to [EXISTING DEVELOPER NAME] and collaborate, or submit a Pull Request to their repository.

  If you have already tried to collaborate with [EXISTING DEVELOPER NAME] and were unable to reach an agreement, or if you feel a separate app is absolutely necessary, please resubmit and clarify your reasoning. We are happy to discuss this further and see how we can move forward.

  If you need any help getting in touch with [EXISTING DEVELOPER NAME], please do not hesitate to reach out.

## App ID

- Your app's ID contains the name Athom/Homey, this is not allowed. Please adjust your app ID.

## App name

- Your app's name contains the company/brand name Athom/Homey, please change your app's name. An app's name should be easy to remember and hint to what your app does.
- Your app's name [LIST MISTAKE], please change your app's name. An app's name should be easy to remember and hint to what your app does. For more information on this topic have a look at our App Store Guidelines section 1.1. App Name: https://apps.developer.homey.app/app-store/guidelines#1-1-app-name

## Readme

- Your app's readme contains an unclear description of your app. Please add more information for your users so they know what your app can do for them. Keep it short and simple, preferably one or two paragraphs. Check out our App Store Guidelines for more information on this topic: https://apps.developer.homey.app/app-store/guidelines#1-3-readme
- Your app's readme starts with the app name as a title. Please remove the title from the readme. The name of your app will be shown at the top of your App Store page.
- Your app's readme starts with a header that contains the same text as in your Description. Please remove this from the readme or change the Description field. The Description will be shown above your readme in the App Store, therefore repetition should be avoided.
- Your app's readme contains a list of all the Flow options. Please delete this from the readme. The available Flow cards will be visible on your app page in the new section Flow Cards.
- Your app's readme contains a lot of technical information and is too long. The readme is meant to provide a short summary of the app's features and its purpose. Ideally the text is around 1 to 2 paragraphs. If you wish to provide additional information consider creating a Homey Community topic to which you can link in the App Manifest. For more information check out the App Store Guidelines section 1.3. Readme: https://apps.developer.homey.app/app-store/guidelines#1-3-readme
- Your app's readme contains a donation URL, this is not allowed. Please remove this URL from the readme. You can add a donation button to the app.json which will appear as a clickable button on your App Store page.
- In your app's readme there is a lot of white spacing between sentences/paragraphs. Please remove the extra white spacing, stick to a single white space per paragraph. This will make it easier to read for the user.
- Your app's readme seems to be in [LANGUAGE]. Please use English language in your main `readme.txt` and add a translated file `readme.[LANGUAGECODE].txt` to add [LANGUAGE] translations to your app. For more information have a look at our documentation: https://apps.developer.homey.app/the-basics/app/internationalization
- Your app's readme currently contains setup instructions. These are not needed in the readme, as the pairing views within the app should be clear enough to guide users through the setup process. The readme should be a short, engaging summary of the app's purpose in one to two plain text paragraphs. Check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-3-readme

## Description

- The text in your app's Description property (`app.json`) is not up to our standards, it's identical to your `readme.txt`. The description is shown above your readme in the App Store, therefore repetition should be avoided. Please sell your app in one short sentence, think of it as the slogan or tagline of your app. Check out our App Store Guidelines for more information on this topic: https://apps.developer.homey.app/app-store/guidelines#1-2-description
- The text in your app's Description property (`app.json`) is identical to your app's name. Please use the description property to describe your app's purpose in one short sentence. For example "[GIVE EXAMPLE]". Check out our Guidelines for more information on this topic: https://apps.developer.homey.app/app-store/guidelines#1-2-description
- The text in your app's Description property (`app.json`) is not up to our standards. Please sell your app's purpose in one short sentence. Apps for a specific brand often use the brand slogan or tagline as the Description. Check out our App Store Guidelines for more information on this topic: https://apps.developer.homey.app/app-store/guidelines#1-2-description
- Your app's Description (`app.json`) is not up to our standards, avoid descriptions such as: "Adds support for [XXXXX]". Please sell your app in one short sentence, think of it as the slogan or tagline of your app. Check out our App Store Guidelines for more information on this topic: https://apps.developer.homey.app/app-store/guidelines#1-2-description

## URLs

- The [TYPE] URL you specified is not working. Please enter a valid URL.
- Please provide a support URL or e-mail address in the `homeycompose/app.json`. For more information view the App Manifest section of the Developer Documentation: https://apps.developer.homey.app/the-basics/app/manifest

## App icons

- Your app does not have an icon. Please add an icon that represents your app. For more information and help on this topic check out our App Store Guidelines: https://apps.developer.homey.app/app-store/guidelines#1-5-icons
- The app icon is [LIST WHAT IS WRONG]. Please add an icon that represents your app; in case of a brand app consider using the logo for the icon. For more information and examples check out our App Store Guidelines: https://apps.developer.homey.app/app-store/guidelines#1-5-icons
- The app icon is an image rather than an icon. This makes it appear as a solid shape and is therefore not recognizable. Please add an icon that represents your app; in case of a brand app consider using the logo for the icon. For more information and examples check out our App Store Guidelines: https://apps.developer.homey.app/app-store/guidelines#1-5-icons

## Driver icons

- Some of your app's driver icons are identical to the app icon. Please make sure each driver has its own icon so users can easily recognize the driver they need. For more information and help on this topic check out our App Store Guidelines: https://apps.developer.homey.app/app-store/guidelines#1-5-icons
- The driver icons do not meet our design standards. [LIST WHAT IS WRONG] Have a look at our App Store Guidelines section 1.5.2 Driver icons for more information and examples: https://apps.developer.homey.app/app-store/guidelines#1-5-icons Consider putting in a request for custom icons on the Homey Vector page.

## Images

- Your app's images contain the Homey logo; this is not allowed. Please make sure your images are visually appealing and represent your app. Check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-4-images
- Your app's images are mainly white with a black shape, unfortunately this won't look appealing in the Homey App Store. Please make sure your images are visually appealing and represent your app; consider using images similar to those used on the [BRAND NAME] website. Check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-4-images
- Your app image is an image of the brand logo, this is not up to our standards. Please have a look at our App Store Guidelines and adjust the image accordingly: https://apps.developer.homey.app/app-store/guidelines#1-4-images
- Your driver images are identical to your app's image. Please provide a unique driver image that depicts the device or service it supports on a white background. Check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-4-images
- Your driver image shows the driver icon. Please provide a unique driver image that depicts the device it supports on a white background. Check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-4-images
- Your driver image does not have a white or transparent background. Please provide a unique driver image that depicts the device or service it supports on a white background. Check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-4-images

## Flow

- Some of the Flow card titles could be improved. Keep them simple and to the point without making them too technical, for example: [FLOW TITLE] should be [IMPROVED TITLE]. In case you want to add more information about a Flow card's function, use the Hint field.
- The formatted titles of your Flow cards can be improved; make sure the arguments are integrated in the formulation of the title. For example: [FLOW TITLE] should be [IMPROVED TITLE].
- The Flow card titles start with When, And or Then; this is not allowed. Please remove this from the title.
- The Flow cards are missing the formatted titles. Please make sure to add formatted titles to your Flow cards.
- Some of your app's Flow card titles contain spelling errors. Please adjust the spelling for the following Flow cards: [LIST FLOW CARDS].
- Several Flow cards are duplicates. Since the system capability `[CAPABILITY]` has been used, Homey will automatically generate standard Flow cards. Please remove the additional custom flow cards [LIST].

## Widget previews

- Your Widget preview seems to be a screenshot of the Widget. This is not allowed. Please check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-10-widget-previews
- Your Widget preview contains text. This is not allowed. Please check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-10-widget-previews
- The Widget preview for all widgets seems to be identical. Please make sure each preview represents the widget itself. Please check out our App Store Guidelines for more information: https://apps.developer.homey.app/app-store/guidelines#1-10-widget-previews
- The Widget preview seems to be missing or empty. A widget preview is required. Please check out our App Store Guidelines for more information and add them to your app: https://apps.developer.homey.app/app-store/guidelines#1-10-widget-previews

## Other

- It seems that users need to manually enter their IP address in your app. This is no longer allowed. Please use the `ManagerDiscovery` to make it easy for your users to pair their devices. Check out the Developer Documentation for more information: https://apps.developer.homey.app/wireless/wi-fi/discovery
- Device [NAME] uses both the `alarm_battery` and `measure_battery` capability; this is not allowed. This will result in a double UI component. Please only use one of the two capabilities: https://apps.developer.homey.app/the-basics/devices/best-practices/battery-status
- Device [NAME] uses both the `windowcoverings_state` and `windowcoverings_set` capability; this is not allowed. This will result in a double UI component. Please only use one of the two capabilities: https://apps.developer.homey.app/the-basics/devices/best-practices/window-coverings

## No reply follow-up

- Since we did not receive an answer to our earlier question we have decided to reject your submission for now. However, you can resubmit the app for a new review any time. If you do, please be sure to include a short explanation addressing the earlier points raised in our earlier message.
