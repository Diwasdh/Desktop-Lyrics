import { execSync } from 'child_process';

if (process.platform === 'win32') {
  console.log('Compiling Windows Media Bridge...');
  try {
    execSync('powershell -ExecutionPolicy Bypass -File ./native/build-bridge.ps1', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to compile Windows bridge:', err);
    process.exit(1);
  }
} else {
  console.log(`Skipping Windows Media Bridge on ${process.platform}. (macOS uses native AppleScript/osascript)`);
}
