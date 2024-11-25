# Homey Library

[![Deploy](https://github.com/athombv/node-homey-lib/actions/workflows/deploy.yml/badge.svg)](https://github.com/athombv/node-homey-lib/actions/workflows/deploy.yml)
[![Test](https://github.com/athombv/node-homey-lib/actions/workflows/test.yml/badge.svg)](https://github.com/athombv/node-homey-lib/actions/workflows/test.yml)

This library contains shared code between Homey, Homey Apps, Athom CLI, Athom Developer and others.

This library can, among other things:

- Validate a Homey App
- Validate a Capability
- Validate a Signal
- Return supported device classes
- Return supported device capabilities
- Return supported media codecs
- Return supported app permissions
- Return supported app store categories

See `/examples/` for how-to usage.

## Translations

This library contains translations in the following files:

- `./assets/app/permissions.json`
- `./assets/capability/capabilities/<capability_id>.json`
- `./assets/device/classes/<device_class_id>.json`

These files are automatically parsed to language specific locale files in `./generated_locales`. The generated locales should not be edited manually, always edit the original files as listed above. Commits to master or develop with changes to the files above will trigger a [GitHub Action](.github/workflows/generate_locales.yml) that [re-generates](scripts/generate-locale-files.js) the locales and commits the result. Incoming PRs with changes to `./generated_locales` will trigger a [GitHub Action](.github/workflows/apply_locales.yml) that [applies](scripts/apply-locale-files.js) the updated generated locales to the files listed above.

> Note: when adding new languages to the files listed above, make sure to add the `./generated_locales/<new_language_code>.json` file manually so that the [script that generates the locales](scripts/generate-locale-files.js) will pick it up.
