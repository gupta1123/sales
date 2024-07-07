import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Select from 'react-select';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';
import { SingleValue } from 'react-select';

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    city: string;
    role: string;
    teamId: number | null;
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

const AddTeam = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [officeManager, setOfficeManager] = useState<{ value: number, label: string } | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [officeManagers, setOfficeManagers] = useState<OfficeManager[]>([]);
    const [cities, setCities] = useState<{ value: string, label: string }[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [assignedCity, setAssignedCity] = useState<string | null>(null);

    const token = useSelector((state: RootState) => state.auth.token);
    const { toast } = useToast();

    useEffect(() => {
        if (isModalOpen && token) {
            fetchOfficeManagers();
            fetchCities();
        }
    }, [isModalOpen, token]);

    const fetchOfficeManagers = async () => {
        try {
            const allEmployeesResponse = await axios.get(
                "http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const teamsResponse = await axios.get(
                "http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/getAll",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const assignedManagerIds = teamsResponse.data.map((team: any) => team.officeManager.id);
            const deletedManagerIds = allEmployeesResponse.data
                .filter((employee: OfficeManager) => employee.role === "Manager" && employee.deleted)
                .map((employee: OfficeManager) => employee.id);
            const availableManagers = allEmployeesResponse.data
                .filter((employee: OfficeManager) =>
                    employee.role === "Manager" &&
                    !assignedManagerIds.includes(employee.id) &&
                    !deletedManagerIds.includes(employee.id)
                );

            setOfficeManagers(availableManagers);
        } catch (error) {
            console.error("Error fetching Regional managers:", error);
            toast({
                title: "Error",
                description: "Failed to fetch Regional managers. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleOfficeManagerChange = (
        selectedOption: SingleValue<{ value: number; label: string }>
    ) => {
        if (selectedOption) {
            setOfficeManager(selectedOption);
            const manager = officeManagers.find(manager => manager.id === selectedOption.value);
            if (manager) {
                setAssignedCity(manager.city);
            } else {
                setAssignedCity(null);
            }
        }
    };

    const fetchCities = async () => {
        try {
            const response = await axios.get(
                "http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getCities",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setCities(response.data.map((city: string) => ({ value: city, label: city })));
        } catch (error) {
            console.error("Error fetching cities:", error);
            toast({
                title: "Error",
                description: "Failed to fetch cities. Please try again.",
                variant: "destructive",
            });
        }
    };

    const fetchEmployeesByCity = async (city: string) => {
        try {
            const response = await axios.get(
                `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getFieldOfficerByCity?city=${city}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const fieldOfficers = response.data
                .filter((employee: Employee) =>
                    employee.role === "Field Officer" && employee.teamId === null
                );
            setEmployees(fieldOfficers);
        } catch (error) {
            console.error(`Error fetching employees for city ${city}:`, error);
            toast({
                title: "Error",
                description: `Failed to fetch employees for ${city}. Please try again.`,
                variant: "destructive",
            });
        }
    };

    const handleCitySelect = async () => {
        if (selectedCity && officeManager) {
            try {
                await axios.put(
                    `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/assignCity`,
                    null,
                    {
                        params: { id: officeManager.value, city: selectedCity },
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                toast({
                    title: "Success",
                    description: `${selectedCity} assigned to Regional Manager ID: ${officeManager.value}`,
                });
                setAssignedCity(selectedCity);
                await fetchEmployeesByCity(selectedCity);
            } catch (error) {
                console.error(`Error assigning city ${selectedCity} to Regional manager ${officeManager.value}:`, error);
                toast({
                    title: "Error",
                    description: `Failed to assign ${selectedCity} to Regional Manager ID: ${officeManager.value}. Please try again.`,
                    variant: "destructive",
                });
            }
        } else {
            toast({
                title: "Error",
                description: "Please select a city and an Regional manager.",
                variant: "destructive",
            });
        }
    };

    const handleCreateTeam = async () => {
        if (!officeManager) {
            toast({
                title: "Error",
                description: "Please select an Regional manager.",
                variant: "destructive",
            });
            return;
        }

        if (selectedEmployees.length === 0) {
            toast({
                title: "Error",
                description: "Please select at least one team member.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await axios.post(
                "http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/create",
                {
                    officeManager: officeManager.value,
                    fieldOfficers: selectedEmployees,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                toast({
                    title: "Success",
                    description: "Team created successfully!",
                });

                // Assign city to selected employees
                for (const employeeId of selectedEmployees) {
                    try {
                        await axios.put(
                            `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/assignCity`,
                            null,
                            {
                                params: { id: employeeId, city: selectedCity },
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );
                        toast({
                            title: "Success",
                            description: `${selectedCity} assigned to Employee ID: ${employeeId}`,
                        });
                    } catch (error) {
                        console.error(`Error assigning city ${selectedCity} to employee ${employeeId}:`, error);
                        toast({
                            title: "Error",
                            description: `Failed to assign ${selectedCity} to Employee ID: ${employeeId}. Please try again.`,
                            variant: "destructive",
                        });
                    }
                }

                setIsModalOpen(false);
                // Reset form
                setOfficeManager(null);
                setSelectedCity(null);
                setSelectedEmployees([]);
                setEmployees([]);
            }
        } catch (error: any) {
            console.error("Error creating team:", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast({
                    title: "Error Creating Team",
                    description: error.response.data.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "An unexpected error occurred. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <>
            <Button onClick={() => setIsModalOpen(true)}>Add Team</Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="officeManager">Regional Manager</label>
                            <Select
                                id="officeManager"
                                value={officeManager}
                                onChange={handleOfficeManagerChange}
                                options={officeManagers.map(manager => ({
                                    value: manager.id,
                                    label: `${manager.firstName} ${manager.lastName}`
                                }))}
                                placeholder="Select an Regional Manager"
                            />
                        </div>
                        <div>
                            <label htmlFor="city">City</label>
                            <Select
                                id="city"
                                value={selectedCity ? { value: selectedCity, label: selectedCity } : null}
                                onChange={(option) => setSelectedCity(option ? option.value : null)}
                                options={cities}
                                placeholder="Select a city"
                            />
                            <Button className="mt-2" onClick={handleCitySelect} disabled={!selectedCity}>
                                OK
                            </Button>
                        </div>
                        {assignedCity && (
                            <div>
                                <label>Team Members</label>
                                <div className="max-h-60 overflow-y-auto">
                                    {employees.map((employee) => (
                                        <div key={employee.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`employee-${employee.id}`}
                                                checked={selectedEmployees.includes(employee.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedEmployees([...selectedEmployees, employee.id]);
                                                    } else {
                                                        setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`employee-${employee.id}`}>
                                                {employee.firstName} {employee.lastName}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTeam}
                            disabled={!officeManager || selectedEmployees.length === 0}
                        >
                            Create Team
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddTeam;