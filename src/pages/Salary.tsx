"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";
import styles from './Salary.module.css';

const Salary: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
    const [selectedFieldOfficer, setSelectedFieldOfficer] = useState<string>("All");
    const [data, setData] = useState<any[]>([]);
    const [isDataAvailable, setIsDataAvailable] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 10;

    const months = [
        { value: '01', label: 'January', days: 31 },
        { value: '02', label: 'February', days: 28 },
        { value: '03', label: 'March', days: 31 },
        { value: '04', label: 'April', days: 30 },
        { value: '05', label: 'May', days: 31 },
        { value: '06', label: 'June', days: 30 },
        { value: '07', label: 'July', days: 31 },
        { value: '08', label: 'August', days: 31 },
        { value: '09', label: 'September', days: 30 },
        { value: '10', label: 'October', days: 31 },
        { value: '11', label: 'November', days: 30 },
        { value: '12', label: 'December', days: 31 },
    ];

    const years = Array.from({ length: 2050 - currentYear + 1 }, (_, index) => {
        const year = currentYear + index;
        return { value: year.toString(), label: year.toString() };
    });

    const fetchData = useCallback(async () => {
        try {
            if (selectedYear && selectedMonth) {
                const now = new Date();
                const isCurrentMonth = Number(selectedYear) === now.getFullYear() && Number(selectedMonth) === now.getMonth() + 1;
                const endDay = isCurrentMonth ? now.getDate() - 1 : getDaysInMonth(Number(selectedYear), Number(selectedMonth));

                const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/attendance-log/getForRange?start=${selectedYear}-${selectedMonth}-01&end=${selectedYear}-${selectedMonth}-${endDay.toString().padStart(2, '0')}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                });
                const attendanceLogs = await response.json();

                setData(attendanceLogs);
                setIsDataAvailable(attendanceLogs.length > 0);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsDataAvailable(false);
        }
    }, [selectedYear, selectedMonth, authToken]);

    useEffect(() => {
        if (selectedYear && selectedMonth) {
            fetchData();
        }
    }, [selectedYear, selectedMonth, fetchData]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate();
    };

    const countSundaysInMonth = (year: number, month: number) => {
        let sundays = 0;
        const daysInMonth = getDaysInMonth(year, month);
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            if (date.getDay() === 0) {
                sundays++;
            }
        }
        return sundays;
    };

    const calculateBaseSalary = (fullMonthSalary: number, totalDaysWorked: number, totalDaysInMonth: number, sundays: number) => {
        const perDaySalary = fullMonthSalary / totalDaysInMonth;
        const sundaySalary = perDaySalary * sundays;
        const baseSalary = perDaySalary * totalDaysWorked + sundaySalary;
        return baseSalary;
    };

    const calculateTotalSalary = (row: any, year: number, month: number) => {
        const totalDaysInMonth = getDaysInMonth(year, month);
        const sundays = countSundaysInMonth(year, month);
        const totalDaysWorked = row.fullDays * 1 + row.halfDays * 0.5;
        const baseSalary = calculateBaseSalary(row.salary || 0, totalDaysWorked, totalDaysInMonth, sundays);
        // TA is always 0 as per previous requirement
        const travelAllowance = 0;
        // Use the DA directly from the API
        const dearnessAllowance = row.dearnessAllowance || 0;
        const totalSalary = baseSalary + travelAllowance + dearnessAllowance + (row.statsDto.approvedExpense || 0);
        return Math.round(totalSalary);
    };

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const sortedData = data.sort((a, b) => {
        const nameA = `${a.employeeFirstName} ${a.employeeLastName}`.toLowerCase();
        const nameB = `${b.employeeFirstName} ${b.employeeLastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    const currentRows = sortedData
        .filter(row => selectedFieldOfficer === "All" || `${row.employeeFirstName} ${row.employeeLastName}` === selectedFieldOfficer)
        .slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    const uniqueFieldOfficers = Array.from(new Set(data.map(row => `${row.employeeFirstName} ${row.employeeLastName}`)));

    return (
        <div className={styles.salaryContainer}>
            <h2>Salary Details</h2>
            <div className={styles.filterContainer}>
                <div className={styles.selectContainer}>
                    <Select onValueChange={setSelectedYear} defaultValue={selectedYear}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year.value} value={year.value}>
                                    {year.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={styles.selectContainer}>
                    <Select onValueChange={setSelectedMonth} defaultValue={selectedMonth}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={styles.selectContainer}>
                    <Select onValueChange={setSelectedFieldOfficer} defaultValue="All">
                        <SelectTrigger>
                            <SelectValue placeholder="Select Field Officer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Field Officers</SelectItem>
                            {uniqueFieldOfficers.map((officer, index) => (
                                <SelectItem key={index} value={officer}>
                                    {officer}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isDataAvailable ? (
                <>
                    <Table className={styles.table}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Field Officer</TableHead>
                                <TableHead>Full Days</TableHead>
                                <TableHead>Half Days</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead>TA</TableHead>
                                <TableHead>DA</TableHead>
                                <TableHead>Expense</TableHead>
                                <TableHead>Total Salary</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentRows.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.employeeFirstName} {row.employeeLastName}</TableCell>
                                    <TableCell>{row.fullDays}</TableCell>
                                    <TableCell>{row.halfDays}</TableCell>
                                    <TableCell>{Math.round(calculateBaseSalary(row.salary || 0, (row.fullDays * 1 + row.halfDays * 0.5), getDaysInMonth(Number(selectedYear), Number(selectedMonth)), countSundaysInMonth(Number(selectedYear), Number(selectedMonth))))}</TableCell>
                                    <TableCell>0</TableCell>
                                    <TableCell>{Math.round(row.dearnessAllowance || 0)}</TableCell>
                                    <TableCell>{Math.round(row.statsDto?.approvedExpense || 0)}</TableCell>
                                    <TableCell>{calculateTotalSalary(row, Number(selectedYear), Number(selectedMonth))}</TableCell>
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
                </>
            ) : (
                <p className={styles.noDataMessage}>No data available for the selected month and year. Please choose a different month or year.</p>
            )}
        </div>
    );
};

export default Salary;
