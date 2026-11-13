/**
 * Prints a scrypt hash for AUTH_PASSWORD_HASH. The plain password is never stored anywhere.
 *
 *   pnpm --filter @salary/api auth:hash-password            # prompts (input hidden)
 *   pnpm --filter @salary/api auth:hash-password 'secret'   # non-interactive
 */
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { hashPassword } from '../modules/auth/password.js';

const MIN_LENGTH = 12;

async function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const answer = rl.question(question);
  muted = true;
  const password = await answer;
  rl.close();
  process.stdout.write('\n');
  return password;
}

const password = process.argv[2] ?? (await promptHidden('Password: '));

if (password.length < MIN_LENGTH) {
  console.error(`Use at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}

console.log(await hashPassword(password));
