import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitsTimeline from "../VisitsTimeline";
import NotesSection from "../../components/NotesSection";
import BrandsSection from "../../components/BrandsSection";
import LikesSection from "../../components/LikesSection";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Label } from '@/components/ui/label';

interface CustomerData {
  storeId?: string;
  storeName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  monthlySale?: string;
  district?: string;
  subDistrict?: string;
  intent?: number;
  intentLevel?: number;
  fieldOfficer?: string;
  clientType?: string;
  clientFirstName?: string;
  clientLastName?: string;
  primaryContact?: string;
  employeeName?: string;
  secondaryContact?: string;
  email?: string;
  industry?: string;
  companySize?: number;
  gstNumber?: string;
  latitude?: number;
  longitude?: number;
  managers?: string[];
  brandsInUse?: string[];
  brandProCons?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  customClientType?: string;
}

export default function CustomerDetailPage() {
  const [activeTab, setActiveTab] = useState<"basic" | "contact" | "address" | "additional">("basic");
  const [rightTab, setRightTab] = useState<"visits" | "notes" | "Brands" | "Likes">("visits");
  const router = useRouter();
  const { storeId } = router.query as { storeId?: string };

  const [error, setError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData>({});
  const [initialData, setInitialData] = useState<CustomerData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const token = useSelector((state: RootState) => state.auth.token);
  const [customClientType, setCustomClientType] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const payload = getEditedFields(initialData, customerData);

      const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/edit?id=${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsEditing(false);
      } else {
        console.error("Error updating customer:", await response.text());
      }
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleInputChange = (field: keyof CustomerData, value: string | number | string[]) => {
    setCustomerData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const getEditedFields = (initialData: CustomerData, currentData: CustomerData): Partial<Record<keyof CustomerData, string | number | string[] | undefined>> => {
    const editedFields: Partial<Record<keyof CustomerData, string | number | string[] | undefined>> = {};

    for (const key in currentData) {
      const initialValue = initialData[key as keyof CustomerData];
      const currentValue = currentData[key as keyof CustomerData];

      if (initialValue !== currentValue) {
        if (Array.isArray(currentValue)) {
          // If the current value is an array, convert it to a string before assigning
          editedFields[key as keyof CustomerData] = currentValue.join(',');
        } else if (typeof currentValue !== 'undefined') {
          // If the current value is not an array and not undefined, assign it as is
          editedFields[key as keyof CustomerData] = currentValue;
        }
      }
    }

    return editedFields;
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/getById?id=${storeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setCustomerData(data);
        setInitialData(data);
        if (data.clientType === 'custom') {
          setCustomClientType(data.customClientType);
        }
        setIsLoading(false);
      } catch (error) {
        setError('Customer not found!');
        setIsLoading(false);
      }
    };

    if (storeId && token) {
      fetchCustomerData();
    }
  }, [storeId, token]);

  const getInitials = (name: string | undefined) => {
    if (!name) return '';
    const names = name.split(' ');
    const firstInitial = names[0]?.charAt(0).toUpperCase() || '';
    const lastInitial = names[1]?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Customer Detail</h1>

      <div className="flex">
        {/* Left Panel */}
        <div className="w-1/3 pr-8">
          <Card className="bg-#000000-50 rounded-lg shadow-lg mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(customerData.storeName)}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-#000000-900">{customerData.storeName}</h2>
                    <div className="text-sm text-#000000-900">
                      <p><b>Type:</b> {customerData.clientType}</p>
                      <p><b>Intent Level:</b> {customerData.intent}</p>
                      <p><b>Employee:</b> {customerData.employeeName}</p>
                      <p><b>Sales:</b> {customerData.monthlySale} tn</p>
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="p-1">
                    <Edit className="w-4 h-4 text-#000000-900" />
                  </Button>
                )}
              </div>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "basic" | "contact" | "address" | "additional")} defaultValue="basic">
                <TabsList className="grid grid-cols-3 gap-4 mb-6">
                  <TabsTrigger value="basic" className="text-sm font-semibold py-2">General</TabsTrigger>
                  <TabsTrigger value="address" className="text-sm font-semibold py-2">Address</TabsTrigger>
                  <TabsTrigger value="additional" className="text-sm font-semibold py-2">Additional</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shopName" className="text-sm font-medium text-#000000-700">Shop Name</Label>
                      <Input
                        id="shopName"
                        value={customerData.storeName || ''}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientFirstName" className="text-sm font-medium text-#000000-700">First Name</Label>
                      <Input
                        id="clientFirstName"
                        value={customerData.clientFirstName || ''}
                        onChange={(e) => handleInputChange('clientFirstName', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientLastName" className="text-sm font-medium text-#000000-700">Last Name</Label>
                      <Input
                        id="clientLastName"
                        value={customerData.clientLastName || ''}
                        onChange={(e) => handleInputChange('clientLastName', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryContact" className="text-sm font-medium text-#000000-700">Primary Phone Number</Label>
                      <Input
                        id="primaryContact"
                        type="tel"
                        value={customerData.primaryContact || ''}
                        onChange={(e) => handleInputChange('primaryContact', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-#000000-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addressLine1" className="text-sm font-medium text-#000000-700">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={customerData.addressLine1 || ''}
                        onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressLine2" className="text-sm font-medium text-#000000-700">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={customerData.addressLine2 || ''}
                        onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-#000000-700">City</Label>
                      <Input
                        id="city"
                        value={customerData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-sm font-medium text-#000000-700">State</Label>
                      <Input
                        id="state"
                        value={customerData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="district" className="text-sm font-medium text-#000000-700">Taluka</Label>
                      <Input
                        id="district"
                        value={customerData.district || ''}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subDistrict" className="text-sm font-medium text-#000000-700">Village</Label>
                      <Input
                        id="subDistrict"
                        value={customerData.subDistrict || ''}
                        onChange={(e) => handleInputChange('subDistrict', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode" className="text-sm font-medium text-#000000-700">Pincode</Label>
                      <Input
                        id="pincode"
                        type="number"
                        value={customerData.pincode || ''}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="additional" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Label htmlFor="monthlySale" className="text-sm font-medium text-#000000-700">
                        Monthly Sale
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="monthlySale"
                          type="number"
                          value={customerData.monthlySale || ''}
                          onChange={(e) => handleInputChange('monthlySale', e.target.value)}
                          className={`w-32 text-sm rounded-md pl-3 pr-0 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                          disabled={!isEditing}
                        />
                        <span className="text-#000000-700 ml-[-78px]">tonnes</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="intent" className="text-sm font-medium text-#000000-700">Intent Level</Label>
                      <Select
                        value={customerData.intent ? String(customerData.intent) : undefined}
                        onValueChange={(value: string) => handleInputChange('intent', Number(value))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={`w-full mt-1 text-sm px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(10)].map((_, index) => (
                            <SelectItem key={index} value={String(index + 1)} className="text-sm">
                              {index + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="clientType" className="text-sm font-medium text-#000000-700">
                        Client Type
                      </Label>
                      <Select
                        value={customerData.clientType || undefined}
                        onValueChange={(value: string) => {
                          if (value === 'custom') {
                            setCustomClientType('');
                          } else {
                            setCustomClientType(null);
                            handleInputChange('clientType', value);
                          }
                        }}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={`w-full mt-1 text-sm px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Contractor" className="text-sm">
                            Contractor
                          </SelectItem>
                          <SelectItem value="Builder" className="text-sm">
                            Builder
                          </SelectItem>
                          <SelectItem value="Shop" className="text-sm">
                            Shop
                          </SelectItem>
                          <SelectItem value="Project" className="text-sm">
                            Project
                          </SelectItem>
                          <SelectItem value="Architect" className="text-sm">
                            Architect
                          </SelectItem>
                          <SelectItem value="custom" className="text-sm">
                            Others
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {customClientType !== null && (
                      <div>
                        <Label htmlFor="customClientType" className="text-sm font-medium text-#000000-700">
                          Custom Client Type
                        </Label>
                        <Input
                          id="customClientType"
                          value={customClientType || ''}
                          onChange={(e) => {
                            setCustomClientType(e.target.value);
                            handleInputChange('clientType', e.target.value);
                          }}
                          className={`w-full mt-1 text-sm rounded-md px-3 py-2 ${!isEditing ? 'bg-#000000-200 text-#000000-700' : 'text-#000000'}`}
                          disabled={!isEditing}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              {isEditing && (
                <div className="mt-6 flex justify-end space-x-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="px-4 py-2 text-sm font-semibold">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="px-4 py-2 text-sm font-semibold">
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Right Panel */}
        <div className="w-2/3">
          <div className="bg-white rounded-lg shadow-lg">
            <Tabs value={rightTab} onValueChange={(value) => setRightTab(value as "visits" | "notes" | "Brands" | "Likes")}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="visits" className="px-4 py-2">Visits</TabsTrigger>
                <TabsTrigger value="notes" className="px-4 py-2">Notes</TabsTrigger>
                <TabsTrigger value="Brands" className="px-4 py-2">Brands Used</TabsTrigger>
                <TabsTrigger value="Likes" className="px-4 py-2">Likes</TabsTrigger>
              </TabsList>

              {/* Visits Tab */}
              <TabsContent value="visits" className="p-6">
                <VisitsTimeline storeId={customerData.storeId ? customerData.storeId : ''} />
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="p-6">
                <NotesSection storeId={customerData.storeId ? customerData.storeId : ''} />
              </TabsContent>

              {/* BrandsSection Tab */}
              <TabsContent value="Brands" className="p-6">
                <BrandsSection storeId={customerData.storeId ? customerData.storeId : ''} />
              </TabsContent>

              {/* LikesSection Tab */}
              <TabsContent value="Likes" className="p-6">
                <LikesSection storeId={customerData.storeId ? customerData.storeId : ''} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}