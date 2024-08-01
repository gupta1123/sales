'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface Store {
  id: number;
  storeName: string;
}

interface AddVisitsProps {
  closeModal: () => void;
}

const AddVisits: React.FC<AddVisitsProps> = ({ closeModal }) => {
  const [visitDate, setVisitDate] = useState<Date | undefined>(undefined);
  const [visitPurpose, setVisitPurpose] = useState('');
  const [otherPurpose, setOtherPurpose] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');

  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const employeeId = useSelector((state: RootState) => state.auth.employeeId);
  const loggedInUserId = useSelector((state: RootState) => state.auth.employeeId);

  const purposes = ['Follow Up', 'Order', 'Birthday', 'Payment', 'Others'];

  const fetchEmployees = useCallback(async () => {
    try {
      const url = role === 'MANAGER'
        ? `http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/team/getbyEmployee?id=${employeeId}`
        : 'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/employee/getAll';

      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      setEmployees(role === 'MANAGER' ? (data[0]?.fieldOfficers || []) : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [role, employeeId, token]);

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/names', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (Array.isArray(data)) {
        setStores(data);
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      storeId: parseInt(selectedStore, 10),
      employeeId: parseInt(selectedEmployee, 10),
      visit_date: visitDate ? format(visitDate, "yyyy-MM-dd") : "",
      purpose: visitPurpose === 'Others' ? otherPurpose : visitPurpose,
      isSelfGenerated: role !== 'MANAGER',
      ...(role === 'MANAGER' && { assignedById: loggedInUserId })
    };

    try {
      const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/visit/create', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Visit created successfully:', data);
        closeModal(); // Close the modal
      } else {
        console.error('Failed to create visit');
      }
    } catch (error) {
      console.error('Error creating visit:', error);
    }
  };

  const StoreItem = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const store = stores[index];
    if (!store) return null;
    return (
      <div style={style}>
        <SelectItem value={store.id.toString()}>
          {store.storeName}
        </SelectItem>
      </div>
    );
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="visitDate">Visit Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !visitDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {visitDate ? format(visitDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={visitDate}
              onSelect={setVisitDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="visitPurpose">Visit Purpose</Label>
        <Select value={visitPurpose} onValueChange={setVisitPurpose}>
          <SelectTrigger>
            <SelectValue placeholder="Select visit purpose" />
          </SelectTrigger>
          <SelectContent>
            {purposes.map((purpose) => (
              <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visitPurpose === 'Others' && (
        <div>
          <Label htmlFor="otherPurpose">Other Purpose</Label>
          <Input
            id="otherPurpose"
            value={otherPurpose}
            onChange={(e) => setOtherPurpose(e.target.value)}
            placeholder="Specify other purpose"
          />
        </div>
      )}

      <div>
        <Label htmlFor="employee">Employee</Label>
        <Select
          value={selectedEmployee}
          onValueChange={(value) => {
            setSelectedEmployee(value);
            setSelectedStore('');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an employee" />
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

      <div>
        <Label htmlFor="store">Store</Label>
        <Select
          value={selectedStore}
          onValueChange={setSelectedStore}
          disabled={!selectedEmployee}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            <div style={{ height: '200px' }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={stores.length}
                    itemSize={35}
                    width={width}
                    overscanCount={5}
                  >
                    {StoreItem}
                  </List>
                )}
              </AutoSizer>
            </div>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Submit Visit</Button>
      </div>
    </form>
  );
};

export default AddVisits;
