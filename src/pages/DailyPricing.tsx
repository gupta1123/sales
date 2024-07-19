import React, { useState, useEffect } from 'react';
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
    PaginationEllipsis,
} from '@/components/ui/pagination';

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
    lastName: string;
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
    const rowsPerPage = 10;
    const token = useSelector((state: RootState) => state.auth.token);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);

    useEffect(() => {
        fetchBrandDataForToday();
        fetchEmployees();
    }, []);

    useEffect(() => {
        filterAndSortBrandData();
    }, [searchText, selectedEmployee, selectedStartDate, selectedEndDate, brandData, currentPage]);

    const formatDate = (dateString: string) => {
        const date = dayjs(dateString);
        return date.format('YYYY-MM-DD');
    };

    const fetchBrandDataForToday = async () => {
        fetchBrandData(selectedStartDate, selectedEndDate);
    };

    const fetchBrandData = async (start: string, end: string) => {
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
    };

    const fetchEmployees = async () => {
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
    };

    const filterAndSortBrandData = () => {
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Daily Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <Input
                                type="text"
                                placeholder="Search by Brand Name"
                                value={searchText}
                                onChange={handleSearchChange}
                            />
                            <Select onValueChange={handleEmployeeChange}>
                                <SelectTrigger className="w-[180px]">
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
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsStartDatePickerOpen(!isStartDatePickerOpen)}
                                >
                                    Start Date: {selectedStartDate || 'Select'}
                                </Button>
                                {isStartDatePickerOpen && (
                                    <Card className="absolute z-10">
                                        <Calendar
                                            mode="single"
                                            selected={selectedStartDate ? new Date(selectedStartDate) : undefined}
                                            onSelect={handleStartDateChange}
                                        />
                                    </Card>
                                )}
                            </div>
                            <div className="relative ml-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEndDatePickerOpen(!isEndDatePickerOpen)}
                                >
                                    End Date: {selectedEndDate || 'Select'}
                                </Button>
                                {isEndDatePickerOpen && (
                                    <Card className="absolute z-10">
                                        <Calendar
                                            mode="single"
                                            selected={selectedEndDate ? new Date(selectedEndDate) : undefined}
                                            onSelect={handleEndDateChange}
                                        />
                                    </Card>
                                )}
                            </div>
                        </div>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button>Create Pricing</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Create Pricing</DialogTitle>
                                    <DialogDescription className="mt-2">
                                        Enter the details to create a new pricing entry.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="brandName" className="text-right">
                                            Brand Name
                                        </Label>
                                        <Input
                                            id="brandName"
                                            value={newBrand.brandName || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, brandName: e.target.value })
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="price" className="text-right">
                                            Price
                                        </Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={newBrand.price || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, price: Number(e.target.value) })
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="employee" className="text-right">
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
                                                <SelectTrigger className="w-full">
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
                                        <Label htmlFor="city" className="text-right">
                                            City
                                        </Label>
                                        <Input
                                            id="city"
                                            value={newBrand.city || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, city: e.target.value })
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="state" className="text-right">
                                            State
                                        </Label>
                                        <Input
                                            id="state"
                                            value={newBrand.state || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, state: e.target.value })
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="metric" className="text-right">
                                            Metric
                                        </Label>
                                        <Input
                                            id="metric"
                                            value={newBrand.metric || ''}
                                            onChange={(e) =>
                                                setNewBrand({ ...newBrand, metric: e.target.value })
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" onClick={handleCreateBrand}>
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Brand Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Date & Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBrandData.map((brand) => (
                                <TableRow key={brand.id}>
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
