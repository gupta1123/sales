import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ClipLoader } from 'react-spinners';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Brand {
    id: number;
    brandName: string;
    price: number;
    city: string;
    state: string;
    employeeDto: {
        id: number;
        firstName: string;
        lastName: string;
    };
    metric: string;
    createdAt: string;
    updatedAt: string;
}

const DailyPricingPage = () => {
    const [brandData, setBrandData] = useState<Brand[]>([]);
    const [previousDayData, setPreviousDayData] = useState<Brand[]>([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [cities, setCities] = useState<string[]>([]);
    const [gajkesariRate, setGajkesariRate] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const token = useSelector((state: RootState) => state.auth.token);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);

    useEffect(() => {
        fetchData();
    }, [selectedCity, selectedDate]);

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchBrandData(), fetchPreviousDayData()]);
        setIsLoading(false);
    };

    const fetchBrandData = useCallback(async () => {
        try {
            const formattedStartDate = dayjs(selectedDate).startOf('day').format('YYYY-MM-DD');
            const formattedEndDate = dayjs(selectedDate).endOf('day').format('YYYY-MM-DD');

            const url = role === 'MANAGER'
                ? `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/getByTeamAndDate?id=${teamId}&start=${formattedStartDate}&end=${formattedEndDate}`
                : `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/getByDateRange?start=${formattedStartDate}&end=${formattedEndDate}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data: Brand[] = await response.json();
            setBrandData(data);

            // Extract unique cities and ensure no empty values
            const uniqueCities = Array.from(new Set(data.map(brand => brand.city).filter(city => city.trim() !== "")));
            setCities(uniqueCities);

            // Set default selected city if not already set
            if (!selectedCity && uniqueCities.length > 0) {
                setSelectedCity(uniqueCities[0]);
            }

            // Find Gajkesari rate
            const gajkesariBrand = data.find(brand => brand.brandName.toLowerCase() === 'gajkesari');
            setGajkesariRate(gajkesariBrand ? gajkesariBrand.price : 0);
        } catch (error) {
            console.error('Error fetching brand data:', error);
            setBrandData([]);
            setGajkesariRate(0);
        }
    }, [role, selectedDate, teamId, token, selectedCity]);

    const fetchPreviousDayData = useCallback(async () => {
        const previousDay = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
        try {
            const url = role === 'MANAGER'
                ? `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/getByTeamAndDate?id=${teamId}&start=${previousDay}&end=${previousDay}`
                : `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/getByDateRange?start=${previousDay}&end=${previousDay}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data: Brand[] = await response.json();
            setPreviousDayData(data);
        } catch (error) {
            console.error('Error fetching previous day data:', error);
            setPreviousDayData([]);
        }
    }, [role, selectedDate, teamId, token]);

    const filteredBrands = brandData.filter(brand => brand.city === selectedCity);

    const calculatePriceChange = (currentPrice: number, brandName: string) => {
        const previousBrand = previousDayData.find(brand => brand.brandName === brandName && brand.city === selectedCity);
        if (previousBrand) {
            const change = currentPrice - previousBrand.price;
            const prefix = change >= 0 ? '+' : '-';
            return `${prefix}₹${Math.abs(change).toFixed(2)}`;
        }
        return 'N/A';
    };

    const chartData = {
        labels: filteredBrands.map(brand => brand.brandName).concat(['Gajkesari']),
        datasets: [
            {
                label: 'Competitor Prices (₹/ton)',
                data: filteredBrands.map(brand => brand.price).concat([gajkesariRate]),
                backgroundColor: filteredBrands.map(() => 'rgba(0, 0, 0, 0.6)').concat(['rgba(128, 128, 128, 0.6)']),
                borderColor: filteredBrands.map(() => 'rgba(0, 0, 0, 1)').concat(['rgba(128, 128, 128, 1)']),
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (tickValue: string | number) => {
                        // Ensure that tickValue is a number before formatting
                        const value = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
                        return `₹${value}`;
                    },
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `₹${context.parsed.y}/ton`,
                },
            },
        },
    };


    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <Card className="shadow-lg">
                <CardHeader className="bg-white">
                    <CardTitle className="text-3xl font-bold text-black">TMT Bars Pricing Report</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex space-x-4">
                            <Select value={selectedCity} onValueChange={setSelectedCity}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem key={city} value={city}>
                                            {city}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>
                        {gajkesariRate > 0 && (
                            <div className="text-right">
                                <h2 className="text-2xl">
                                    Gajkesari Rate: <span className="font-bold">₹{gajkesariRate}/ton</span>
                                </h2>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <ClipLoader color="#000000" size={50} />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto mb-8">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-3 text-left">Competitor</th>
                                            <th className="p-3 text-right">TMT Bar Price (₹/ton)</th>
                                            <th className="p-3 text-right">Change from Previous Day</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBrands.map((brand) => (
                                            <tr key={brand.id} className="border-b border-gray-300 hover:bg-gray-50">
                                                <td className="p-3">{brand.brandName}</td>
                                                <td className="p-3 text-right">₹{brand.price}/ton</td>
                                                <td className="p-3 text-right">{calculatePriceChange(brand.price, brand.brandName)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="h-96">
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DailyPricingPage;
