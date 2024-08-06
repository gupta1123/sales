import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";
import { notification } from 'antd';
import styles from './Allowance.module.css';

const Allowance: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
    const [editedData, setEditedData] = useState<{ [key: number]: any }>({});
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [travelRates, setTravelRates] = useState<{ [key: number]: { carRatePerKm: number, bikeRatePerKm: number } }>({});
    const [editedTravelRates, setEditedTravelRates] = useState<{ [key: number]: { carRatePerKm: number, bikeRatePerKm: number } }>({});
    const rowsPerPage = 10;

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [authToken]);

    const fetchTravelRates = useCallback(async () => {
        try {
            const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/travel-rates/getAll', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const data = await response.json();
            const ratesMap = data.reduce((acc: any, rate: any) => {
                acc[rate.employeeId] = {
                    carRatePerKm: rate.carRatePerKm,
                    bikeRatePerKm: rate.bikeRatePerKm
                };
                return acc;
            }, {});
            setTravelRates(ratesMap);
        } catch (error) {
            console.error('Error fetching travel rates:', error);
        }
    }, [authToken]);

    useEffect(() => {
        fetchEmployees();
        fetchTravelRates();
    }, [fetchEmployees, fetchTravelRates]);

    const handleInputChange = (employeeId: number, field: string, value: string) => {
        setEditedData(prevData => ({
            ...prevData,
            [employeeId]: {
                ...prevData[employeeId],
                [field]: value
            }
        }));

        if (field === 'carRatePerKm' || field === 'bikeRatePerKm') {
            setEditedTravelRates(prevRates => {
                const previousRate = prevRates[employeeId] || { carRatePerKm: 0, bikeRatePerKm: 0 }; // Default values to avoid undefined
                return {
                    ...prevRates,
                    [employeeId]: {
                        ...previousRate,
                        [field]: parseFloat(value)
                    }
                };
            });
        }
    };

    const updateSalary = async (employeeId: number) => {
        const employee = editedData[employeeId];
        const travelRate = editedTravelRates[employeeId];
        if (!employee) return;

        try {
            const salaryResponse = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/setSalary`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    travelAllowance: employee.travelAllowance,
                    dearnessAllowance: employee.dearnessAllowance,
                    fullMonthSalary: employee.fullMonthSalary,
                    employeeId: employeeId,
                }),
            });

            if (travelRate) {
                const travelRateResponse = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/travel-rates/create', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        employeeId: employeeId,
                        carRatePerKm: travelRate.carRatePerKm,
                        bikeRatePerKm: travelRate.bikeRatePerKm
                    }),
                });

                if (!travelRateResponse.ok) {
                    throw new Error('Failed to update travel rates');
                }
            }

            const result = await salaryResponse.text();
            if (result === 'Salary Updated!') {
                fetchEmployees();
                fetchTravelRates();
                setEditMode(prevMode => ({
                    ...prevMode,
                    [employeeId]: false
                }));
                notification.success({
                    message: 'Success',
                    description: 'Salary and travel rates updated successfully!',
                });
            } else {
                throw new Error('Failed to update salary');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            notification.error({
                message: 'Error',
                description: 'Error saving changes.',
            });
        }
    };

    const startEdit = (employeeId: number) => {
        setEditMode(prevMode => ({
            ...prevMode,
            [employeeId]: true
        }));
        setEditedData(prevData => ({
            ...prevData,
            [employeeId]: {
                travelAllowance: employees.find(e => e.id === employeeId)?.travelAllowance,
                dearnessAllowance: employees.find(e => e.id === employeeId)?.dearnessAllowance,
                fullMonthSalary: employees.find(e => e.id === employeeId)?.fullMonthSalary
            }
        }));
        setEditedTravelRates(prevRates => ({
            ...prevRates,
            [employeeId]: travelRates[employeeId] || { carRatePerKm: 0, bikeRatePerKm: 0 }
        }));
    };

    const cancelEdit = (employeeId: number) => {
        setEditMode(prevMode => ({
            ...prevMode,
            [employeeId]: false
        }));
        setEditedData(prevData => {
            const newData = { ...prevData };
            delete newData[employeeId];
            return newData;
        });
        setEditedTravelRates(prevRates => {
            const newRates = { ...prevRates };
            delete newRates[employeeId];
            return newRates;
        });
    };


    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = employees.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(employees.length / rowsPerPage);

    return (
        <div className={styles.allowanceContainer}>
            <h2>Allowance Details</h2>
            <Table className={styles.table}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>TA</TableHead>
                        <TableHead>DA</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead>Car Rate (per km)</TableHead>
                        <TableHead>Bike Rate (per km)</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentRows.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                            <TableCell>
                                {editMode[employee.id] ? (
                                    <input
                                        type="number"
                                        value={editedData[employee.id]?.travelAllowance || employee.travelAllowance}
                                        onChange={(e) => handleInputChange(employee.id, 'travelAllowance', e.target.value)}
                                    />
                                ) : (
                                    employee.travelAllowance
                                )}
                            </TableCell>
                            <TableCell>
                                {editMode[employee.id] ? (
                                    <input
                                        type="number"
                                        value={editedData[employee.id]?.dearnessAllowance || employee.dearnessAllowance}
                                        onChange={(e) => handleInputChange(employee.id, 'dearnessAllowance', e.target.value)}
                                    />
                                ) : (
                                    employee.dearnessAllowance
                                )}
                            </TableCell>
                            <TableCell>
                                {editMode[employee.id] ? (
                                    <input
                                        type="number"
                                        value={editedData[employee.id]?.fullMonthSalary || employee.fullMonthSalary}
                                        onChange={(e) => handleInputChange(employee.id, 'fullMonthSalary', e.target.value)}
                                    />
                                ) : (
                                    employee.fullMonthSalary
                                )}
                            </TableCell>
                            <TableCell>
                                {editMode[employee.id] ? (
                                    <input
                                        type="number"
                                        value={editedTravelRates[employee.id]?.carRatePerKm || travelRates[employee.id]?.carRatePerKm || 0}
                                        onChange={(e) => handleInputChange(employee.id, 'carRatePerKm', e.target.value)}
                                    />
                                ) : (
                                    travelRates[employee.id]?.carRatePerKm || 0
                                )}
                            </TableCell>
                            <TableCell>
                                {editMode[employee.id] ? (
                                    <input
                                        type="number"
                                        value={editedTravelRates[employee.id]?.bikeRatePerKm || travelRates[employee.id]?.bikeRatePerKm || 0}
                                        onChange={(e) => handleInputChange(employee.id, 'bikeRatePerKm', e.target.value)}
                                    />
                                ) : (
                                    travelRates[employee.id]?.bikeRatePerKm || 0
                                )}
                            </TableCell>
                            <TableCell>
                                {editMode[employee.id] ? (
                                    <>
                                        <Button onClick={() => updateSalary(employee.id)}>Save</Button>
                                        <Button onClick={() => cancelEdit(employee.id)}>Cancel</Button>
                                    </>
                                ) : (
                                    <Button onClick={() => startEdit(employee.id)}>Edit</Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pagination>
                <PaginationContent>
                    {currentPage > 1 && (
                        <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} />
                        </PaginationItem>
                    )}
                    {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                            <PaginationLink
                                isActive={currentPage === i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    {currentPage < totalPages && (
                        <PaginationItem>
                            <PaginationNext onClick={() => setCurrentPage(currentPage + 1)} />
                        </PaginationItem>
                    )}
                </PaginationContent>
            </Pagination>
        </div>
    );
};

export default Allowance;