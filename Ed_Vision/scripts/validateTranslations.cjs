/**
 * Translation Validation Script
 * 
 * Kiểm tra tính toàn vẹn của translation files
 * 
 * Usage: node scripts/validateTranslations.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const LANGUAGES = ['en', 'vi'];
const NAMESPACES = ['common', 'parent', 'student', 'teacher', 'admin'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log(` Error loading ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function validateTranslations() {
  log('\n Validating translations...', 'blue');
  log('='.repeat(50), 'blue');

  let hasErrors = false;

  for (const namespace of NAMESPACES) {
    log(`\n Checking namespace: ${namespace}`, 'yellow');

    const translations = {};
    
    // Load all language files for this namespace
    for (const lang of LANGUAGES) {
      const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
      
      if (!fs.existsSync(filePath)) {
        log(`   Missing file: ${lang}/${namespace}.json`, 'red');
        hasErrors = true;
        continue;
      }

      const data = loadJSON(filePath);
      if (!data) {
        hasErrors = true;
        continue;
      }

      translations[lang] = {
        data,
        keys: getAllKeys(data),
      };
      
      log(`   Loaded ${lang}/${namespace}.json (${translations[lang].keys.length} keys)`, 'green');
    }

    // Check if all languages have the same keys
    if (Object.keys(translations).length === LANGUAGES.length) {
      const baseKeys = translations[LANGUAGES[0]].keys.sort();
      
      for (let i = 1; i < LANGUAGES.length; i++) {
        const lang = LANGUAGES[i];
        const langKeys = translations[lang].keys.sort();
        
        // Find missing keys
        const missingKeys = baseKeys.filter(key => !langKeys.includes(key));
        const extraKeys = langKeys.filter(key => !baseKeys.includes(key));
        
        if (missingKeys.length > 0) {
          log(`   Missing keys in ${lang}:`, 'red');
          missingKeys.forEach(key => log(`     - ${key}`, 'red'));
          hasErrors = true;
        }
        
        if (extraKeys.length > 0) {
          log(`    Extra keys in ${lang}:`, 'yellow');
          extraKeys.forEach(key => log(`     - ${key}`, 'yellow'));
        }
        
        if (missingKeys.length === 0 && extraKeys.length === 0) {
          log(`   ${lang} keys match ${LANGUAGES[0]}`, 'green');
        }
      }
    }
  }

  log('\n' + '='.repeat(50), 'blue');
  if (hasErrors) {
    log(' Validation failed! Please fix the errors above.', 'red');
    process.exit(1);
  } else {
    log(' All translations are valid!', 'green');
  }
}

function generateStats() {
  log('\n Translation Statistics', 'blue');
  log('='.repeat(50), 'blue');

  const stats = {
    total: 0,
    byNamespace: {},
  };

  for (const namespace of NAMESPACES) {
    const filePath = path.join(LOCALES_DIR, 'en', `${namespace}.json`);
    if (fs.existsSync(filePath)) {
      const data = loadJSON(filePath);
      if (data) {
        const keys = getAllKeys(data);
        stats.byNamespace[namespace] = keys.length;
        stats.total += keys.length;
      }
    }
  }

  log(`\nTotal translation keys: ${stats.total}`, 'green');
  log('\nBreakdown by namespace:', 'yellow');
  for (const [namespace, count] of Object.entries(stats.byNamespace)) {
    log(`  ${namespace}: ${count} keys`, 'blue');
  }
}

// Run validation
validateTranslations();
generateStats();

log('\n Done!\n', 'green');
