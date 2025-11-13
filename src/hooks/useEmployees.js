import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Load employees from backend
  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllEmployees();
      if (response.status === 'success') {
        setEmployees(response.data.employees || []);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError(err.message);
      // Fallback to localStorage if backend fails
      const savedEmployees = localStorage.getItem('employees');
      if (savedEmployees) {
        try {
          setEmployees(JSON.parse(savedEmployees));
        } catch (parseError) {
          console.error('Error parsing localStorage employees:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new employee
  const createEmployee = async (employeeData) => {
    setLoading(true);
    try {
      const response = await adminService.createEmployee(employeeData);
      if (response.status === 'success') {
        // Convert backend response to frontend format
        const newEmployee = {
          id: response.data.user._id || response.data.user.userId,
          name: response.data.user.name,
          email: response.data.user.email,
          role: 'Employee',
          permissions: response.data.user.permissions || [],
          createdAt: response.data.user.createdAt || new Date().toISOString(),
        };
        
        const updatedEmployees = [...employees, newEmployee];
        setEmployees(updatedEmployees);
        
        // Also save to localStorage as backup
        localStorage.setItem('employees', JSON.stringify(updatedEmployees));
        
        toast({
          title: "Employee Created",
          description: `${employeeData.name} has been added successfully.`,
        });
        
        return { success: true, employee: newEmployee };
      }
    } catch (err) {
      console.error('Failed to create employee:', err);
      setError(err.message);
      
      toast({
        title: "Error",
        description: err.message || "Failed to create employee. Please try again.",
        variant: "destructive"
      });
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete employee
  const deleteEmployee = async (employeeId) => {
    setLoading(true);
    try {
      await adminService.deleteEmployee(employeeId);
      
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      setEmployees(updatedEmployees);
      
      // Update localStorage
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      
      toast({
        title: "Employee Deleted",
        description: "Employee has been removed successfully.",
      });
      
      return { success: true };
    } catch (err) {
      console.error('Failed to delete employee:', err);
      setError(err.message);
      
      toast({
        title: "Error",
        description: err.message || "Failed to delete employee. Please try again.",
        variant: "destructive"
      });
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update employee permissions
  const updateEmployeePermissions = async (employeeId, permissions) => {
    setLoading(true);
    try {
      // Find employee to get their userId (backend expects userId, not id)
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      await adminService.updateEmployeePermissions(employee.id, permissions);
      
      const updatedEmployees = employees.map(emp => 
        emp.id === employeeId ? { ...emp, permissions } : emp
      );
      setEmployees(updatedEmployees);
      
      // Update localStorage
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      
      toast({
        title: "Permissions Updated",
        description: "Employee permissions have been updated successfully.",
      });
      
      return { success: true };
    } catch (err) {
      console.error('Failed to update employee permissions:', err);
      setError(err.message);
      
      toast({
        title: "Error",
        description: err.message || "Failed to update permissions. Please try again.",
        variant: "destructive"
      });
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    loadEmployees,
    createEmployee,
    deleteEmployee,
    updateEmployeePermissions
  };
};
