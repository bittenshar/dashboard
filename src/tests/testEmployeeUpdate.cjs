// Test employee update API
const http = require('http');

const testUpdateEmployee = async () => {
  console.log('✏️ Testing employee update...');
  
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
            
            // Get the list of employees to find one to update
            const getEmployeesOptions = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/admin/employees',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${loginResponse.token}`,
                'Content-Type': 'application/json'
              }
            };

            const getEmployeesReq = http.request(getEmployeesOptions, (getEmployeesRes) => {
              let getEmployeesBody = '';
              getEmployeesRes.on('data', (chunk) => getEmployeesBody += chunk);
              getEmployeesRes.on('end', () => {
                try {
                  const employeesResponse = JSON.parse(getEmployeesBody);
                  console.log('📋 Current employees:', employeesResponse.data.employees.length);
                  
                  if (employeesResponse.data.employees.length > 0) {
                    const employeeToUpdate = employeesResponse.data.employees[0]; // Get first employee
                    console.log('🎯 Updating employee:', employeeToUpdate.name, '(ID:', employeeToUpdate._id, ')');
                    
                    // Now update the employee
                    const updateData = JSON.stringify({
                      fullName: "Updated Employee Name",
                      email: employeeToUpdate.email, // Keep same email
                      phone: "+9876543210", // New phone
                      permissions: ["users", "events", "analytics", "reports"] // Updated permissions
                    });

                    const updateOptions = {
                      hostname: 'localhost',
                      port: 3000,
                      path: `/api/admin/employees/${employeeToUpdate._id}`,
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${loginResponse.token}`,
                        'Content-Type': 'application/json',
                        'Content-Length': updateData.length
                      }
                    };

                    const updateReq = http.request(updateOptions, (updateRes) => {
                      let updateBody = '';
                      updateRes.on('data', (chunk) => updateBody += chunk);
                      updateRes.on('end', () => {
                        console.log('Update Status:', updateRes.statusCode);
                        console.log('Update Response:', updateBody);
                        
                        try {
                          const updateResponse = JSON.parse(updateBody);
                          if (updateRes.statusCode === 200) {
                            console.log('✅ Employee update successful!');
                            console.log('Updated employee:', JSON.stringify(updateResponse.data.user, null, 2));
                          } else {
                            console.log('❌ Employee update failed');
                          }
                        } catch (e) {
                          console.log('Response not JSON:', updateBody);
                        }
                        resolve();
                      });
                    });

                    updateReq.on('error', (error) => {
                      console.error('❌ Update error:', error);
                      resolve();
                    });

                    updateReq.write(updateData);
                    updateReq.end();
                  } else {
                    console.log('⚠️ No employees found to update');
                    resolve();
                  }
                } catch (e) {
                  console.error('❌ Get employees parse error:', e);
                  resolve();
                }
              });
            });

            getEmployeesReq.on('error', (error) => {
              console.error('❌ Get employees error:', error);
              resolve();
            });

            getEmployeesReq.end();

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

testUpdateEmployee();
