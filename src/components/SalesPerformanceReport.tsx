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
} from 'chart.js';
import 'chartjs-adapter-moment';
import { Chart } from 'react-chartjs-2';
import Select from 'react-select';
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

type MonthlyData = {
    month: string;
    avgMonthlySale: number;
    avgIntent: number;
    totalVisitCount: number;
};

const SalesPerformanceReport: React.FC = () => {
    const [stores, setStores] = useState<{ value: number; label: string; city: string }[]>([]);
    const [selectedStore, setSelectedStore] = useState<{ value: number; label: string; city: string } | null>(null);
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
            const response = await axios.get<{ content: Store[], totalPages: number }>(
                'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/filteredValues',
                {
                    params: {
                        storeName: storeNameFilter,
                        city: cityFilter,
                        page: currentPage,
                        size: 10,
                        sort: 'storeName,asc'
                    },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (response.data && response.data.content) {
                const storeOptions = response.data.content.map((store: Store) => ({
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
            const response = await axios.get('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/report/getAvgValues', {
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
            const monthlyDataArray = [];
            let currentDate = moment(startDate).startOf('month');
            const endMoment = moment(endDate);

            while (currentDate.isSameOrBefore(endMoment)) {
                const monthStart = currentDate.format('YYYY-MM-DD');
                const monthEnd = moment.min(currentDate.clone().endOf('month'), endMoment).format('YYYY-MM-DD');

                const monthData = await fetchMonthData(monthStart, monthEnd, selectedStore.value);

                const avgMonthlySale = monthData.monthlySaleLogs.length > 0
                    ? monthData.monthlySaleLogs.reduce((sum: number, log: { newMonthlySale: number }) => sum + log.newMonthlySale, 0) / monthData.monthlySaleLogs.length
                    : 0;

                const avgIntent = monthData.intentLogs.length > 0
                    ? monthData.intentLogs.reduce((sum: number, log: { newIntentLevel: number }) => sum + log.newIntentLevel, 0) / monthData.intentLogs.length
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
                type: 'line' as const,
                label: 'Average Monthly Sales',
                data: monthlyData.map(data => Math.round(data.avgMonthlySale)),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y',
            },
            {
                type: 'bar' as const,
                label: 'Average Intent Level',
                data: monthlyData.map(data => Math.round(data.avgIntent)),
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
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
                },
                ticks: {
                    callback: (value) => Math.round(Number(value))
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
                ticks: {
                    callback: (value) => Math.round(Number(value))
                }
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
            tooltip: {
                callbacks: {
                    title: (context) => moment(context[0].parsed.x).format('MMMM YYYY')
                }
            }
        },
    };

    const handleStoreSelect = (selected: { value: number; label: string; city: string } | null) => {
        setSelectedStore(selected);
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
                <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Sales Performance Report</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Store Filter</label>
                            <Input
                                placeholder="Store Name"
                                name="storeName"
                                value={storeNameFilter}
                                onChange={handleFilterChange}
                                className="mb-2"
                            />
                            <Input
                                placeholder="City"
                                name="city"
                                value={cityFilter}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Store Selection</label>
                            <Select
                                options={stores}
                                value={selectedStore}
                                onChange={handleStoreSelect}
                                className="basic-single mb-2"
                                classNamePrefix="select"
                                placeholder="Select Store"
                            />
                            <div className="flex justify-between items-center">
                                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} size="sm">Previous</Button>
                                <span className="text-sm">Page {currentPage + 1} of {totalPages}</span>
                                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} size="sm">Next</Button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date Range</label>
                            <Input
                                type="date"
                                name="startDate"
                                value={startDate}
                                onChange={handleDateChange}
                                className="mb-2"
                            />
                            <Input
                                type="date"
                                name="endDate"
                                value={endDate}
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button onClick={fetchStores}>Apply Filters</Button>
                        <Button onClick={fetchReportData} disabled={loading || !selectedStore}>
                            Generate Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading && <p className="text-center py-4">Loading...</p>}
            {error && <p className="text-red-500 text-center py-4">{error}</p>}

            {monthlyData.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-4">Monthly Report for {selectedStore?.label}</h2>
                        <div className="h-[500px]">
                            <Chart type="bar" data={chartData} options={chartOptions} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SalesPerformanceReport;