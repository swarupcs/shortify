'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface Props {
  urlsPerDay: Array<{ date: string; count: number }>;
  usersPerDay: Array<{ date: string; count: number }>;
}

export function AdminActivityChart({ urlsPerDay, usersPerDay }: Props) {
  // Merge both series into one array keyed by date
  const allDates = Array.from(
    new Set([...urlsPerDay.map((r) => r.date), ...usersPerDay.map((r) => r.date)]),
  ).sort();

  const chartData = allDates.map((date) => ({
    date,
    urls: urlsPerDay.find((r) => r.date === date)?.count ?? 0,
    users: usersPerDay.find((r) => r.date === date)?.count ?? 0,
  }));

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'MMM d'); } catch { return d; }
  };

  return (
    <div className='w-full h-[260px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='hsl(var(--border))' />
          <XAxis
            dataKey='date'
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickMargin={8}
            tickFormatter={formatDate}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickMargin={8}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              color: 'hsl(var(--foreground))',
              fontSize: '12px',
            }}
            labelFormatter={formatDate}
          />
          <Legend
            iconType='circle'
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
          <Line
            type='monotone'
            dataKey='urls'
            name='New URLs'
            stroke='hsl(var(--chart-1))'
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type='monotone'
            dataKey='users'
            name='New Users'
            stroke='hsl(var(--chart-2))'
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
