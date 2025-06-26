import React, { useState, useEffect } from 'react';
import { generatePlan } from '../api';
import type { CampaignSpec, Segment, CampaignPlan } from '../api';

interface PlanTableProps {
  spec: CampaignSpec;
  segments: Segment[];
  onComplete: (plan: CampaignPlan) => void;
  onMessage: (type: 'user' | 'agent', content: string) => void;
}

const PlanTable: React.FC<PlanTableProps> = ({ spec, segments, onComplete, onMessage }) => {
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateCampaignPlan();
  }, []);

  const generateCampaignPlan = async () => {
    try {
      setLoading(true);
      onMessage('agent', 'Generating your campaign plan...');
      
      // Create an updated spec with selected segments
      const updatedSpec = {
        ...spec,
        preferences: {
          segment_ids: segments.map(s => s.segmentId)
        }
      };
      
      const response = await generatePlan(updatedSpec);
      setPlan(response.data);
      onComplete(response.data);
      onMessage('agent', `Campaign plan generated successfully! Created ${response.data.plan.line_items.length} line items.`);
    } catch (error) {
      onMessage('agent', 'Error generating campaign plan. Please try again.');
      console.error('Plan generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (plan?.csvUrl) {
      const link = document.createElement('a');
      link.href = plan.csvUrl;
      link.download = `campaign-plan-${spec.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onMessage('user', 'Downloaded campaign plan CSV');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating campaign plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <p>Failed to generate campaign plan. Please try again.</p>
          <button
            onClick={generateCampaignPlan}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Campaign Plan</h2>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download CSV</span>
          </button>
        </div>

        {/* Campaign Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-3">Campaign Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 font-medium">Total Budget</div>
              <div className="text-blue-800">{formatCurrency(plan.plan.total_budget_allocated)}</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">Line Items</div>
              <div className="text-blue-800">{plan.plan.line_items.length}</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">Networks</div>
              <div className="text-blue-800">{plan.summary.networks_covered?.length || 0}</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">Locations</div>
              <div className="text-blue-800">{plan.summary.locations_covered?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Networks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Targeting
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plan.plan.line_items.map((lineItem, index) => (
                <tr key={lineItem.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lineItem.name}</div>
                    <div className="text-sm text-gray-500">ID: {lineItem.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(lineItem.budget)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(lineItem.start_date)} - {formatDate(lineItem.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {lineItem.networks.map((network, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {network}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {lineItem.genres.map((genre, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lineItem.devices.map((device, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                          >
                            {device}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lineItem.locations.map((location, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800"
                          >
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleDownloadCSV}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Download Detailed CSV
          </button>
          <button
            onClick={generateCampaignPlan}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            Regenerate Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanTable; 