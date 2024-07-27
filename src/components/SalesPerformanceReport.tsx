import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    ChartOptions,
    ChartType
} from 'chart.js';
import 'chartjs-adapter-moment';
import { Chart, ChartProps } from 'react-chartjs-2';
import Select, { SingleValue, ActionMeta } from 'react-select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import moment from 'moment';
import { RootState } from '../store';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

type Store = {
    storeId: number;
    storeName: string;
    city: string;
};

type StoreOption = {
    value: number;
    label: string;
    city: string;
};

type MonthlyData = {
    month: string;
    avgMonthlySale: number;
    avgIntent: number;
    totalVisitCount: number;
};

const SalesPerformanceReport = () => {
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(moment().subtract(3, 'months').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
    const [storeNameFilter, setStoreNameFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const token = useSelector((state: RootState) => state.auth.token);

    const fetchStores = useCallback(async () => {
        try {
            const response = await axios.get<{ content: Store[], totalPages: number }>('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/filteredValues', {
                params: {
                    storeName: storeNameFilter,
                    city: cityFilter,
                    page: currentPage,
                    size: 10,
                    sort: 'storeName,asc'
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.content) {
                const storeOptions: StoreOption[] = response.data.content.map((store: Store) => ({
                    value: store.storeId,
                    label: store.storeName,
                    city: store.city
                }));
                setStores(storeOptions);
                setTotalPages(response.data.totalPages);
            } else {
                setError('Unexpected API response structure');
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            setError('Failed to fetch stores');
        }
    }, [token, storeNameFilter, cityFilter, currentPage]);

    useEffect(() => {
        if (token) {
            fetchStores();
        }
    }, [fetchStores, token]);

    const fetchMonthData = useCallback(async (start: string, end: string, storeId: number) => {
        try {
            const response = await axios.get<{ monthlySaleLogs: { newMonthlySale: number }[], intentLogs: { newIntentLevel: number }[], totalVisitCount: number }>(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/report/getAvgValues`, {
                params: { startDate: start, endDate: end, storeId },
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (err) {
            console.error(`Error fetching data for ${start} to ${end}:`, err);
            throw err;
        }
    }, [token]);

    const fetchReportData = useCallback(async () => {
        if (!selectedStore) {
            setError('Please select a store');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const monthlyDataArray: MonthlyData[] = [];
            let currentDate = moment(startDate).startOf('month');
            const endMoment = moment(endDate);

            while (currentDate.isSameOrBefore(endMoment)) {
                const monthStart = currentDate.format('YYYY-MM-DD');
                const monthEnd = moment.min(currentDate.clone().endOf('month'), endMoment).format('YYYY-MM-DD');

                const monthData = await fetchMonthData(monthStart, monthEnd, selectedStore.value);

                const avgMonthlySale = monthData.monthlySaleLogs.length > 0
                    ? monthData.monthlySaleLogs.reduce((sum, log) => sum + log.newMonthlySale, 0) / monthData.monthlySaleLogs.length
                    : 0;

                const avgIntent = monthData.intentLogs.length > 0
                    ? monthData.intentLogs.reduce((sum, log) => sum + log.newIntentLevel, 0) / monthData.intentLogs.length
                    : 0;

                monthlyDataArray.push({
                    month: currentDate.format('YYYY-MM'),
                    avgMonthlySale,
                    avgIntent,
                    totalVisitCount: monthData.totalVisitCount
                });

                currentDate.add(1, 'month');
            }

            setMonthlyData(monthlyDataArray);
        } catch (err) {
            setError('Failed to fetch report data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedStore, startDate, endDate, fetchMonthData]);

    const chartData = {
        labels: monthlyData.map(data => data.month),
        datasets: [
            {
                type: 'bar' as const,
                label: 'Average Monthly Sales',
                data: monthlyData.map(data => data.avgMonthlySale),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                yAxisID: 'y',
            },
            {
                type: 'line' as const,
                label: 'Average Intent Level',
                data: monthlyData.map(data => data.avgIntent),
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                yAxisID: 'y1',
            },
            {
                type: 'bar' as const,
                label: 'Total Visit Count',
                data: monthlyData.map(data => data.totalVisitCount),
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                yAxisID: 'y2',
            }
        ]
    };

    const chartOptions: ChartOptions<'bar' | 'line'> = {
        responsive: true,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'month',
                    displayFormats: {
                        month: 'MMM YYYY'
                    }
                },
                title: {
                    display: true,
                    text: 'Month'
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Average Monthly Sales'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Average Intent Level'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
            y2: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Total Visit Count'
                },
                grid: {
                    drawOnChartArea: false,
                },
            }
        },
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Monthly Sales Performance Report',
            },
        },
    };

    const handleStoreSelect = (newValue: SingleValue<StoreOption>, actionMeta: ActionMeta<StoreOption>) => {
        setSelectedStore(newValue);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate') setStartDate(value);
        if (name === 'endDate') setEndDate(value);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'storeName') setStoreNameFilter(value);
        if (name === 'city') setCityFilter(value);
        setCurrentPage(0); // Reset to first page when filters change
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Filter Stores</h3>
                    <div className="flex space-x-4 mb-4">
                        <Input
                            placeholder="Store Name"
                            name="storeName"
                            value={storeNameFilter}
                            onChange={handleFilterChange}
                            className="w-1/2"
                        />
                        <Input
                            placeholder="City"
                            name="city"
                            value={cityFilter}
                            onChange={handleFilterChange}
                            className="w-1/2"
                        />
                    </div>
                    <Button onClick={fetchStores}>Apply Filters</Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Select Store</h3>
                    <Select
                        options={stores}
                        value={selectedStore}
                        onChange={handleStoreSelect}
                        className="basic-single"
                        classNamePrefix="select"
                    />
                    <div className="mt-4">
                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>Previous</Button>
                        <span className="mx-4">Page {currentPage + 1} of {totalPages}</span>
                        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}>Next</Button>
                    </div>
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

            <Button onClick={fetchReportData} disabled={loading || !selectedStore}>
                Generate Report
            </Button>

            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {monthlyData.length > 0 && (
                <Card>
                    <CardContent>
                        <h2 className="text-xl font-bold mb-4">Monthly Report for {selectedStore?.label}</h2>
                        <Chart type="bar" data={chartData} options={chartOptions} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SalesPerformanceReport;
