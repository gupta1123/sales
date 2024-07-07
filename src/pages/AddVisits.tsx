'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  role: string;
}

interface Store {
  storeId: number;
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
  const loggedInUserId = 86; // Set the assignedById to a constant value of 86

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchStores(selectedEmployee);
    }
  }, [selectedEmployee]);

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

  const fetchStores = async (employeeId: string) => {
    try {
      const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/getByEmployee?id=${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      storeId: parseInt(selectedStore, 10),
      employeeId: parseInt(selectedEmployee, 10),
      visit_date: visitDate ? format(visitDate, "yyyy-MM-dd") : "",
      purpose: visitPurpose === 'Others' ? otherPurpose : visitPurpose,
      isSelfGenerated: false,
      assignedById: loggedInUserId,
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

  const purposes = [
    'Follow Up',
    'Order',
    'Birthday',
    'Payment',
    'Others'
  ];

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="visitDate">Visit Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="visitPurpose">Visit Purpose</Label>
          <Select
            value={visitPurpose}
            onValueChange={setVisitPurpose}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visit purpose" />
            </SelectTrigger>
            <SelectContent>
              {purposes.map((purpose) => (
                <SelectItem key={purpose} value={purpose}>
                  {purpose}
                </SelectItem>
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee">Employee</Label>
          <Select
            value={selectedEmployee}
            onValueChange={(value) => {
              setSelectedEmployee(value);
              setSelectedStore('');
              fetchStores(value); // Fetch stores when an employee is selected
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
              {stores.map((store) => (
                <SelectItem key={store.storeId} value={store.storeId.toString()}>
                  {store.storeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Submit Visit</Button>
      </div>
    </form>
  );
};

export default AddVisits;
