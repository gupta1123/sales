import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from '@/components/ui/pagination';
import { CurrencyRupeeIcon } from '@heroicons/react/24/solid'; // Replace with a relevant icon

dayjs.extend(isBetween);

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

interface Employee {
    id: number;
    firstName: string;
    lastName: string; // This line needs to be added/modified to include the type for lastName
}

const DailyPricingPage = () => {
    const [brandData, setBrandData] = useState<Brand[]>([]);
    const [filteredBrandData, setFilteredBrandData] = useState<Brand[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedStartDate, setSelectedStartDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedEndDate, setSelectedEndDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBrand, setNewBrand] = useState<Partial<Brand>>({});
    const [noDataMessage, setNoDataMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [todayGajkesariPrice, setTodayGajkesariPrice] = useState<number | null>(null);
    const rowsPerPage = 10;
    const token = useSelector((state: RootState) => state.auth.token);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);

 


    const fetchTodayGajkesariPrice = useCallback(async () => {
        try {
            const today = dayjs().format('YYYY-MM-DD');
            const url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/getByDateRange?start=${today}&end=${today}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            const gajkesariPrice = data.find((brand: Brand) => brand.brandName === 'Gajkesari')?.price || null;
            setTodayGajkesariPrice(gajkesariPrice);
        } catch (error) {
            console.error('Error fetching Gajkesari price:', error);
        }
    }, [token]);

    const fetchBrandData = useCallback(async (start: string, end: string) => {
        try {
            let url = '';
            if (role === 'MANAGER' && teamId) {
                url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/getByTeamAndDate?id=${teamId}&start=${start}&end=${end}`;
            } else {
                url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/getByDateRange?start=${start}&end=${end}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.length === 0) {
                setNoDataMessage('No data available for the selected date range. Please choose a different date.');
            } else {
                setNoDataMessage('');
            }
            setBrandData(data);
        } catch (error) {
            console.error('Error fetching brand data:', error);
        }
    }, [role, teamId, token]);
    const fetchBrandDataForToday = useCallback(() => {
        fetchBrandData(selectedStartDate, selectedEndDate);
    }, [selectedStartDate, selectedEndDate, fetchBrandData]);
    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [token]);

    const filterAndSortBrandData = useCallback(() => {
        let filtered = brandData;

        if (searchText) {
            filtered = filtered.filter((brand) =>
                brand.brandName.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (selectedEmployee !== 'all') {
            filtered = filtered.filter(
                (brand) => brand.employeeDto.id === Number(selectedEmployee)
            );
        }

        if (selectedStartDate && selectedEndDate) {
            filtered = filtered.filter((brand) =>
                dayjs(brand.createdAt).isBetween(selectedStartDate, selectedEndDate, null, '[]')
            );
        }

        filtered.sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix());

        setFilteredBrandData(filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage));
    }, [brandData, searchText, selectedEmployee, selectedStartDate, selectedEndDate, currentPage]);

    useEffect(() => {
        fetchBrandDataForToday();
        fetchEmployees();
        fetchTodayGajkesariPrice();
    }, [fetchBrandDataForToday, fetchEmployees, fetchTodayGajkesariPrice]);

    useEffect(() => {
        filterAndSortBrandData();
    }, [searchText, selectedEmployee, selectedStartDate, selectedEndDate, brandData, currentPage, filterAndSortBrandData]);

    const formatDate = (dateString: string) => {
        const date = dayjs(dateString);
        return date.format('YYYY-MM-DD');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    const handleEmployeeChange = (value: string) => {
        setSelectedEmployee(value);
    };

    const handleStartDateChange = (date: Date | undefined) => {
        if (date) {
            const formattedDate = dayjs(date).format('YYYY-MM-DD');
            setSelectedStartDate(formattedDate);
            setIsStartDatePickerOpen(false);
            if (selectedEndDate) {
                fetchBrandData(formattedDate, selectedEndDate);
            }
        }
    };

    const handleEndDateChange = (date: Date | undefined) => {
        if (date) {
            const formattedDate = dayjs(date).format('YYYY-MM-DD');
            setSelectedEndDate(formattedDate);
            setIsEndDatePickerOpen(false);
            if (selectedStartDate) {
                fetchBrandData(selectedStartDate, formattedDate);
            }
        }
    };

    const handleCreateBrand = async () => {
        try {
            const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newBrand),
            });

            if (response.ok) {
                fetchBrandDataForToday();
                setIsModalOpen(false);
                setNewBrand({});
            } else {
                console.error('Error creating brand');
            }
        } catch (error) {
            console.error('Error creating brand:', error);
        }
    };

    const totalPages = Math.ceil(brandData.length / rowsPerPage);

    return (
        <div className="container mx-auto py-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-3xl font-bold text-gray-800">Daily Pricing</CardTitle>
                        {todayGajkesariPrice !== null && (
                            <div className="bg-black p-3 rounded-lg shadow-md flex items-center space-x-3">
                                <CurrencyRupeeIcon className="h-6 w-6 text-white" />
                                <div className="text-white text-lg font-semibold">
                                    Today&apos;s Gajkesari Price: ₹{todayGajkesariPrice.toLocaleString()}
                                </div>

                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row items-center justify-between mb-6 space-y-4 lg:space-y-0 lg:space-x-4">
                        <Input
                            type="text"
                            placeholder="Search by Brand Name"
                            value={searchText}
                            onChange={handleSearchChange}
                            className="flex-1 border-gray-300 rounded-lg shadow-sm"
                        />
                        <div className="w-[180px]">
                            <Select onValueChange={handleEmployeeChange}>
                                <SelectTrigger className="w-full border-gray-300 rounded-lg shadow-sm">
                                    <SelectValue placeholder="Filter by Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {employees.map((employee) => (
                                        <SelectItem key={employee.id} value={employee.id.toString()}>
                                            {`${employee.firstName} ${employee.lastName}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative">
                            <Button
                                variant="outline"
                                onClick={() => setIsStartDatePickerOpen(!isStartDatePickerOpen)}
                                className="flex-1 border-gray-300 rounded-lg shadow-sm"
                            >
                                Start Date: {selectedStartDate || 'Select'}
                            </Button>
                            {isStartDatePickerOpen && (
                                <Card className="absolute z-10 mt-2">
                                    <Calendar
                                        mode="single"
                                        selected={selectedStartDate ? new Date(selectedStartDate) : undefined}
                                        onSelect={handleStartDateChange}
                                    />
                                </Card>
                            )}
                        </div>
                        <div className="relative">
                            <Button
                                variant="outline"
                                onClick={() => setIsEndDatePickerOpen(!isEndDatePickerOpen)}
                                className="flex-1 border-gray-300 rounded-lg shadow-sm"
                            >
                                End Date: {selectedEndDate || 'Select'}
                            </Button>
                            {isEndDatePickerOpen && (
                                <Card className="absolute z-10 mt-2">
                                    <Calendar
                                        mode="single"
                                        selected={selectedEndDate ? new Date(selectedEndDate) : undefined}
                                        onSelect={handleEndDateChange}
                                    />
                                </Card>
                            )}
                        </div>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex-1 lg:flex-none bg-black text-white rounded-lg shadow-sm">Create Pricing</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-md">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-gray-800">Create Pricing</DialogTitle>
                                    <DialogDescription className="mt-2 text-gray-600">
                                        Enter the details to create a new pricing entry.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="brandName" className="text-right text-gray-600">
                                            Brand Name
                                        </Label>
                                        <Input
                                            id="brandName"
                                            value={newBrand.brandName || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, brandName: e.target.value })
                                            }
                                            className="col-span-3 border-gray-300 rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="price" className="text-right text-gray-600">
                                            Price
                                        </Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={newBrand.price || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, price: Number(e.target.value) })
                                            }
                                            className="col-span-3 border-gray-300 rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="employee" className="text-right text-gray-600">
                                            Employee Name
                                        </Label>
                                        <div className="col-span-3">
                                            <Select
                                                onValueChange={(value) => {
                                                    const selectedEmployee = employees.find((employee) => employee.id === Number(value));
                                                    if (selectedEmployee) {
                                                        setNewBrand({
                                                            ...newBrand,
                                                            employeeDto: {
                                                                id: selectedEmployee.id,
                                                                firstName: selectedEmployee.firstName,
                                                                lastName: selectedEmployee.lastName,
                                                            },
                                                        });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full border-gray-300 rounded-lg shadow-sm">
                                                    <SelectValue placeholder="Select Employee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employees.map((employee) => (
                                                        <SelectItem key={employee.id} value={employee.id.toString()}>
                                                            {`${employee.firstName} ${employee.lastName}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="city" className="text-right text-gray-600">
                                            City
                                        </Label>
                                        <Input
                                            id="city"
                                            value={newBrand.city || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, city: e.target.value })
                                            }
                                            className="col-span-3 border-gray-300 rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="state" className="text-right text-gray-600">
                                            State
                                        </Label>
                                        <Input
                                            id="state"
                                            value={newBrand.state || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, state: e.target.value })
                                            }
                                            className="col-span-3 border-gray-300 rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="metric" className="text-right text-gray-600">
                                            Metric
                                        </Label>
                                        <Input
                                            id="metric"
                                            value={newBrand.metric || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, metric: e.target.value })
                                            }
                                            className="col-span-3 border-gray-300 rounded-lg shadow-sm"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" onClick={handleCreateBrand} className="bg-black text-white rounded-lg shadow-sm">
                                        Create
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {noDataMessage && (
                        <div className="text-red-500 mb-4">
                            {noDataMessage}
                        </div>
                    )}
                    <Table className="bg-white rounded-lg shadow-sm">
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead>Brand Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Date & Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBrandData.map((brand) => (
                                <TableRow key={brand.id} className="hover:bg-gray-100">
                                    <TableCell>{brand.brandName}</TableCell>
                                    <TableCell>{brand.price}</TableCell>
                                    <TableCell>{brand.city}</TableCell>
                                    <TableCell>{`${brand.employeeDto.firstName} ${brand.employeeDto.lastName}`}</TableCell>
                                    <TableCell>{formatDate(brand.createdAt)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination className="mt-4">
                        <PaginationContent>
                            <PaginationPrevious
                                onClick={() => currentPage > 1 && setCurrentPage((prev) => prev - 1)}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                            {Array.from({ length: totalPages }, (_, index) => (
                                <PaginationItem key={index}>
                                    <PaginationLink
                                        isActive={currentPage === index + 1}
                                        onClick={() => setCurrentPage(index + 1)}
                                    >
                                        {index + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationNext
                                onClick={() => currentPage < totalPages && setCurrentPage((prev) => prev + 1)}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationContent>
                    </Pagination>
                </CardContent>
            </Card>
        </div>
    );
};

export default DailyPricingPage;
