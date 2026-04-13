const API_URL = 'http://localhost:3000/api';

async function testOtp() {
  console.log("1. Registering admin with phone...");
  let res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin2', password: 'password123', role: 'ADMIN', phoneNumber: '1234567890' })
  });
  console.log("Register admin:", await res.json());

  console.log("2. Sending OTP...");
  res = await fetch(`${API_URL}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '1234567890' })
  });
  const otpRes = await res.json();
  console.log("Send OTP:", otpRes);

  console.log("3. Verifying OTP...");
  res = await fetch(`${API_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '1234567890', otp: otpRes.mockedOtp })
  });
  console.log("Verify OTP:", await res.json());
}
testOtp();
