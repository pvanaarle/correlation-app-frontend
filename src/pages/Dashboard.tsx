// src/pages/Dashboard.tsx

import React, {useEffect, useState} from 'react';
import {AssetDto, PricePointDto} from '../types/dto';
import {fetchAssets, fetchPrices} from '../services/api';
import PriceChart from '../components/PriceChart';


type TimeframeKey = '30d' | '90d' | '365d';

const TIMEFRAMES: Record<TimeframeKey, { label: string; hours: number }> = {
    '30d': {label: 'Laatste 30 dagen', hours: 24 * 30},
    '90d': {label: 'Laatste 90 dagen', hours: 24 * 90},
    '365d': {label: 'Laatste 365 dagen', hours: 24 * 365},
};

function filterByTimeframe(points: PricePointDto[], timeframe: TimeframeKey): PricePointDto[] {
    const max = TIMEFRAMES[timeframe].hours;

    // We krijgen 1 datapunt per uur. Als we minder data hebben dan "max", geven we gewoon alles.
    if (points.length <= max) {
        return points;
    }

    return points.slice(0, max); // lijst staat al newest → oldest
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// Correlatie helpers

// 1. Series alignen op datetime: maak paren (x,y)
function alignSeriesForCorrelation(
    a: PricePointDto[],
    b: PricePointDto[]
): [number[], number[]] {
    const mapB = new Map<string, number>();
    b.forEach(p => {
        mapB.set(p.datetime, p.close);
    });

    const xs: number[] = [];
    const ys: number[] = [];

    a.forEach(p => {
        const other = mapB.get(p.datetime);
        if (other !== undefined) {
            xs.push(p.close);
            ys.push(other);
        }
    });

    return [xs, ys];
}

// 2. Pearson-correlatie berekenen
function pearsonCorrelation(xs: number[], ys: number[]): number | null {
    const n = xs.length;
    if (n < 2 || ys.length !== n) {
        return null;
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
        const x = xs[i];
        const y = ys[i];

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
    }

    const numerator = n * sumXY - sumX * sumY;
    const denom = Math.sqrt(
        (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denom === 0) {
        return null;
    }

    return numerator / denom;
}

// 3. Label + css-class voor de UI
interface CorrelationDescription {
    label: string;
    className: string;
}


function describeCorrelation(correlation: number | null): CorrelationDescription {
    if (correlation === null || Number.isNaN(correlation)) {
        return {label: 'Geen correlatie', className: ''};
    }

    if (correlation > 0.8) {
        return {label: 'Sterke positieve correlatie', className: 'text-green-600'};
    }
    if (correlation > 0.4) {
        return {label: 'Matige positieve correlatie', className: 'text-green-500'};
    }
    if (correlation > -0.4) {
        return {label: 'Zwakke of geen correlatie', className: 'text-gray-500'};
    }
    if (correlation > -0.8) {
        return {label: 'Matige negatieve correlatie', className: 'text-red-500'};
    }

    return {label: 'Sterke negatieve correlatie', className: 'text-red-600'};
}


const Dashboard: React.FC = () => {
    const [assets, setAssets] = useState<AssetDto[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);

    const [selectedAsset1, setSelectedAsset1] = useState<string>('');
    const [selectedAsset2, setSelectedAsset2] = useState<string>('');
    const [timeframe, setTimeframe] = useState<TimeframeKey>('30d');
    const [interval, setInterval] = useState<string>('1h');

    const [prices1, setPrices1] = useState<PricePointDto[]>([]);
    const [prices2, setPrices2] = useState<PricePointDto[]>([]);

    const [correlation, setCorrelation] = useState<number | null>(null);
    const [chartAssets, setChartAssets] = useState<{
        asset1: string;
        asset2: string | null;
    } | null>(null);

    // het paar waarvoor deze correlatie is berekend
    const [correlationAssets, setCorrelationAssets] = useState<{
        asset1: string;
        asset2: string;
    } | null>(null);


    const [loadingPrices, setLoadingPrices] = useState(false);
    const [error, setError] = useState<string>('');

    // --- Assets laden bij start ---
    useEffect(() => {
        const load = async () => {
            setLoadingAssets(true);
            setError('');

            try {
                const data = await fetchAssets();
                setAssets(data);

            } catch (e) {
                setError(
                    e instanceof Error
                        ? e.message
                        : 'Er ging iets mis bij het laden van de assets.'
                );
            } finally {
                setLoadingAssets(false);
            }
        };

        load();
    }, []);

    // --- Prijsdata laden voor 1 of 2 assets ---
    const handleLoadPrices = async () => {
        if (!selectedAsset1) {
            setError('Kies minstens één asset.');
            return;
        }

        setError('');
        setLoadingPrices(true);

        // oud resultaat weggooien bij nieuwe aanvraag
        setCorrelation(null);
        setCorrelationAssets(null);

        setPrices1([]);
        setPrices2([]);
        setChartAssets(null);


        try {
            // 1. Eerst asset 1
            const data1 = await fetchPrices(selectedAsset1, timeframe, interval);

            // 2. Dan optioneel asset 2 (ná elkaar, niet tegelijk)
            let data2: PricePointDto[] = [];
            if (selectedAsset2) {
                data2 = await fetchPrices(selectedAsset2, timeframe, interval);
            }

            setPrices1(data1);
            setPrices2(data2);

            setChartAssets({
                asset1: selectedAsset1,
                asset2: selectedAsset2 || null,
            });


            // --- Correlatie berekenen als er een tweede asset is ---
            if (selectedAsset2 && data1.length > 0 && data2.length > 0) {
                const [xs, ys] = alignSeriesForCorrelation(data1, data2);
                const corr = pearsonCorrelation(xs, ys);

                setCorrelation(corr);
                setCorrelationAssets({
                    asset1: selectedAsset1,
                    asset2: selectedAsset2,
                });
            } else {
                // geen tweede asset of geen data → ook geen resultaat tonen
                setCorrelation(null);
                setCorrelationAssets(null);
            }


        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Er ging iets mis bij het laden van de prijsdata.'
            );
            setPrices1([]);
            setPrices2([]);
            setCorrelation(null);
            setCorrelationAssets(null);
        } finally {
            setLoadingPrices(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
            <div className="bg-white rounded-2xl p-10 shadow-2xl max-w-5xl w-full border border-gray-100">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 text-center">
                    Market Correlation Dashboard – fase 2
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Kies twee assets en een timeframe. We halen de prijsreeksen op, zodat
                    je kunt checken of de data logisch is.
                </p>

                {/* Formulier */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Asset 1 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Asset 1 (verplicht)
                        </label>
                        <select
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                            value={selectedAsset1}
                            onChange={(e) => setSelectedAsset1(e.target.value)}
                            disabled={loadingAssets}
                        >
                            <option value="">Kies een asset...</option>
                            {assets.map((asset) => (
                                <option key={asset.id} value={asset.name}>
                                    {asset.name} ({asset.symbol})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Asset 2 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Asset 2 (optioneel)
                        </label>
                        <select
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                            value={selectedAsset2}
                            onChange={(e) => setSelectedAsset2(e.target.value)}
                            disabled={loadingAssets}
                        >
                            <option value="">Geen tweede asset</option>
                            {assets.map((asset) => (
                                <option key={asset.id} value={asset.name}>
                                    {asset.name} ({asset.symbol})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Timeframe */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Timeframe
                        </label>
                        <select
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as TimeframeKey)}
                        >
                            {(
                                Object.keys(TIMEFRAMES) as TimeframeKey[]
                            ).map((key) => (
                                <option key={key} value={key}>
                                    {TIMEFRAMES[key].label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Interval */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Interval
                        </label>
                        <select
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                        >
                            <option value="1h">1 uur</option>
                            <option value="4h">4 uur</option>
                            <option value="1day">1 dag</option>
                        </select>
                    </div>

                </div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleLoadPrices}
                        className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={loadingAssets || loadingPrices}
                    >
                        {loadingPrices ? 'Bezig met laden...' : 'Laad prijsdata'}
                    </button>
                </div>

                {/* Correlatie */}
                {correlationAssets &&
                    correlation !== null &&
                    !Number.isNaN(correlation) &&
                    !loadingPrices && (
                        <div className="mb-4 p-4 rounded-xl border text-sm bg-slate-50 border-slate-200">
                            {(() => {
                                const {label, className} = describeCorrelation(correlation);

                                return (
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <span className="text-gray-600">
                                        Correlatie tussen <strong>{correlationAssets.asset1}</strong> en{' '}
                                            <strong>{correlationAssets.asset2}</strong>:
                                        </span>

                                        <span className={`font-semibold ${className}`}>
                                            {correlation.toFixed(2)}
                                        </span>

                                        <span className={className}>({label})</span>

                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                                            <div
                                                className={`h-full transition-all duration-500 ${
                                                    correlation > 0 ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                                style={{width: `${Math.abs(correlation) * 100}%`}}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}


                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {prices1.length > 0 && chartAssets && (
                    <PriceChart
                        data={prices1}
                        color="#4F46E5"
                        title={`${chartAssets.asset1} (${interval})`}
                    />
                )}


                {chartAssets?.asset2 && prices2.length > 0 && (
                    <PriceChart
                        data={prices2}
                        color="#EF4444"
                        title={`${chartAssets.asset2} (${interval})`}
                    />
                )}



                {/* Resultaten: 2 kolommen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tabel asset 1 */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 text-sm">
                            {chartAssets?.asset1 || selectedAsset1 || 'Asset 1'}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {prices1.length === 0 ? (
                                <div className="p-4 text-sm text-gray-400">
                                    Nog geen prijsdata geladen.
                                </div>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Datetime</th>
                                        <th className="px-4 py-2 text-right">Close</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {prices1.map((p, index) => (
                                        <tr
                                            key={index}
                                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        >
                                            <td className="px-4 py-1.5">
                                                {formatDateTime(p.datetime)}
                                            </td>
                                            <td className="px-4 py-1.5 text-right tabular-nums">
                                                {p.close.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Tabel asset 2 */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 text-sm">
                            {chartAssets?.asset2 || selectedAsset2 || 'Asset 2'}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {selectedAsset2 && prices2.length === 0 && !loadingPrices ? (
                                <div className="p-4 text-sm text-gray-400">
                                    Nog geen prijsdata geladen voor asset 2.
                                </div>
                            ) : !selectedAsset2 ? (
                                <div className="p-4 text-sm text-gray-400">
                                    Geen tweede asset geselecteerd.
                                </div>
                            ) : (
                                prices2.length > 0 && (
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-600 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Datetime</th>
                                            <th className="px-4 py-2 text-right">Close</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {prices2.map((p, index) => (
                                            <tr
                                                key={index}
                                                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                            >
                                                <td className="px-4 py-1.5">
                                                    {formatDateTime(p.datetime)}
                                                </td>
                                                <td className="px-4 py-1.5 text-right tabular-nums">
                                                    {p.close.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
