'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'generated_locales'); // Directory where you want to save the translations
const ASSETS_PATH = path.join(ROOT_DIR, 'assets'); // Path to the assets directory

// Loop through all input files
const availableLocales = fs.readdirSync(OUTPUT_DIR).map(outputFile => {
  return outputFile.split('.')[0];
});

// Function to recursively traverse the JSON object and extract translations
function extractTranslations(
  sourceFilePath,
  obj,
  currentPath = '',
  translations = {},
) {
  Object.entries(obj).forEach(([key, value]) => {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      extractTranslations(sourceFilePath, value, newPath, translations);
    } else {
      // Assuming every leaf node is a translation
      const pathParts = newPath.split('.');
      const locale = pathParts.pop(); // Assuming the last part of the path is the locale
      if (availableLocales.includes(locale)) {
        // Only extract translations for the specified locales
        const translationPath = pathParts.join('.');
        if (!translations[locale]) translations[locale] = {};
        const relativeSourceFilePath = sourceFilePath.replace(ROOT_DIR, '.');
        translations[locale][`${relativeSourceFilePath}@${translationPath}`] = value;
      }
    }
  });
  return translations;
}

// Function to write translations to separate files
function writeTranslations(translations, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  Object.entries(translations).forEach(([locale, translationObj]) => {
    if (availableLocales.includes(locale)) {
      // Only write translations for the specified locales
      const filePath = path.join(outputDir, `${locale}.json`);
      // Append to JSON file
      let existingTranslations = {
        __comment: 'This file is generated. Do not edit it directly.',
      };
      if (fs.existsSync(filePath)) {
        existingTranslations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      translationObj = { ...existingTranslations, ...translationObj };
      fs.writeFileSync(filePath, JSON.stringify(translationObj, null, 2));
    }
  });
}

console.log(
  `Generating locales (${availableLocales.map(x => x.toUpperCase())}) in ${OUTPUT_DIR}...`,
);

// Remove all files in the output directory
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmdirSync(OUTPUT_DIR, { recursive: true });
}

// Parse permissions.json
const sourceFilePath = path.join(ASSETS_PATH, 'app', 'permissions.json');
const sourceContent = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
const translations = extractTranslations(sourceFilePath, sourceContent);
writeTranslations(translations, OUTPUT_DIR);

// Parse capabilities
const sourceDirCapabilities = path.join(
  ASSETS_PATH,
  'capability',
  'capabilities',
);
const capabilitiesFiles = fs.readdirSync(sourceDirCapabilities);
capabilitiesFiles.forEach(file => {
  const sourceFilePath = path.join(sourceDirCapabilities, file);
  const sourceContent = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
  const translations = extractTranslations(sourceFilePath, sourceContent);
  writeTranslations(translations, OUTPUT_DIR);
});

// Parse device classes
const sourceDirDeviceClasses = path.join(ASSETS_PATH, 'device', 'classes');
const deviceClassesFiles = fs.readdirSync(sourceDirDeviceClasses);
deviceClassesFiles.forEach(file => {
  const sourceFilePath = path.join(sourceDirDeviceClasses, file);
  const sourceContent = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
  const translations = extractTranslations(sourceFilePath, sourceContent);
  writeTranslations(translations, OUTPUT_DIR);
});

console.log('Done generating locales.');
