import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter } from 'next/router';
import { Visit } from './types';

interface VisitsTableProps {
    visits: Visit[];
    selectedColumns: string[];
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    itemsPerPage: number;
    currentPage: number;
    onSort: (column: string) => void;
    onBulkAction: (action: string) => void;
}

const formatDate = (date: string | null | undefined) => {
    if (date) {
        return format(new Date(date), "d MMM ''yy");
    }
    return '';
};

const formatTime = (date: string | null | undefined, time: string | null | undefined) => {
    if (date && time) {
        const [hours, minutes] = time.split(':');
        return format(new Date(`${date}T${hours}:${minutes}`), "h:mm a");
    }
    return '';
};

// Mapping between display names and backend field names
const columnMapping = {
    'Customer Name': 'storeName',
    'Executive': 'employeeName',
    'Date': 'visit_date',
    'Status': 'outcome',
    'Purpose': 'purpose',
    'Visit Start': 'checkinDate',
    'Visit End': 'checkoutDate',
    'Intent': 'intent',
    'Last Updated': 'updatedAt',
};

// Columns where sorting is disabled
const nonSortableColumns = ['outcome', 'visitStart', 'visitEnd', 'updatedAt'];

const VisitsTable: React.FC<VisitsTableProps> = ({
    visits,
    selectedColumns,
    sortColumn,
    sortDirection,
    itemsPerPage,
    currentPage,
    onSort,
    onBulkAction,
}) => {
    const router = useRouter();

    const viewDetails = (visitId: string) => {
        router.push(`/VisitDetailPage/${visitId}`);
    };

    const getOutcomeStatus = (visit: Visit): { emoji: React.ReactNode; status: string; color: string } => {
        if (visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime) {
            return { emoji: '✅', status: 'Completed', color: 'bg-purple-100 text-purple-800' };
        } else if (visit.checkoutDate && visit.checkoutTime) {
            return { emoji: '⏱️', status: 'Checked Out', color: 'bg-orange-100 text-orange-800' };
        } else if (visit.checkinDate && visit.checkinTime) {
            return { emoji: '🕰️', status: 'On Going', color: 'bg-green-100 text-green-800' };
        }
        return { emoji: '📅', status: 'Assigned', color: 'bg-blue-100 text-blue-800' };
    };

    return (
        <div>
            <table className="w-full text-left table-auto text-sm font-poppins">
                <thead>
                    <tr className="bg-gray-100">
                        {selectedColumns.includes('storeName') && (
                            <th className="px-4 py-2 cursor-pointer" onClick={() => onSort('storeName')}>
                                Customer Name {sortColumn === 'storeName' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        )}
                        {selectedColumns.includes('employeeName') && (
                            <th className="px-4 py-2 cursor-pointer" onClick={() => onSort('employeeName')}>
                                Executive {sortColumn === 'employeeName' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        )}
                        {selectedColumns.includes('visit_date') && (
                            <th className="px-4 py-2 cursor-pointer" onClick={() => onSort('visit_date')}>
                                Date {sortColumn === 'visit_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        )}
                        {selectedColumns.includes('outcome') && (
                            <th className="px-4 py-2">
                                Status
                            </th>
                        )}
                        {selectedColumns.includes('purpose') && (
                            <th className="px-4 py-2 cursor-pointer" onClick={() => onSort('purpose')}>
                                Purpose {sortColumn === 'purpose' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        )}
                        {selectedColumns.includes('visitStart') && (
                            <th className="px-4 py-2">
                                Visit Start
                            </th>
                        )}
                        {selectedColumns.includes('visitEnd') && (
                            <th className="px-4 py-2">
                                Visit End
                            </th>
                        )}
                        {selectedColumns.includes('intent') && (
                            <th className="px-4 py-2 cursor-pointer" onClick={() => onSort('intent')}>
                                Intent {sortColumn === 'intent' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        )}
                        <th className="px-4 py-2">
                            Last Updated
                        </th>
                        <th className="px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {visits.map((visit) => {
                        const { emoji, status, color } = getOutcomeStatus(visit);

                        return (
                            <tr key={visit.id} className="border-b">
                                {selectedColumns.includes('storeName') && (
                                    <td className="px-4 py-2">{visit.storeName}</td>
                                )}
                                {selectedColumns.includes('employeeName') && (
                                    <td className="px-4 py-2">{visit.employeeName}</td>
                                )}
                                {selectedColumns.includes('visit_date') && (
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {formatDate(visit.visit_date)}
                                    </td>
                                )}
                                {selectedColumns.includes('outcome') && (
                                    <td className="px-4 py-2">
                                        <Badge className={`${color} px-3 py-1 rounded-full font-semibold`}>
                                            {emoji} {status}
                                        </Badge>
                                    </td>
                                )}
                                {selectedColumns.includes('purpose') && (
                                    <td className="px-4 py-2 relative">
                                        <div className="group cursor-pointer">
                                            {visit.purpose ? (
                                                visit.purpose.length > 20 ? `${visit.purpose.slice(0, 20)}...` : visit.purpose
                                            ) : (
                                                '-'
                                            )}
                                            {visit.purpose && visit.purpose.length > 20 && (
                                                <div className="absolute left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg hidden group-hover:block z-10 w-80">
                                                    <p className="text-sm text-gray-800">{visit.purpose}</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                )}
                                {selectedColumns.includes('visitStart') && (
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div>{formatDate(visit.checkinDate)}</div>
                                        <div>{formatTime(visit.checkinDate, visit.checkinTime)}</div>
                                    </td>
                                )}
                                {selectedColumns.includes('visitEnd') && (
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div>{formatDate(visit.checkoutDate)}</div>
                                        <div>{formatTime(visit.checkoutDate, visit.checkoutTime)}</div>
                                    </td>
                                )}
                                {selectedColumns.includes('intent') && (
                                    <td className="px-4 py-2">{visit.intent}</td>
                                )}
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div>{formatDate(visit.updatedAt)}</div>
                                    <div>{formatTime(visit.updatedAt, visit.updatedTime)}</div>
                                </td>
                                <td className="px-4 py-2">
                                    <Button
                                        variant="outline"
                                        className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                        onClick={() => viewDetails(visit.id.toString())}
                                    >
                                        View Details
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default VisitsTable;
