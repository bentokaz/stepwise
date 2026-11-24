// Builds the site and publishes dist/ to the gh-pages branch, which GitHub Pages serves.
// Usage: npm run deploy
import { execFileSync, execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
const npm = (script) => execSync(`npm ${script}`, { stdio: 'inherit' }); // a string command works on Windows, where npm is npm.cmd
const out = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const remote = out(['remote', 'get-url', 'origin']);
const name = out(['config', 'user.name']);
const email = out(['config', 'user.email']);
const sha = out(['rev-parse', '--short', 'HEAD']);

npm('test');
npm('run build');

writeFileSync('dist/.nojekyll', ''); // serve files as-is
rmSync('dist/.git', { recursive: true, force: true });
const git = (...args) => run('git', ['-c', `user.name=${name}`, '-c', `user.email=${email}`, ...args], 'dist');
git('init', '-q', '-b', 'gh-pages');
git('add', '-A');
git('commit', '-q', '-m', `Deploy ${sha}`);
git('push', '-q', '--force', remote, 'gh-pages');
rmSync('dist/.git', { recursive: true, force: true });
console.log('\nDeployed. GitHub Pages usually updates within a minute.');
