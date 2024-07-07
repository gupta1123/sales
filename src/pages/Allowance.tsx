"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
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
    const rowsPerPage = 10;

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const result = await response.json();
            const employeesWithAllowances = result.map((employee: any) => ({
                ...employee,
                travelAllowance: employee.travelAllowance || 0,
                dearnessAllowance: employee.dearnessAllowance || 0,
                fullMonthSalary: employee.fullMonthSalary || 0,
            }));
            // Sort employees alphabetically by first name
            employeesWithAllowances.sort((a: any, b: any) => a.firstName.localeCompare(b.firstName));
            setEmployees(employeesWithAllowances);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [authToken]);

    const handleInputChange = (employeeId: number, field: string, value: string) => {
        setEditedData(prevData => ({
            ...prevData,
            [employeeId]: {
                ...prevData[employeeId],
                [field]: parseInt(value, 10) || 0
            }
        }));
    };

    const updateSalary = async (employeeId: number) => {
        const employee = editedData[employeeId];
        if (!employee) return;

        try {
            const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/setSalary`, {
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
            const result = await response.text();
            if (result === 'Salary Updated!') {
                fetchEmployees();
                setEditMode(prevMode => ({
                    ...prevMode,
                    [employeeId]: false
                }));
                notification.success({
                    message: 'Success',
                    description: 'Salary updated successfully!',
                });
            } else {
                notification.error({
                    message: 'Error',
                    description: 'Failed to update salary.',
                });
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            notification.error({
                message: 'Error',
                description: 'Error saving changes.',
            });
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

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
                                    <Button variant="outline" size="sm" onClick={() => updateSalary(employee.id)}>Save</Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setEditMode(prevMode => ({ ...prevMode, [employee.id]: true }))}>Edit</Button>
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
