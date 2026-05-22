import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CommentStatsProps {
  stats: {
    hotelId: string;
    commentCount: number;
    overallAverage: number;
    categoryAverages: Record<string, number>;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  cleanliness: 'Cleanliness',
  staffAndService: 'Staff & Service',
  facilitiesAndAmenities: 'Facilities',
  locationAndAccessibility: 'Location',
  ecoFriendliness: 'Eco-Friendly',
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function CommentStats({ stats }: CommentStatsProps) {
  const chartData = Object.entries(stats.categoryAverages || {}).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    score: value,
  }));

  const overallScore = stats.overallAverage || 0;
  const scoreColor = overallScore >= 8 ? 'text-green-600' : overallScore >= 6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Guest Reviews</h3>
      <div className="flex items-center gap-4 mb-6">
        <div className={`text-5xl font-bold ${scoreColor}`}>{overallScore.toFixed(1)}</div>
        <div>
          <p className="text-gray-600 font-medium">
            {overallScore >= 9 ? 'Exceptional' : overallScore >= 8 ? 'Excellent' : overallScore >= 7 ? 'Very Good' : 'Good'}
          </p>
          <p className="text-sm text-gray-500">{stats.commentCount} reviews</p>
        </div>
      </div>
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
            <Tooltip formatter={(v: number) => [v.toFixed(1), 'Score']} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
