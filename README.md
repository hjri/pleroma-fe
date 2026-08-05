# Pleroma-FE

> Highly-customizable frontend designed for Pleroma.

![screenshot](./image-1.png)

[![Pipeline Status](https://ci.pleroma.com/api/badges/2/status.svg)](https://ci.pleroma.com/repos/2) [![Coverage](https://sonarqube.pleroma.dev/api/project_badges/measure?project=Pleroma-FE&metric=coverage&token=sqb_f8a5ec836caede0e2c6c62a9bfe66e62a89e2b01)](https://sonarqube.pleroma.dev/dashboard?id=Pleroma-FE) [![Maintainability Rating](https://sonarqube.pleroma.dev/api/project_badges/measure?project=Pleroma-FE&metric=software_quality_maintainability_rating&token=sqb_f8a5ec836caede0e2c6c62a9bfe66e62a89e2b01)](https://sonarqube.pleroma.dev/dashboard?id=Pleroma-FE) [![Reliability Rating](https://sonarqube.pleroma.dev/api/project_badges/measure?project=Pleroma-FE&metric=software_quality_reliability_rating&token=sqb_f8a5ec836caede0e2c6c62a9bfe66e62a89e2b01)](https://sonarqube.pleroma.dev/dashboard?id=Pleroma-FE) [![Security Rating](https://sonarqube.pleroma.dev/api/project_badges/measure?project=Pleroma-FE&metric=software_quality_security_rating&token=sqb_f8a5ec836caede0e2c6c62a9bfe66e62a89e2b01)](https://sonarqube.pleroma.dev/dashboard?id=Pleroma-FE)<a href="https://translate.pleroma.social/engage/pleroma/"><img src="https://translate.pleroma.social/widget/pleroma/pleroma-fe/svg-badge.svg" alt="Translation status"></a>

# For Translators

To translate Pleroma-FE, use our weblate server: https://translate.pleroma.social/. If you need to add your language it should be added as a json file in [src/i18n/](https://git.pleroma.social/pleroma/pleroma-fe/src/src/i18n/) folder and added in a list within [src/i18n/languages.js](https://git.pleroma.social/pleroma/pleroma-fe/src/src/i18n/languages.js).

Pleroma-FE will set your language by your browser locale, but you can change language in settings.

# For instance admins
You don't need to build Pleroma-FE yourself. Those using the Pleroma backend will be able to use it out of the box. Information of customizing PleromaFE settings/defaults is in our [guide](https://docs-develop.pleroma.social/frontend/CONFIGURATION/) and in case you want to build your own custom version there's [another](https://docs-develop.pleroma.social/frontend/HACKING/)

# Build Setup

``` bash
# install dependencies
npm install -g yarn
yarn

# serve with hot reload at localhost:8080
yarn dev

# build for production with minification
yarn build

# run unit tests
yarn unit
```

# For Contributors:

You can make local build proxy requests to specific instance with an environment variable `VITE_PROXY_TARGET`, generally it is a good idea to also set port for that specific proxy, if you intend on testing multiple instances, i.e.:

```bash
yarn && PORT=8080 VITE_PROXY_TARGET=https://coolinstance.tld yarn dev
```

You can create file `/config/local.json` (see [example](https://git.pleroma.social/pleroma/pleroma-fe/src/config/local.example.json)) to enable some convenience dev options:

* `staticConfigPreference`: makes FE's `/static/config.json` take preference of BE-served `/api/pleroma/frontend_configurations`. Only works in dev mode.

FE Build process also leaves current commit hash in global variable `___pleromafe_commit_hash` so that you can easily see which pleroma-fe commit instance is running, also helps pinpointing which commit was used when FE was bundled into BE.

# Configuration

Set configuration settings in AdminFE, additionally you can edit config.json. For more details see [documentation](https://docs-develop.pleroma.social/frontend/CONFIGURATION/).
