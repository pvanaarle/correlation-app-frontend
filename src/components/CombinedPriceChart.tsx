import React, {useMemo} from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import {PricePointDto} from '../types/dto';

interface CombinedPriceChartProps {
    data1: PricePointDto[];           // asset 1
    data2: PricePointDto[];           // asset 2 (mag leeg zijn)
    asset1Label: string;
    asset2Label?: string | null;
    interval: string;
}

const COLOR_1 = '#4F46E5'; // paars, jouw huidige kleur asset 1
const COLOR_2 = '#EF4444'; // rood, jouw huidige kleur asset 2

// Kleine helper om domain met 10% marge te maken
function computeDomain(values: number[]): [number, number] {
    if (!values.length) {
        return [0, 1];
    }
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
        // Alle waarden gelijk → klein bandje eromheen
        const delta = Math.abs(min || 1) * 0.1;
        return [min - delta, max + delta];
    }

    const range = max - min;
    const padding = range * 0.1; // 10% boven en onder
    return [min - padding, max + padding];
}

const CombinedPriceChart: React.FC<CombinedPriceChartProps> = ({
                                                                   data1,
                                                                   data2,
                                                                   asset1Label,
                                                                   asset2Label,
                                                                   interval,
                                                               }) => {
        // Data van asset 2 mappen op datetime van asset 1
        // Aanpassing: Dat ging fout: lijn asset 2 viel weg bij aandeel-crypto combi , blok is aangepast
    const mergedData = useMemo(() => {
        // snelle lookup per asset
        const map1 = new Map<string, number>();
        data1.forEach((p) => {
            map1.set(p.datetime, p.close);
        });

        const map2 = new Map<string, number>();
        data2.forEach((p) => {
            map2.set(p.datetime, p.close);
        });

        // alle unieke datetimes (unie van beide)
        const allDatetimes = Array.from(
            new Set([
                ...data1.map((p) => p.datetime),
                ...data2.map((p) => p.datetime),
            ])
        );

        // sorteren oud → nieuw
        allDatetimes.sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

        // laatste bekende waarden bijhouden
        let last1: number | null = null;
        let last2: number | null = null;

        return allDatetimes.map((dt) => {
            const v1 = map1.get(dt);
            const v2 = map2.get(dt);

            if (v1 !== undefined) {
                last1 = v1;
            }
            if (v2 !== undefined) {
                last2 = v2;
            }

            return {
                datetime: dt,
                asset1: last1, // gebruik laatste bekende waarde (of null aan het begin)
                asset2: last2,
            };
        });
    }, [data1, data2]);



    const domain1 = computeDomain(data1.map((p) => p.close));
        const domain2 = computeDomain(data2.map((p) => p.close));

        const formatTime = (iso: string) =>
            new Date(iso).toLocaleString('nl-NL', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });

        return (
            <div className="border border-gray-200 rounded-xl p-4 mb-6">
                <div className="mb-2 flex items-baseline">
                    {/* Linksboven: asset 1 in paars */}
                    <span className="text-lg font-bold" style={{color: COLOR_1}}>
                    {asset1Label}
                </span>

                    {/* Interval klein ertussenin */}
                    <span className="text-xs text-gray-400 ml-3">
                    ({interval})
                </span>

                    {/* Rechtsboven: asset 2 in rood */}
                    {asset2Label && (
                        <span
                            className="text-lg font-bold ml-auto"
                            style={{color: COLOR_2}}
                        >
                        {asset2Label}
                    </span>
                    )}
                </div>


                <div style={{width: '100%', height: 320}}>
                    <ResponsiveContainer>
                        <LineChart data={mergedData}>
                            {/* <CartesianGrid strokeDasharray="3 3"/> Grijze stippenlijntjes in grafiek - uitgezet Nu dus: witte achtergrond */}
                            <XAxis
                                dataKey="datetime"
                                tickFormatter={(iso) =>
                                    new Date(iso).toLocaleDateString('nl-NL', {
                                        day: '2-digit',
                                        month: '2-digit',
                                    })
                                }
                                minTickGap={30}   // iets grotere spacing zodat het netjes blijft
                                tick={{
                                    fill: '#000000',
                                    fontSize: 10,      // ← datum kleiner maken
                                }}
                            />


                            {/* Y-as links: asset 1 */}
                            <YAxis
                                yAxisId="left"
                                stroke="#000000" // zwarte Y-as
                                domain={domain1}
                                tick={{fill: '#000000', fontSize: 10}}  // 🔹 zwart & kleiner
                                tickFormatter={(v: number) => Math.round(v).toString()}
                            />

                            {/* Y-as rechts: asset 2 (alleen tonen als die er is) */}
                            {asset2Label && data2.length > 0 && (
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#000000"  // zwarte Y-as
                                    domain={domain2}
                                    tick={{fill: '#000000', fontSize: 10}}  // 🔹 zwart & kleiner
                                    tickFormatter={(v: number) => Math.round(v).toString()}
                                />
                            )}

                            <Tooltip
                                labelFormatter={(value) => formatTime(String(value))}
                                formatter={(value: any, name: any): [string, string] => {
                                    // value kan number of string zijn → eerst naar number casten
                                    const numeric = typeof value === 'number' ? value : Number(value);
                                    const rounded = Number.isFinite(numeric) ? Math.round(numeric) : value;

                                    const label = name === 'asset1' ? asset1Label : asset2Label ?? '';

                                    return [String(rounded), label];
                                }}
                            />


                            {/* Lijn asset 1 (links) */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="asset1"
                                stroke={COLOR_1}
                                dot={false}
                                strokeWidth={2}
                            />

                            {/* Lijn asset 2 (rechts) */}
                            {asset2Label && data2.length > 0 && (
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="asset2"
                                    stroke={COLOR_2}
                                    dot={false}
                                    strokeWidth={2}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
;

export default CombinedPriceChart;
