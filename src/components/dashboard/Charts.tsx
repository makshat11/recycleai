import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/primitives';
import type { ReactNode } from 'react';

/** Accessible, print-friendly series colours drawn from the brand palette. */
export const CHART_COLORS = [
  '#198C76',
  '#153C35',
  '#F2BA62',
  '#5BB89F',
  '#B9801F',
  '#0F5E4F',
  '#9FD8C8',
  '#667770',
];

const AXIS_STYLE = { fontSize: 12, fill: '#667770' } as const;

const TOOLTIP_STYLE = {
  borderRadius: 16,
  border: '1px solid #CBEBE2',
  boxShadow: '0 12px 30px -12px rgba(21,60,53,0.25)',
  fontSize: 13,
} as const;

export function ChartCard({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <div>
        <h3 className="text-base sm:text-lg">{title}</h3>
        {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      </div>
      <div className="mt-5 flex-1">{children}</div>
      {footer && <div className="mt-4 text-xs leading-relaxed text-muted">{footer}</div>}
    </Card>
  );
}

export interface NameValue {
  name: string;
  value: number;
}

export function CategoryDonut({ data }: { data: NameValue[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [`${value} item${value === 1 ? '' : 's'}`, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={9}
            formatter={(value: string) => <span style={{ color: '#172B25', fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActionsBar({ data }: { data: NameValue[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#CBEBE2" vertical={false} />
          <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: '#CBEBE2' }} interval={0} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(25,140,118,0.07)' }}
            formatter={(value: number) => [`${value}`, 'Completed']}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={56}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface ActivityPoint {
  label: string;
  scans: number;
  completed: number;
}

export function ActivityArea({ data }: { data: ActivityPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
          <defs>
            <linearGradient id="rv-scans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#198C76" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#198C76" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="rv-completed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F2BA62" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#F2BA62" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#CBEBE2" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: '#CBEBE2' }} minTickGap={16} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={9}
            formatter={(value: string) => <span style={{ color: '#172B25', fontSize: 12 }}>{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="scans"
            name="Items analysed"
            stroke="#198C76"
            strokeWidth={2.5}
            fill="url(#rv-scans)"
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Actions completed"
            stroke="#B9801F"
            strokeWidth={2.5}
            fill="url(#rv-completed)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
