// src/pages/Dashboard.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {AssetDto, PricePointDto} from '../types/dto';
import {fetchAssets, fetchPrices} from '../services/api';
import PriceChart from '../components/PriceChart';
import CombinedPriceChart from '../components/CombinedPriceChart';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';


interface MergedRow {
    datetime: string;
    asset1: number | null;
    asset2: number | null;
}

type TimeframeKey = '30d' | '90d' | '365d';

const TIMEFRAMES: Record<TimeframeKey, { label: string; hours: number }> = {
    '30d': {label: 'Laatste 30 dagen', hours: 24 * 30},
    '90d': {label: 'Laatste 90 dagen', hours: 24 * 90},
    '365d': {label: 'Laatste 365 dagen', hours: 24 * 365},
};

// bij crypto/aandeel-combi kwam geen correlatie. Komt door timestamps. Vandaar deze aanpassing:
function mergeAndFill(data1: PricePointDto[], data2: PricePointDto[]): MergedRow[] {
    const map1 = new Map(data1.map(p => [p.datetime, p.close]));
    const map2 = new Map(data2.map(p => [p.datetime, p.close]));

    const datetimes = Array.from(
        new Set([
            ...data1.map(p => p.datetime),
            ...data2.map(p => p.datetime),
        ])
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let last1: number | null = null;
    let last2: number | null = null;

    return datetimes.map((dt): MergedRow => {
        if (map1.has(dt)) last1 = map1.get(dt)!;
        if (map2.has(dt)) last2 = map2.get(dt)!;

        return {
            datetime: dt,
            asset1: last1,
            asset2: last2,
        };
    });
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
    const sortedAssets = [...assets].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

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

    const resetResults = () => { // Helper voor resetten (ivm 'trage' dropdown)
        setPrices1([]);
        setPrices2([]);
        setChartAssets(null);
        setCorrelation(null);
        setCorrelationAssets(null);
        setError('');
    };

    const priceRows1 = useMemo( // Dit blok maakt de dropdowns sneller met useMemo
        () =>
            prices1.map((p, index) => (
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
            )),
        [prices1]
    );

    const priceRows2 = useMemo(
        () =>
            prices2.map((p, index) => (
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
            )),
        [prices2]
    );
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };





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

        // 🔹 NIEUW: combinatie 365d + 1h blokkeren
        if (timeframe === '365d' && interval === '1h') {
            // Oude resultaten leegmaken zodat alleen de fout zichtbaar is
            resetResults();
            setError(
                '365 dagen met interval 1 uur levert teveel (5000+) records op. ' +
                'Kies een kleiner timeframe (90/30 dgn) of een groter interval (4u/1d).'
            );
            return;
        }

        setError('');
        setLoadingPrices(true);

        // oud resultaat weggooien bij nieuwe aanvraag
        resetResults();



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
                const merged = mergeAndFill(data1, data2);

                // Alleen punten waar beide assets een waarde hebben
                const validRows = merged.filter(
                    (row) => row.asset1 !== null && row.asset2 !== null
                );

                if (validRows.length > 1) {
                    const xs = validRows.map((row) => row.asset1 as number);
                    const ys = validRows.map((row) => row.asset2 as number);

                    const corr = pearsonCorrelation(xs, ys);

                    setCorrelation(corr);
                    setCorrelationAssets({
                        asset1: selectedAsset1,
                        asset2: selectedAsset2,
                    });
                } else {
                    // te weinig overlappende data om iets zinnigs te zeggen
                    setCorrelation(null);
                    setCorrelationAssets(null);
                }
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

                {/* ✅ uitlog-knop rechtsboven */}
                {/* Titel + logout in één rij */}
                <div className="flex items-center justify-between mb-6">
                    {/* Links lege spacer */}
                    <div className="w-24"></div>

                    {/* Titel */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
                        Market Correlation Dashboard
                    </h1>

                    {/* Rechterkant: user + logout */}
                    <div className="flex items-center gap-3 w-24 justify-end">
                        {user && (
                            <span className="text-xs text-gray-500">
                {user.email}
            </span>
                        )}

                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-xl hover:bg-red-800"
                        >
                            Uitloggen
                        </button>
                    </div>
                </div>


                <p className="text-center text-gray-500 mb-8">
                    Kies twee assets, een timeframe en een interval. Klik op "Laad prijsdata" om de correlatie te berekenen.
                </p>

                {/* Formulier */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Asset 1 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Asset 1
                        </label>
                        <select
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                            value={selectedAsset1}
                            onChange={(e) => setSelectedAsset1(e.target.value)}
                            disabled={loadingAssets}
                        >
                            <option value="">Kies een asset...</option>
                            {sortedAssets.map((asset) => (
                                <option key={asset.id} value={asset.name}>
                                    {asset.name} ({asset.symbol})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Asset 2 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Asset 2
                        </label>
                        <select
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                            value={selectedAsset2}
                            onChange={(e) => setSelectedAsset2(e.target.value)}
                            disabled={loadingAssets}
                        >
                            <option value="">Kies tweede asset...</option>
                            {sortedAssets.map((asset) => (
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
                            {/* disable 1u optie bij keuze van 365 dagen ivm 8000+ records */}
                            <option value="1h" disabled={timeframe === '365d'}>
                                1 uur
                            </option>
                            <option value="4h">4 uur</option>
                            <option value="1day">1 dag</option>
                        </select>
                    </div>

                </div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleLoadPrices}
                        className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-800 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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

                {chartAssets && prices1.length > 0 && (
                    chartAssets.asset2 && prices2.length > 0 ? (
                        // === Twee assets → gecombineerde grafiek ===
                        <CombinedPriceChart
                            data1={prices1}
                            data2={prices2}
                            asset1Label={chartAssets.asset1}
                            asset2Label={chartAssets.asset2}
                            interval={interval}
                        />
                    ) : (
                        // === Eén asset → oude enkelvoudige grafiek ===
                        <PriceChart
                            data={prices1}
                            color="#4F46E5"
                            title={`${chartAssets.asset1} (${interval})`}
                        />
                    )
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
                                    <tbody>{priceRows1}</tbody>

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
                                        <tbody>{priceRows2}</tbody>

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
