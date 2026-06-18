const API_BASE = 'http://localhost:3001/api';

async function testLogin(username, password) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Login successful for ${username}`);
      console.log('   Token:', data.token?.substring(0, 20) + '...');
      console.log('   User:', data.user);
      return data;
    } else {
      console.error(`❌ Login failed for ${username}:`, data.error || data.message || res.status);
      return null;
    }
  } catch (err) {
    console.error(`❌ Login error for ${username}:`, err.message);
    return null;
  }
}

// Test admin
testLogin('admin', 'admin123');
// Test supervisor
testLogin('supervisor', 'supervisor123');
// Test wrong password
testLogin('admin', 'wrong');
// Test non-existing user
testLogin('nonexistent', 'test');
