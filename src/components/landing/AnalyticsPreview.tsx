import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#8B5CF6', '#34D399', '#F472B6', '#0EA5E9', '#D946EF'];

const spendingData = [
  { name: 'Housing', value: 2100 },
  { name: 'Transportation', value: 800 },
  { name: 'Food', value: 600 },
  { name: 'Entertainment', value: 400 },
  { name: 'Others', value: 1880 }
];

const cashFlowData = [
  { date: 'Nov 30', amount: -320, type: 'expense' },
  { date: 'Dec 02', amount: -120, type: 'expense' },
  { date: 'Dec 04', amount: 280, type: 'income' },
  { date: 'Dec 06', amount: -180, type: 'expense' },
  { date: 'Dec 08', amount: -80, type: 'expense' },
  { date: 'Dec 10', amount: 380, type: 'income' },
  { date: 'Dec 12', amount: -280, type: 'expense' }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const AnalyticsPreview = () => {
  return (
    <div className="mt-16 max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Spending Distribution Chart */}
        <div className="p-8 rounded-xl bg-white shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-purple-900">Total Spending Distribution</h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {spendingData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chatbot Preview */}
        <div className="p-8 rounded-xl bg-white shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-purple-900">AI Assistant</h3>
          <div className="flex flex-col space-y-4">
            <div className="bg-purple-100 rounded-lg p-4 max-w-[80%]">
              <p className="text-purple-900">How much money did I spend on gas last month?</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 max-w-[80%] ml-auto">
              <p className="text-gray-900">Based on your transaction data, you spent a total of $219.03 on gas last month.</p>
            </div>
            <div className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask about your finances..."
                  className="w-full p-4 pr-12 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  readOnly
                />
                <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="p-8 rounded-xl bg-white shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-purple-900">Cash Flow Analysis</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={cashFlowData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  domain={[-400, 400]}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {cashFlowData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.amount >= 0 ? '#34D399' : '#F87171'}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPreview;