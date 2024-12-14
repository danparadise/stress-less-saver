import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface IncomeChartProps {
  data: Array<{ date: string; amount: number }>;
}

const IncomeChart = ({ data }: IncomeChartProps) => {
  return (
    <Card className="col-span-2 p-6 glass-card">
      <h3 className="text-lg font-semibold text-purple-800 mb-4">Income Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" stroke="#1E1533" />
            <YAxis stroke="#1E1533" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#8CA891"
              strokeWidth={2}
              dot={{ fill: "#8CA891" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default IncomeChart;