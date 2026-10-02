import bcrypt from 'bcryptjs';
// Read from stdin to avoid putting credentials in process arguments or shell history.
let value = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (value += chunk));
process.stdin.on('end', async () => {
  const password = value.trimEnd();
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72)
    throw new Error('Use at least 12 characters and at most 72 UTF-8 bytes');
  console.log(await bcrypt.hash(password, 12));
});
