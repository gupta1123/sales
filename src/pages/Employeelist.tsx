import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AddTeam from './AddTeam';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import "./Employeelist.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/router';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentName: string;
  userName: string;
  password: string;
  primaryContact: string;
  dateOfJoining: string;
  name: string;
  department: string;
  actions: string;
  city: string;
  state: string;
  userDto: {
    username: string;
    password: string | null;
    roles: string | null;
    employeeId: number | null;
    firstName: string | null;
    lastName: string | null;
  };
}

interface TeamData {
  id: number;
  office: {
    id: number;
    firstName: string;
    lastName: string;
  };
  fieldOfficers: User[];
}

interface OfficeManager {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  email: string;
  deleted?: boolean;
  role?: string;
}

const EmployeeList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [officeManager, setOfficeManager] = useState<OfficeManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState(['name', 'email', 'city', 'state', 'role', 'department', 'userName', 'dateOfJoining', 'primaryContact', 'actions']);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof User>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [assignCityUserId, setAssignCityUserId] = useState<number | null>(null);
  const [assignCityUserName, setAssignCityUserName] = useState<string>("");
  const [city, setCity] = useState("");
  const [assignedCity, setAssignedCity] = useState<string | null>(null); // New state for assigned city
  const [isAssignCityModalOpen, setIsAssignCityModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cities, setCities] = useState<string[]>([]); // New state for cities
  const [assignedCities, setAssignedCities] = useState<string[]>([]); // New state for assigned cities

  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const employeeId = useSelector((state: RootState) => state.auth.employeeId);
  const officeManagerId = useSelector((state: RootState) => state.auth.officeManagerId);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token, role, employeeId]);

  useEffect(() => {
    if (token && role === 'MANAGER' && officeManagerId) {
      fetchOfficeManager();
    }
  }, [token, role, officeManagerId]);

  useEffect(() => {
    if (isAssignCityModalOpen) {
      fetchCities();
    }
  }, [isAssignCityModalOpen]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (role === 'MANAGER') {
        const teamResponse = await axios.get(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/getbyEmployee?id=${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!teamResponse.data || teamResponse.data.length === 0) {
          throw new Error('No team data found for the manager');
        }

        const teamData: TeamData = teamResponse.data[0];
        setTeamData(teamData);


        setUsers(teamData.fieldOfficers.map((user: User) => ({ ...user, userName: user.userDto?.username || "" })));
      } else {
        const response = await axios.get('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data) {
          throw new Error('No data received when fetching all employees');
        }

        setUsers(response.data.map((user: User) => ({ ...user, userName: user.userDto?.username || "" })));
        setAssignedCities(response.data.filter((user: User) => user.city).map((user: User) => user.city));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfficeManager = async () => {
    try {
      const response = await axios.get(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/get?id=${officeManagerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOfficeManager(response.data);
    } catch (error) {
      console.error('Error fetching Office Manager:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getCities', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleResetPassword = (userId: number | string) => {
    setResetPasswordUserId(userId);
    setIsResetPasswordOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match!",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.put(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/user/manage/resetPassword?id=${resetPasswordUserId}`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Password reset successfully",
        });
        setIsResetPasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: "Error",
          description: `Failed to reset password: ${response.data}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while resetting the password",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingEmployee({ ...user, name: `${user.firstName} ${user.lastName}` });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingEmployee) {
      try {
        const response = await axios.put(
          `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/edit?empId=${editingEmployee.id}`,
          {
            firstName: editingEmployee.firstName,
            lastName: editingEmployee.lastName,
            email: editingEmployee.email,
            role: editingEmployee.role,
            departmentName: editingEmployee.departmentName,
            userName: editingEmployee.userName,
            primaryContact: editingEmployee.primaryContact,
            city: editingEmployee.city,
            state: editingEmployee.state,
            dateOfJoining: editingEmployee.dateOfJoining,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          setUsers(prevUsers =>
            prevUsers.map(user => (user.id === editingEmployee.id ? editingEmployee : user))
          );
          setIsEditModalOpen(false);
          toast({
            title: "Success",
            description: "Employee updated successfully!",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to update employee: ${response.data}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while updating the employee.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingEmployee(prevEmployee => prevEmployee ? { ...prevEmployee, [name]: value } : null);
  };

  const handleViewUser = (userId: number) => {
    router.push(`/SalesExecutive/${userId}`);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await axios.put(
        `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/delete?id=${userId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Employee deleted successfully!",
        });
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      } else {
        toast({
          title: "Error",
          description: `Failed to delete employee: ${response.data}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the employee.",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: keyof User) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      (`${user.firstName} ${user.lastName}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortColumn, sortDirection]);

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleColumnSelection = (column: keyof User) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter((col) => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleNextClick = () => {
    setActiveTab('tab2');
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const initialNewEmployeeState = {
    firstName: "",
    lastName: "",
    employeeId: "",
    primaryContact: "",
    secondaryContact: "",
    departmentName: "",
    email: "",
    role: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    dateOfJoining: "",
    userName: "",
    password: "",
  };

  const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState);

  const [activeTab, setActiveTab] = useState('tab1');

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee-user/create",
        {
          user: {
            username: newEmployee.userName,
            password: newEmployee.password,
          },
          employee: {
            firstName: newEmployee.firstName,
            lastName: newEmployee.lastName,
            employeeId: newEmployee.employeeId,
            primaryContact: newEmployee.primaryContact,
            secondaryContact: newEmployee.secondaryContact,
            departmentName: newEmployee.departmentName,
            email: newEmployee.email,
            role: newEmployee.role,
            addressLine1: newEmployee.addressLine1,
            addressLine2: newEmployee.addressLine2,
            city: newEmployee.city,
            state: newEmployee.state,
            country: newEmployee.country,
            pincode: newEmployee.pincode,
            dateOfJoining: newEmployee.dateOfJoining,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data) {
        throw new Error("Error adding employee!");
      }

      setIsModalOpen(false);

      toast({
        title: "Success",
        description: "Employee added successfully!",
      });

      fetchEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding the employee.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prevEmployee) => ({
      ...prevEmployee,
      [name]: value,
    }));
  };

  const transformRole = (role: string) => {
    return role === 'Manager' ? 'Regional Manager' : role;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {role === 'MANAGER' ? 'Team Employees' : 'Employee List'}
        </h1>
        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Select Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {['name', 'city', 'state', 'role', 'userName', 'primaryContact', 'actions'].map((column) => (
                <DropdownMenuCheckboxItem
                  key={column}
                  checked={selectedColumns.includes(column)}
                  onCheckedChange={() => handleColumnSelection(column as keyof User)}
                >
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter a new password for the user.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResetPasswordSubmit}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AddTeam />
          <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
            setIsModalOpen(isOpen);
            if (!isOpen) {
              setNewEmployee(initialNewEmployeeState);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsModalOpen(true)}>Add Employee</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tab1">Personal & Work</TabsTrigger>
                  <TabsTrigger value="tab2">Credentials</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="pb-16">
                  <div className="space-y-4">
                    <div className="text-lg font-semibold">Personal Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={newEmployee.firstName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={newEmployee.lastName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          name="employeeId"
                          value={newEmployee.employeeId}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primaryContact">
                          Primary Contact <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="primaryContact"
                          name="primaryContact"
                          value={newEmployee.primaryContact}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryContact">Secondary Contact</Label>
                        <Input
                          id="secondaryContact"
                          name="secondaryContact"
                          value={newEmployee.secondaryContact}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        name="addressLine1"
                        value={newEmployee.addressLine1}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        name="addressLine2"
                        value={newEmployee.addressLine2}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={newEmployee.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={newEmployee.state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={newEmployee.country}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={newEmployee.pincode}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="text-lg font-semibold mt-6">Work Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="departmentName">
                          Department <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={newEmployee.departmentName}
                          onValueChange={(value) =>
                            setNewEmployee({ ...newEmployee, departmentName: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sales">Sales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                        <Select
                          value={newEmployee.role}
                          onValueChange={(value) =>
                            setNewEmployee({ ...newEmployee, role: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Field Officer">Field Officer</SelectItem>
                            <SelectItem value="Manager">Regional Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfJoining">Date of Joining</Label>
                        <Input
                          id="dateOfJoining"
                          name="dateOfJoining"
                          type="date"
                          value={newEmployee.dateOfJoining}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sticky bottom-0 bg-white py-4 mt-6">
                    <Button
                      onClick={handleNextClick}
                      disabled={!newEmployee.firstName || !newEmployee.lastName || !newEmployee.primaryContact || !newEmployee.departmentName || !newEmployee.role}
                      className="w-full"
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="tab2" className="pb-16">
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTab('tab1')}
                        className="p-2"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="text-lg font-semibold">User Credentials</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="userName">
                          User Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="userName"
                          name="userName"
                          value={newEmployee.userName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={newEmployee.password}
                            onChange={handleInputChange}
                            required
                          />
                          <button
                            type="button"
                            className="absolute top-1/2 right-2 transform -translate-y-1/2 focus:outline-none"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="sticky bottom-0 bg-white py-4 mt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={!newEmployee.userName || !newEmployee.password}
                      className="w-full"
                    >
                      Add Employee
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
              </DialogHeader>
              {editingEmployee && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={editingEmployee.firstName}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={editingEmployee.lastName}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={editingEmployee.email}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="userName">User Name</Label>
                      <Input
                        id="userName"
                        name="userName"
                        value={editingEmployee.userName}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">

                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="primaryContact">Primary Contact</Label>
                      <Input
                        id="primaryContact"
                        name="primaryContact"
                        value={editingEmployee.primaryContact}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={editingEmployee.city}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={editingEmployee.state}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dateOfJoining">Date of Joining</Label>
                      <Input
                        id="dateOfJoining"
                        name="dateOfJoining"
                        type="date"
                        value={editingEmployee.dateOfJoining}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && <div>Loading employees...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!isLoading && !error && (
        <>
          <Table>
            <TableCaption>List of users</TableCaption>
            <TableHeader>
              <TableRow>
                {selectedColumns.includes('name') && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort('firstName')}>
                    Name
                    {sortColumn === 'firstName' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </TableHead>
                )}
                {selectedColumns.includes('role') && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                    Role
                    {sortColumn === 'role' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </TableHead>
                )}
                {selectedColumns.includes('userName') && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort('userName')}>
                    User Name
                    {sortColumn === 'userName' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </TableHead>
                )}
                {selectedColumns.includes('primaryContact') && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort('primaryContact')}>
                    Phone
                    {sortColumn === 'primaryContact' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </TableHead>
                )}
                {selectedColumns.includes('city') && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort('city')}>
                    City
                    {sortColumn === 'city' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </TableHead>
                )}
                {selectedColumns.includes('state') && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort('state')}>
                    State
                    {sortColumn === 'state' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </TableHead>
                )}
                {selectedColumns.includes('actions') && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user) => (
                <TableRow key={user.id}>
                  {selectedColumns.includes('name') && (
                    <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                  )}
                  {selectedColumns.includes('role') && <TableCell>{transformRole(user.role)}</TableCell>}
                  {selectedColumns.includes('userName') && <TableCell>{user.userName}</TableCell>}
                  {selectedColumns.includes('primaryContact') && <TableCell>{user.primaryContact}</TableCell>}
                  {selectedColumns.includes('city') && <TableCell>{user.city}</TableCell>}
                  {selectedColumns.includes('state') && <TableCell>{user.state}</TableCell>}
                  {selectedColumns.includes('actions') && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <span>•••</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                {Array.from({ length: Math.ceil(sortedUsers.length / itemsPerPage) }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink onClick={() => paginate(i + 1)} isActive={currentPage === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeList;
