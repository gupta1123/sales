import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from 'react-query';
import { QueryClient, QueryClientProvider } from 'react-query';
import { QueryKey } from 'react-query';
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ChangeFieldOfficerDialog from './ChangeFieldOfficerDialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { FiPhone, FiUser, FiDollarSign, FiTarget, FiBriefcase } from "react-icons/fi";
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddCustomerModal from './AddCustomerModal';
import { AiFillCaretDown } from "react-icons/ai";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useRouter } from 'next/router';

const queryClient = new QueryClient();

export default function CustomerListPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <CustomerListContent />
        </QueryClientProvider>
    );
}

type Customer = {
    storeId: number;
    storeName: string;
    clientFirstName: string;
    clientLastName: string;
    primaryContact: number;
    monthlySale: number | null;
    intent: number | null;
    employeeName: string;
    clientType: string | null;
    totalVisitCount: number;
    lastVisitDate: string | null;
    totalVisits: number;
    email: string | null;
    city: string;
    state: string;
    country: string | null;
    customClientType: string | null;
};

function CustomerListContent() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const [selectedColumns, setSelectedColumns] = useState<string[]>([
        'shopName', 'ownerName', 'city', 'state', 'phone', 'monthlySales', 'intentLevel', 'fieldOfficer',
        'clientType', 'totalVisits', 'lastVisitDate', 'email',
    ]);
    const [filters, setFilters] = useState({
        storeName: '',
        primaryContact: '',
        ownerName: '',
        city: '',
        state: '',
        monthlySale: '',
        clientType: '',
    });
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isChangeFieldOfficerDialogOpen, setIsChangeFieldOfficerDialogOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [sortColumn, setSortColumn] = useState<string | null>('storeName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const token = useSelector((state: RootState) => state.auth.token);
    const employeeId = useSelector((state: RootState) => state.auth.employeeId);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);

    const fetchFilteredCustomers = async ({ queryKey }: { queryKey: any }) => {
        const { page, size, filters, sortColumn, sortDirection, role, teamId } = queryKey[1];

        let url: string;
        const queryParams = new URLSearchParams();

        if (role === 'MANAGER' && teamId) {
            url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/getForTeam`;
            queryParams.append('teamId', teamId.toString());
        } else {
            url = `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/filteredValues`;
            if (filters.storeName) queryParams.append('storeName', filters.storeName);
            if (filters.primaryContact) queryParams.append('primaryContact', filters.primaryContact);
            if (filters.ownerName) queryParams.append('ownerName', filters.ownerName);
            if (filters.city) queryParams.append('city', filters.city);
            if (filters.state) queryParams.append('state', filters.state);
            if (filters.monthlySale) queryParams.append('monthlySale', filters.monthlySale);
            if (filters.clientType) queryParams.append('clientType', filters.clientType);
        }

        queryParams.append('page', (page - 1).toString());
        queryParams.append('size', size.toString());

        if (sortColumn) {
            queryParams.append('sort', `${sortColumn},${sortDirection}`);
        }

        const response = await fetch(`${url}?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return response.json();
    };

    const { data, isLoading, isError, error } = useQuery(
        ['customers', { page: currentPage, size: itemsPerPage, filters, sortColumn, sortDirection, role, teamId }],
        fetchFilteredCustomers
    );

    const customers = data?.content || [];
    const totalCustomers = data?.totalElements || 0;
    const totalPages = data ? data.totalPages : 1;

    const openDeleteModal = (customerId: string) => {
        setSelectedCustomerId(customerId);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedCustomerId(null);
        setIsDeleteModalOpen(false);
    };

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: value,
        }));
        setCurrentPage(1);
    };

    const handleFilterClear = (filterName: keyof typeof filters) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: '',
        }));
        setCurrentPage(1);
    };

    const handleDeleteConfirm = async () => {
        if (selectedCustomerId) {
            try {
                const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/deleteById?id=${selectedCustomerId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    queryClient.invalidateQueries('customers');
                    closeDeleteModal();
                } else {
                    console.error('Failed to delete customer');
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newValue = parseInt(value, 10);
        if (!isNaN(newValue)) {
            setItemsPerPage(newValue);
            setCurrentPage(1);
        }
    };

    const handleSelectColumn = (column: string) => {
        if (selectedColumns.includes(column)) {
            setSelectedColumns(selectedColumns.filter((col) => col !== column));
        } else {
            setSelectedColumns([...selectedColumns, column]);
        }
    };

    const handleSelectAllRows = () => {
        if (selectedRows.length === customers.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(customers.map((customer: Customer) => customer.storeId.toString()));
        }
    };

    const handleSelectRow = (customerId: string) => {
        if (selectedRows.includes(customerId)) {
            setSelectedRows(selectedRows.filter((id) => id !== customerId));
        } else {
            setSelectedRows([...selectedRows, customerId]);
        }
    };

    const handleBulkAction = (action: string) => {
        if (action === 'changeFieldOfficer') {
            setIsChangeFieldOfficerDialogOpen(true);
        } else {
            console.log(`Performing ${action} on selected rows:`, selectedRows);
        }
    };

    const handleChangeFieldOfficerConfirm = (selectedFieldOfficer: string) => {
        console.log('Changing field officer to:', selectedFieldOfficer);
        console.log('Selected rows:', selectedRows);
        setIsChangeFieldOfficerDialogOpen(false);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const displayPages = 5;
        const groupSize = 10;

        let startPage = Math.max(currentPage - Math.floor(displayPages / 2), 1);
        let endPage = startPage + displayPages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - displayPages + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <Pagination>
                <PaginationContent>
                    {currentPage !== 1 && (
                        <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                        />
                    )}
                    {startPage > 1 && (
                        <>
                            <PaginationItem>
                                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                            </PaginationItem>
                            {startPage > 2 && (
                                <PaginationItem>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}
                        </>
                    )}
                    {pageNumbers.map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                isActive={page === currentPage}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <PaginationItem>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                            </PaginationItem>
                        </>
                    )}
                    {currentPage !== totalPages && (
                        <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                        />
                    )}
                </PaginationContent>
            </Pagination>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold">Customer List</h1>
                <div className="flex items-center space-x-2">
                    {viewMode === 'table' && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">Columns</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {['shopName', 'ownerName', 'city', 'state', 'phone', 'monthlySales', 'intentLevel', 'fieldOfficer', 'clientType', 'totalVisits', 'lastVisitDate', 'email'].map(
                                        (column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column}
                                                checked={selectedColumns.includes(column)}
                                                onCheckedChange={() => handleSelectColumn(column)}
                                            >
                                                {column}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                    <Button variant="outline" onClick={openModal}>
                        Add Customer
                    </Button>
                </div>
            </div>
            <AddCustomerModal
                isOpen={isModalOpen}
                onClose={closeModal}
                token={token || ''}
                employeeId={employeeId ? Number(employeeId) : null}
            />

            {role === 'MANAGER' && (
                <div className="mb-4">
                    <h2 className="text-xl font-semibold">Team Customers</h2>
                </div>
            )}

            <>
                <div className="mb-4 flex flex-wrap space-x-4 text-sm font-poppins">
                    <div className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Filter by city"
                            className="border border-gray-300 rounded-md px-4 py-2 pr-10 w-full"
                            value={filters.city}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                        />
                        {filters.city && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => handleFilterClear('city')}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    <div className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Filter by Shop name"
                            className="border border-gray-300 rounded-md px-4 py-2 pr-10 w-full"
                            value={filters.storeName}
                            onChange={(e) => handleFilterChange('storeName', e.target.value)}
                        />
                        {filters.storeName && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => handleFilterClear('storeName')}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    <div className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Filter by owner"
                            className="border border-gray-300 rounded-md px-4 py-2 pr-10 w-full"
                            value={filters.ownerName}
                            onChange={(e) => handleFilterChange('ownerName', e.target.value)}
                        />
                        {filters.ownerName && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => handleFilterClear('ownerName')}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    <div className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Filter by phone number"
                            className="border border-gray-300 rounded-md px-4 py-2 pr-10 w-full"
                            value={filters.primaryContact}
                            onChange={(e) => handleFilterChange('primaryContact', e.target.value)}
                        />
                        {filters.primaryContact && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => handleFilterClear('primaryContact')}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    <div className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Filter by client type"
                            className="border border-gray-300 rounded-md px-4 py-2 pr-10 w-full"
                            value={filters.clientType}
                            onChange={(e) => handleFilterChange('clientType', e.target.value)}
                        />
                        {filters.clientType && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => handleFilterClear('clientType')}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                <Table className="text-sm font-poppins">
                    <TableHeader>
                        <TableRow>
                            {selectedColumns.includes('shopName') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('storeName')}>
                                    Shop Name
                                    {sortColumn === 'storeName' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('ownerName') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('clientFirstName')}>
                                    Owner Name
                                    {sortColumn === 'clientFirstName' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('city') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('city')}>
                                    City
                                    {sortColumn === 'city' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('state') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('state')}>
                                    State
                                    {sortColumn === 'state' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('phone') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('primaryContact')}>
                                    Phone
                                    {sortColumn === 'primaryContact' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('monthlySales') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('monthlySale')}>
                                    Monthly Sales
                                    {sortColumn === 'monthlySale' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('intentLevel') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('intent')}>
                                    Intent Level
                                    {sortColumn === 'intent' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('fieldOfficer') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('employeeName')}>
                                    Field Officer
                                    {sortColumn === 'employeeName' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('clientType') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('clientType')}>
                                    Client Type
                                    {sortColumn === 'clientType' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('totalVisits') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('totalVisits')}>
                                    Total Visits
                                    {sortColumn === 'totalVisits' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('lastVisitDate') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('lastVisitDate')}>
                                    Last Visit Date
                                    {sortColumn === 'lastVisitDate' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            {selectedColumns.includes('email') && (
                                <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                                    Email
                                    {sortColumn === 'email' && (
                                        <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                    )}
                                </TableHead>
                            )}
                            <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {customers.map((customer: Customer) => (
                            <TableRow key={customer.storeId}>
                                {selectedColumns.includes('shopName') && <TableCell>{customer.storeName || ''}</TableCell>}
                                {selectedColumns.includes('ownerName') && (
                                    <TableCell>
                                        {customer.clientFirstName || customer.clientLastName
                                            ? `${customer.clientFirstName || ''} ${customer.clientLastName || ''}`.trim()
                                            : ''}
                                    </TableCell>
                                )}
                                {selectedColumns.includes('city') && <TableCell>{customer.city || ''}</TableCell>}
                                {selectedColumns.includes('state') && <TableCell>{customer.state || ''}</TableCell>}
                                {selectedColumns.includes('phone') && <TableCell>{customer.primaryContact || ''}</TableCell>}
                                {selectedColumns.includes('monthlySales') && (
                                    <TableCell>
                                        {customer.monthlySale !== null && customer.monthlySale !== undefined
                                            ? `${customer.monthlySale.toLocaleString()} tonnes`
                                            : ''}
                                    </TableCell>
                                )}
                                {selectedColumns.includes('intentLevel') && (
                                    <TableCell>{customer.intent !== null && customer.intent !== undefined ? customer.intent : ''}</TableCell>
                                )}
                                {selectedColumns.includes('fieldOfficer') && <TableCell>{customer.employeeName || ''}</TableCell>}
                                {selectedColumns.includes('clientType') && (
                                    <TableCell>
                                        <Badge variant="outline">
                                            {customer.clientType || ''}
                                        </Badge>
                                    </TableCell>
                                )}
                                {selectedColumns.includes('totalVisits') && <TableCell>{customer.totalVisitCount}</TableCell>}
                                {selectedColumns.includes('lastVisitDate') && (
                                    <TableCell>
                                        {customer.lastVisitDate
                                            ? new Date(customer.lastVisitDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                            })
                                            : ''}
                                    </TableCell>
                                )}
                                {selectedColumns.includes('email') && <TableCell>{customer.email || ''}</TableCell>}
                                <TableCell className="w-20">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <AiFillCaretDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => router.push(`/CustomerDetailPage/${customer.storeId}`)}>
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => openDeleteModal(customer.storeId.toString())}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-8 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span>Items per page:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger className="w-20">
                                <SelectValue placeholder={itemsPerPage.toString()} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {renderPagination()}
                </div>
            </>
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteConfirm}
            />
            <ChangeFieldOfficerDialog
                isOpen={isChangeFieldOfficerDialogOpen}
                onClose={() => setIsChangeFieldOfficerDialogOpen(false)}
                onConfirm={handleChangeFieldOfficerConfirm}
            />
        </div>
    );
}
