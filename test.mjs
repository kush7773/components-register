const API = 'http://localhost:3000/api';

async function test() {
  console.log('=== EMAIL OTP E2E TEST ===\n');

  // 1. Register admin with email
  console.log('1. Register admin...');
  let res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123', role: 'ADMIN', email: 'admin@robomanthan.com' }),
  });
  let data = await res.json();
  console.log('   =>', data.success ? `✅ userId=${data.userId}` : `❌ ${data.error}`);

  // 2. Register employee with email
  console.log('2. Register employee...');
  res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'john', password: 'john123', role: 'EMPLOYEE', email: 'john@robomanthan.com' }),
  });
  data = await res.json();
  console.log('   =>', data.success ? `✅ userId=${data.userId}` : `❌ ${data.error}`);

  // 3. Login admin to add components
  console.log('3. Login admin...');
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  data = await res.json();
  const adminCookie = res.headers.get('set-cookie');
  console.log('   =>', data.success ? `✅ role=${data.role}` : `❌ ${data.error}`);

  // 4. Add components
  console.log('4. Add components...');
  res = await fetch(`${API}/components`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ name: 'Arduino Uno R3', description: 'Microcontroller board', totalQuantity: 20 }),
  });
  data = await res.json();
  console.log('   =>', data.component ? '✅ Arduino added' : `❌ ${data.error}`);

  res = await fetch(`${API}/components`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ name: 'Servo Motor SG90', description: '9g micro servo', totalQuantity: 15 }),
  });
  console.log('   =>', (await res.json()).component ? '✅ Servo added' : '❌');

  // 5. Send Email OTP (mock mode since no Resend key)
  console.log('5. Send Email OTP...');
  res = await fetch(`${API}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john@robomanthan.com' }),
  });
  data = await res.json();
  console.log('   =>', data.success ? `✅ ${data.message}${data.mockedOtp ? ` OTP=${data.mockedOtp}` : ''}` : `❌ ${data.error}`);
  const theOtp = data.mockedOtp;

  // 6. Verify OTP
  console.log('6. Verify Email OTP...');
  res = await fetch(`${API}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john@robomanthan.com', otp: theOtp }),
  });
  data = await res.json();
  console.log('   =>', data.success ? `✅ role=${data.role}` : `❌ ${data.error}`);

  // 7. Profile with email
  const empCookie = res.headers.get('set-cookie');
  console.log('7. Fetch profile...');
  res = await fetch(`${API}/users/profile`, { headers: { Cookie: empCookie } });
  data = await res.json();
  console.log('   =>', data.user ? `✅ ${data.user.username} email=${data.user.email}` : `❌ ${data.error}`);

  // 8. Test invalid email OTP
  console.log('8. Send OTP to unknown email...');
  res = await fetch(`${API}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@test.com' }),
  });
  data = await res.json();
  console.log('   =>', !data.success ? `✅ Correctly rejected: ${data.error}` : '❌ Should have failed');

  console.log('\n=== ALL TESTS COMPLETE ===');
}

test().catch(console.error);
