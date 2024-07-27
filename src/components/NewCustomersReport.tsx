import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Select from 'react-select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { format, parse, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { RootState } from '../store';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Employee = {
    id: number;
    firstName: string;
    lastName: string;
};

type ReportData = {
    employeeName: string;
    newStoreCount: number;
};

const NewCustomersReport = () => {
    const [employees, setEmployees] = useState<{ value: number; label: string }[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<{ value: number; label: string }[]>([]);
    const [reportData, setReportData] = useState<Record<string, ReportData[]>>({});
    const [startDate, setStartDate] = useState('2024-05-18');
    const [endDate, setEndDate] = useState('2024-07-18');
    const [topPerformers, setTopPerformers] = useState<{ name: string; count: number }[]>([]);
    const [bottomPerformers, setBottomPerformers] = useState<{ name: string; count: number }[]>([]);

    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

    useEffect(() => {
        if (token && startDate && endDate) {
            fetchReportData();
        }
    }, [token, startDate, endDate]);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get<Employee[]>('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const employeeOptions = response.data.map((emp: Employee) => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName}`
            }));
            setEmployees(employeeOptions);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchReportData = async () => {
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());
        const months = eachMonthOfInterval({ start, end });

        const fetchPromises = months.map(async (month) => {
            const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
            const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

            try {
                const response = await axios.get<ReportData[]>('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/report/getForEmployee', {
                    params: { startDate: monthStart, endDate: monthEnd },
                    headers: { Authorization: `Bearer ${token}` }
                });
                return { month: format(month, 'MMMM yyyy'), data: response.data };
            } catch (error) {
                console.error(`Error fetching report data for ${format(month, 'MMMM yyyy')}:`, error);
                return { month: format(month, 'MMMM yyyy'), data: [] };
            }
        });

        const results = await Promise.all(fetchPromises);
        const newReportData = Object.fromEntries(results.map(({ month, data }) => [month, data]));
        setReportData(newReportData);
        calculateTopAndBottomPerformers(newReportData);
    };

    const calculateTopAndBottomPerformers = (data: Record<string, ReportData[]>) => {
        const aggregatedData = Object.values(data).flat().reduce((acc: Record<string, number>, curr) => {
            if (!acc[curr.employeeName]) {
                acc[curr.employeeName] = 0;
            }
            acc[curr.employeeName] += curr.newStoreCount;
            return acc;
        }, {});

        const sortedPerformers = Object.entries(aggregatedData)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({ name, count }));

        setTopPerformers(sortedPerformers.slice(0, 5));
        setBottomPerformers(sortedPerformers.slice(-5).reverse());
    };

    const handleEmployeeSelect = (selected: any) => {
        setSelectedEmployees(selected);
    };

    const handleShowTopPerformers = () => {
        const topEmployees = topPerformers.map(performer =>
            employees.find(emp => emp.label.includes(performer.name))
        ).filter(Boolean);
        setSelectedEmployees(topEmployees as { value: number; label: string }[]);
    };

    const handleShowBottomPerformers = () => {
        const bottomEmployees = bottomPerformers.map(performer =>
            employees.find(emp => emp.label.includes(performer.name))
        ).filter(Boolean);
        setSelectedEmployees(bottomEmployees as { value: number; label: string }[]);
    };

    const chartData = () => {
        const months = Object.keys(reportData);
        const datasets = selectedEmployees.map(employee => ({
            label: employee.label,
            data: months.map(month => {
                const employeeData = reportData[month].find(data => data.employeeName === employee.label);
                return employeeData ? employeeData.newStoreCount : 0;
            }),
            borderColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
            tension: 0.1
        }));

        return {
            labels: months,
            datasets: datasets
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'New Customers Acquired'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of New Customers'
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
                    <div className="flex space-x-4">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border p-2 rounded"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border p-2 rounded"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Select Employees</h3>
                    <Select
                        isMulti
                        name="employees"
                        options={employees}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        onChange={handleEmployeeSelect}
                        value={selectedEmployees}
                    />
                    <div className="mt-4 flex space-x-4">
                        <Button onClick={handleShowTopPerformers}>Show Top 5 Performers</Button>
                        <Button onClick={handleShowBottomPerformers}>Show Bottom 5 Performers</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Line data={chartData()} options={chartOptions} />
                </CardContent>
            </Card>
        </div>
    );
};

export default NewCustomersReport;