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
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import styles from './Salary.module.css';

const OLA_CLIENT_ID = '7ba2810b-f481-4e31-a0c6-d436b0c7c1eb';
const OLA_CLIENT_SECRET = 'klymi04gaquWCnpa57hBEpMXR7YPhkLD';

const Salary: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
    const [selectedFieldOfficer, setSelectedFieldOfficer] = useState<string>("All");
    const [data, setData] = useState<any[]>([]);
    const [isDataAvailable, setIsDataAvailable] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [travelAllowanceData, setTravelAllowanceData] = useState<{ [key: number]: any }>({});
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<{ [key: number]: boolean }>({});
    const [travelAllowanceRates, setTravelAllowanceRates] = useState<{ [key: number]: { carRate: number, bikeRate: number } }>({});
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
                const data = await response.json();
                setData(data);
                setIsDataAvailable(data.length > 0);

                // Store travel allowance rates
                const ratesMap = data.reduce((acc: any, employee: any) => {
                    acc[employee.employeeId] = {
                        carRate: employee.pricePerKmCar,
                        bikeRate: employee.pricePerKmBike
                    };
                    return acc;
                }, {});
                setTravelAllowanceRates(ratesMap);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsDataAvailable(false);
        }
    }, [selectedYear, selectedMonth, authToken]);

    const fetchTravelAllowanceData = useCallback(async (employeeId: number) => {
        try {
            const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/travel-allowance/getForEmployeeAndDate?employeeId=${employeeId}&start=${selectedYear}-${selectedMonth}-01&end=${selectedYear}-${selectedMonth}-${getDaysInMonth(Number(selectedYear), Number(selectedMonth)).toString().padStart(2, '0')}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const data = await response.json();
            setTravelAllowanceData(prevData => ({ ...prevData, [employeeId]: data }));
        } catch (error) {
            console.error('Error fetching travel allowance data:', error);
        }
    }, [selectedYear, selectedMonth, authToken]);

    useEffect(() => {
        if (selectedYear && selectedMonth) {
            fetchData();
        }
    }, [selectedYear, selectedMonth, fetchData]);

    useEffect(() => {
        data.forEach(row => {
            fetchTravelAllowanceData(row.employeeId);
        });
    }, [data, fetchTravelAllowanceData]);

    useEffect(() => {
        getAccessToken();
    }, []);

    const getAccessToken = async () => {
        try {
            const response = await axios.post(
                'https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token',
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    scope: 'openid',
                    client_id: OLA_CLIENT_ID,
                    client_secret: OLA_CLIENT_SECRET
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            setAccessToken(response.data.access_token);
        } catch (error) {
            console.error('Error getting access token:', error);
        }
    };

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
        const travelAllowance = calculateTravelAllowance(row.employeeId);
        const dearnessAllowance = row.dearnessAllowance || 0;
        const totalSalary = baseSalary + travelAllowance + dearnessAllowance + (row.statsDto.approvedExpense || 0);
        return Math.round(totalSalary);
    };

    const getAnomalyCount = (employeeId: number) => {
        const employeeData = travelAllowanceData[employeeId];
        if (!employeeData) return 0;
        return employeeData.dateDetails.filter((detail: any) =>
            detail.checkoutCount > 0 && detail.totalDistanceTravelled === 0
        ).length;
    };

    const calculateTravelAllowance = (employeeId: number) => {
        const employeeData = data.find(employee => employee.employeeId === employeeId);
        if (!employeeData) return 0;

        const carDistance = employeeData.distanceTravelledByCar || 0;
        const bikeDistance = employeeData.distanceTravelledByBike || 0;
        const carRate = employeeData.pricePerKmCar || 0;
        const bikeRate = employeeData.pricePerKmBike || 0;

        const carAllowance = carDistance * carRate;
        const bikeAllowance = bikeDistance * bikeRate;
        return Math.round(carAllowance + bikeAllowance);
    };

    const calculateDistances = async (employeeId: number) => {
        if (!accessToken) {
            console.error('Access token not available');
            return;
        }

        setIsCalculating(prev => ({ ...prev, [employeeId]: true }));

        try {
            const employeeData = travelAllowanceData[employeeId];
            if (!employeeData) return;

            const datesWithMissingDistance = employeeData.dateDetails.filter(
                (detail: any) => detail.checkoutCount > 0 && detail.totalDistanceTravelled === 0
            );

            if (datesWithMissingDistance.length === 0) return;

            const updatedDateDetails = await Promise.all(employeeData.dateDetails.map(async (detail: any) => {
                if (detail.checkoutCount > 0 && detail.totalDistanceTravelled === 0) {
                    let dailyCarDistance = 0;
                    let dailyBikeDistance = 0;
                    for (let i = 0; i < detail.visitDetails.length - 1; i++) {
                        const currentVisit = detail.visitDetails[i];
                        const nextVisit = detail.visitDetails[i + 1];
                        if (currentVisit.checkinLatitude && currentVisit.checkinLongitude &&
                            nextVisit.checkinLatitude && nextVisit.checkinLongitude) {
                            const distance = await calculateDistance(
                                currentVisit.checkinLatitude,
                                currentVisit.checkinLongitude,
                                nextVisit.checkinLatitude,
                                nextVisit.checkinLongitude
                            );
                            // Determine vehicle type (assuming bike if not specified)
                            const vehicleType = currentVisit.vehicleType || 'Bike';
                            if (vehicleType === 'Car') {
                                dailyCarDistance += distance;
                            } else {
                                dailyBikeDistance += distance;
                            }
                        }
                    }

                    // Make API call to store the calculated distance
                    await axios.post(
                        'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/travel-allowance/create',
                        {
                            employeeId: employeeId,
                            date: detail.date,
                            distanceTravelledByCar: dailyCarDistance,
                            distanceTravelledByBike: dailyBikeDistance
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    return { ...detail, totalDistanceTravelled: dailyCarDistance + dailyBikeDistance };
                }
                return detail;
            }));

            setTravelAllowanceData(prevData => ({
                ...prevData,
                [employeeId]: { ...employeeData, dateDetails: updatedDateDetails }
            }));

            // Refresh travel allowance data after calculations
            await fetchTravelAllowanceData(employeeId);

        } catch (error) {
            console.error('Error calculating distances:', error);
        } finally {
            setIsCalculating(prev => ({ ...prev, [employeeId]: false }));
        }
    };

    const calculateDistance = async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> => {
        try {
            const response = await axios.post(
                'https://api.olamaps.io/routing/v1/directions',
                null,
                {
                    params: {
                        origin: `${lat1},${lon1}`,
                        destination: `${lat2},${lon2}`,
                        alternatives: false,
                        steps: false,
                        overview: 'full',
                        language: 'en',
                        traffic_metadata: false,
                    },
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Request-Id': crypto.randomUUID(),
                        'X-Correlation-Id': crypto.randomUUID(),
                    }
                }
            );
            return response.data.routes[0].legs[0].distance / 1000; // Convert to km
        } catch (error) {
            console.error('Error calculating distance:', error);
            return 0;
        }
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
                                    <TableCell>
                                        {row.employeeFirstName} {row.employeeLastName}
                                        {getAnomalyCount(row.employeeId) > 0 && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <ExclamationTriangleIcon className={styles.warningIcon} />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {getAnomalyCount(row.employeeId)} day(s) with checkout but no distance traveled
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => calculateDistances(row.employeeId)}
                                                            disabled={isCalculating[row.employeeId]}
                                                            className="ml-2"
                                                        >
                                                            {isCalculating[row.employeeId] ? 'Calculating...' : 'Calculate Distance'}
                                                        </Button>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </TableCell>
                                    <TableCell>{row.fullDays}</TableCell>
                                    <TableCell>{row.halfDays}</TableCell>
                                    <TableCell>{Math.round(calculateBaseSalary(row.salary || 0, (row.fullDays * 1 + row.halfDays * 0.5), getDaysInMonth(Number(selectedYear), Number(selectedMonth)), countSundaysInMonth(Number(selectedYear), Number(selectedMonth))))}</TableCell>
                                    <TableCell>{calculateTravelAllowance(row.employeeId)}</TableCell>
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