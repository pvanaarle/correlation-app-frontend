import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { PricePointDto } from '../types/dto';

interface Props {
    data: PricePointDto[];
    color: string;
    title: string;
}

export default function PriceChart({ data, color, title }: Props) {
    // Recharts wil liever flat-keys, dus even omzetten
    const formatted = data.map(p => ({
        time: new Date(p.datetime).toLocaleString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
        }),
        price: p.close
    }));

    return (
        <div className="p-4 border rounded-xl bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-2">{title}</h2>

            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={formatted}>
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={color}
                            dot={false}
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
