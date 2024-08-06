'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import Salary from './Salary';
import Allowance from './Allowance';
import WorkingDays from './WorkingDays';
import Teams from './Teams';
import TargetComponent from '@/components/Target';
import { RootState } from '../store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('salary');
    const authToken = useSelector((state: RootState) => state.auth.token);

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">
                        Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center space-x-4 flex-wrap">
                        <Button
                            variant={activeTab === 'salary' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('salary')}
                        >
                            Salary
                        </Button>
                        <Button
                            variant={activeTab === 'allowance' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('allowance')}
                        >
                            Allowance
                        </Button>
                        <Button
                            variant={activeTab === 'workingDays' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('workingDays')}
                        >
                            Working Days
                        </Button>
                        <Button
                            variant={activeTab === 'team' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('team')}
                        >
                            Team
                        </Button>
                        <Button
                            variant={activeTab === 'target' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('target')}
                        >
                            Target
                        </Button>

                    </div>
                    <div className="mt-6">
                        {activeTab === 'salary' && <Salary authToken={authToken} />}
                        {activeTab === 'allowance' && <Allowance authToken={authToken} />}
                        {activeTab === 'workingDays' && <WorkingDays authToken={authToken} />}
                        {activeTab === 'team' && <Teams authToken={authToken} />}
                        {activeTab === 'target' && <TargetComponent />}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}