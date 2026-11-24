import base from './playwright.config.mjs';
export default {...base,testDir:'tests/emulator-browser',timeout:60000,reporter:[['list'],['html',{outputFolder:'emulator-browser-report',open:'never'}]]};
