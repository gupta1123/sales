import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FiUsers, FiBarChart2, FiMap, FiPieChart } from 'react-icons/fi';
import NewCustomersReport from '../components/NewCustomersReport';
import SalesPerformanceReport from '../components/SalesPerformanceReport';
import VisitFrequencyReport from '../components/VisitFrequencyReport';
import CustomerTypeAnalysisReport from '../components/CustomerTypeAnalysisReport';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('newCustomers');

    const tabs = [
        { id: 'newCustomers', label: 'New Customers Acquired', icon: FiUsers, description: 'View statistics on new customers acquired by employees' },
        { id: 'salesPerformance', label: 'Sales Performance', icon: FiBarChart2, description: 'Analyze sales performance across different products and regions' },
        { id: 'visitFrequency', label: 'Visit Frequency', icon: FiMap, description: 'Analyze visit frequency, intent level, and monthly sales by employee' },
        { id: 'customerTypeAnalysis', label: 'Customer Type Analysis', icon: FiPieChart, description: 'Analyze customer types for each employee' },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Reports</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {tabs.map((tab) => (
                    <Card
                        key={tab.id}
                        className={`cursor-pointer hover:shadow-lg transition-shadow duration-300 ${activeTab === tab.id ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <tab.icon className="w-8 h-8 mb-2" />
                            <h3 className="font-semibold mb-1">{tab.label}</h3>
                            <p className="text-xs text-gray-600">{tab.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {activeTab === 'newCustomers' && <NewCustomersReport />}
            {activeTab === 'salesPerformance' && <SalesPerformanceReport />}
            {activeTab === 'visitFrequency' && <VisitFrequencyReport />}
            {activeTab === 'customerTypeAnalysis' && <CustomerTypeAnalysisReport />}
        </div>
    );
};

export default Reports;