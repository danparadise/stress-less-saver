import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import TransactionsPopup from "@/components/analytics/TransactionsPopup";

const Analytics = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Mock data - this will be replaced with real data from your backend
  const data = [
    { 
      name: "Transportation", 
      value: 342, 
      color: "#60A5FA",
      transactions: [
        { date: "2024-01-15", description: "Uber Ride", amount: 25.50, category: "Transportation" },
        { date: "2024-01-14", description: "Gas Station", amount: 45.00, category: "Transportation" },
        { date: "2024-01-12", description: "Train Ticket", amount: 12.50, category: "Transportation" },
      ]
    },
    { 
      name: "Business", 
      value: 362, 
      color: "#67E8F9",
      transactions: [
        { date: "2024-01-15", description: "Office Supplies", amount: 89.99, category: "Business" },
        { date: "2024-01-13", description: "Software Subscription", amount: 29.99, category: "Business" },
      ]
    },
    { 
      name: "Food & Dining", 
      value: 521, 
      color: "#86EFAC",
      transactions: [
        { date: "2024-01-15", description: "Restaurant", amount: 65.00, category: "Food & Dining" },
        { date: "2024-01-14", description: "Grocery Store", amount: 120.50, category: "Food & Dining" },
      ]
    },
    { 
      name: "Miscellaneous", 
      value: 279, 
      color: "#F87171",
      transactions: [
        { date: "2024-01-15", description: "General Store", amount: 45.00, category: "Miscellaneous" },
        { date: "2024-01-12", description: "Online Purchase", amount: 34.99, category: "Miscellaneous" },
      ]
    },
    { 
      name: "Entertainment", 
      value: 178, 
      color: "#FB923C",
      transactions: [
        { date: "2024-01-14", description: "Movie Tickets", amount: 32.00, category: "Entertainment" },
        { date: "2024-01-13", description: "Streaming Service", amount: 14.99, category: "Entertainment" },
      ]
    },
    { 
      name: "Shopping", 
      value: 164, 
      color: "#F472B6",
      transactions: [
        { date: "2024-01-15", description: "Clothing Store", amount: 89.99, category: "Shopping" },
        { date: "2024-01-12", description: "Online Shopping", amount: 74.01, category: "Shopping" },
      ]
    },
  ];

  const selectedData = data.find(item => item.name === selectedCategory);

  const handlePieClick = (data: any, index: number) => {
    setSelectedCategory(data.name);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
          Spending Analytics
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Analyze your spending patterns and financial trends
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend 
                    onClick={(entry) => handlePieClick(entry, 0)}
                    cursor="pointer"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedData && (
        <TransactionsPopup
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedData.name}
          transactions={selectedData.transactions}
          color={selectedData.color}
        />
      )}
    </div>
  );
};

export default Analytics;