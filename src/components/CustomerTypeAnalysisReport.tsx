import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { RootState } from '../store';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type Employee = {
    id: number;
    firstName: string;
    lastName: string;
};

const CustomerTypeAnalysisReport = () => {
    const [employees, setEmployees] = useState<{ value: number; label: string }[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<{ value: number; label: string } | null>(null);
    const [customerTypeData, setCustomerTypeData] = useState<{ [key: string]: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('2024-05-01');
    const [endDate, setEndDate] = useState('2024-06-25');

    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchCustomerTypeData();
        }
    }, [selectedEmployee, startDate, endDate]);

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
            setError('Failed to fetch employees');
        }
    };

    const fetchCustomerTypeData = async () => {
        if (!selectedEmployee) return;

        try {
            const response = await axios.get('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/report/getByStoreType', {
                params: {
                    employeeId: selectedEmployee.value,
                    startDate,
                    endDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomerTypeData(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching customer type data:', error);
            setError('Failed to fetch customer type data');
            setCustomerTypeData(null);
        }
    };

    const handleEmployeeSelect = (selected: any) => {
        setSelectedEmployee(selected);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate') {
            setStartDate(value);
        } else if (name === 'endDate') {
            setEndDate(value);
        }
    };

    const processChartData = () => {
        if (!customerTypeData || typeof customerTypeData !== 'object') {
            return { labels: [], datasets: [{ data: [] }] };
        }

        const labels = Object.keys(customerTypeData);
        const data = Object.values(customerTypeData);

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(199, 199, 199, 0.6)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            title: {
                display: true,
                text: 'Customer Type Distribution',
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
                        const percentage = ((value / total) * 100).toFixed(2);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Select Employee</h3>
                    <Select
                        options={employees}
                        value={selectedEmployee}
                        onChange={handleEmployeeSelect}
                        className="basic-single"
                        classNamePrefix="select"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
                    <div className="flex space-x-4">
                        <Input
                            type="date"
                            name="startDate"
                            value={startDate}
                            onChange={handleDateChange}
                            className="w-1/2"
                        />
                        <Input
                            type="date"
                            name="endDate"
                            value={endDate}
                            onChange={handleDateChange}
                            className="w-1/2"
                        />
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card>
                    <CardContent>
                        <p className="text-red-500">{error}</p>
                    </CardContent>
                </Card>
            )}

            {selectedEmployee && customerTypeData && (
                <Card>
                    <CardContent>
                        <div style={{ height: '400px' }}>
                            <Pie data={processChartData()} options={chartOptions} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CustomerTypeAnalysisReport;
