import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
const java=process.env.KINARC_JAVA_HOME||'/opt/homebrew/opt/openjdk@21';
const env={...process.env};if(existsSync(java+'/bin/java')){env.JAVA_HOME=java;env.PATH=java+'/bin:'+process.env.PATH}
const command=process.argv.includes('--test')?['emulators:exec','--only','auth,firestore','--project','demo-kinarc','node --test tests/emulator/*.mjs && node node_modules/@playwright/test/cli.js test --config=playwright.emulator.config.mjs']:['emulators:start','--only','auth,firestore','--project','demo-kinarc'];
const child=spawn(process.execPath,['node_modules/firebase-tools/lib/bin/firebase.js',...command],{stdio:'inherit',env});child.on('exit',code=>process.exit(code||0));
