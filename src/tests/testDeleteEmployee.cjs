// Test employee delete API
const http = require('http');

const testDeleteEmployee = async () => {
  console.log('🗑️ Testing employee delete...');
  
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
            
            // First, let's get all employees to see what IDs exist
            const getOptions = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/admin/employees',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${loginResponse.token}`
              }
            };

            const getReq = http.request(getOptions, (getRes) => {
              let getBody = '';
              getRes.on('data', (chunk) => getBody += chunk);
              getRes.on('end', () => {
                console.log('Get Employees Status:', getRes.statusCode);
                
                try {
                  const getResponse = JSON.parse(getBody);
                  console.log('Available employees:', getResponse.data.employees.map(emp => ({id: emp._id, name: emp.name})));
                  
                  // Now try to delete the first employee
                  if (getResponse.data.employees.length > 0) {
                    const employeeToDelete = getResponse.data.employees[0];
                    console.log(`Attempting to delete employee: ${employeeToDelete.name} (ID: ${employeeToDelete._id})`);
                    
                    const deleteOptions = {
                      hostname: 'localhost',
                      port: 3000,
                      path: `/api/admin/employees/${employeeToDelete._id}`,
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${loginResponse.token}`
                      }
                    };

                    const deleteReq = http.request(deleteOptions, (deleteRes) => {
                      let deleteBody = '';
                      deleteRes.on('data', (chunk) => deleteBody += chunk);
                      deleteRes.on('end', () => {
                        console.log('Delete Status:', deleteRes.statusCode);
                        console.log('Delete Response:', deleteBody);
                        
                        try {
                          const deleteResponse = JSON.parse(deleteBody);
                          if (deleteRes.statusCode === 200) {
                            console.log('✅ Employee deleted successfully!');
                          } else {
                            console.log('❌ Employee deletion failed');
                          }
                        } catch (e) {
                          console.log('Delete response not JSON:', deleteBody);
                        }
                        resolve();
                      });
                    });

                    deleteReq.on('error', (error) => {
                      console.error('❌ Delete error:', error);
                      resolve();
                    });

                    deleteReq.end();
                  } else {
                    console.log('No employees found to delete');
                    resolve();
                  }
                } catch (e) {
                  console.log('Get response not JSON:', getBody);
                  resolve();
                }
              });
            });

            getReq.on('error', (error) => {
              console.error('❌ Get employees error:', error);
              resolve();
            });

            getReq.end();

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

testDeleteEmployee();
