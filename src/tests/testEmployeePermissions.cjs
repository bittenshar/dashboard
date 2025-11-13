// Test employee permission update API
const http = require('http');

const testUpdateEmployeePermissions = async () => {
  console.log('🔧 Testing employee permission update...');
  
  // First, login to get admin token
  const loginData = JSON.stringify({
    email: 'admin@thrillathon.com',
    password: 'admin123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  return new Promise((resolve, reject) => {
    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginBody = '';
      loginRes.on('data', (chunk) => loginBody += chunk);
      loginRes.on('end', async () => {
        try {
          const loginResponse = JSON.parse(loginBody);
          if (loginResponse.status === 'success' && loginResponse.token) {
            console.log('✅ Login successful');
            
            // Now test permission update
            const permissionData = JSON.stringify({
              userId: "688749db0a0b4b242f2f1698", // Employee ID from our previous test
              permissions: ["users", "events", "analytics"] // Updated permissions
            });

            const permissionOptions = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/admin/employees/permissions',
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginResponse.token}`,
                'Content-Length': permissionData.length
              }
            };

            const permissionReq = http.request(permissionOptions, (permissionRes) => {
              let permissionBody = '';
              permissionRes.on('data', (chunk) => permissionBody += chunk);
              permissionRes.on('end', () => {
                console.log('Permission Update Status:', permissionRes.statusCode);
                console.log('Permission Update Response:', permissionBody);
                
                try {
                  const permissionResponse = JSON.parse(permissionBody);
                  if (permissionRes.statusCode === 200) {
                    console.log('✅ Permission update successful!');
                    console.log('Updated user:', JSON.stringify(permissionResponse.data.user, null, 2));
                  } else {
                    console.log('❌ Permission update failed');
                  }
                } catch (e) {
                  console.log('Response not JSON:', permissionBody);
                }
                resolve();
              });
            });

            permissionReq.on('error', (error) => {
              console.error('❌ Permission update error:', error);
              resolve();
            });

            permissionReq.write(permissionData);
            permissionReq.end();

          } else {
            console.log('❌ Login failed:', loginResponse);
            resolve();
          }
        } catch (e) {
          console.error('❌ Login parse error:', e);
          resolve();
        }
      });
    });

    loginReq.on('error', (error) => {
      console.error('❌ Login error:', error);
      resolve();
    });

    loginReq.write(loginData);
    loginReq.end();
  });
};

testUpdateEmployeePermissions();
