// src/services/api.ts

import { HelloWorldDto, AssetDto, PricePointDto } from '../types/dto';

const API_BASE_URL = 'http://localhost:8080/api';
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL as string;

// ---------- oude demo-call, mag gewoon blijven ----------

export async function sendHelloRequest(dto: HelloWorldDto): Promise<string> {
    const response = await fetch(apiBaseUrl + `/hello`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    return data;
}

// ---------- NIEUW: alle assets ophalen ----------

export async function fetchAssets(): Promise<AssetDto[]> {
    const response = await fetch(apiBaseUrl + `/assets`);

    if (!response.ok) {
        throw new Error(`Failed to load assets (status ${response.status})`);
    }

    return await response.json();
}

// ---------- NIEUW: prijsreeks voor één asset ----------
// symbolOrName kan "BTC/USD", "TSLA", "Bitcoin", "bitcoin", ... zijn

export async function fetchPrices(
    symbolOrName: string,
    timeframe: string,
    interval: string
): Promise<PricePointDto[]> {

    const encoded = encodeURIComponent(symbolOrName);

    const url =
        apiBaseUrl + `/assets/prices/${encoded}` +
        `?timeframe=${timeframe}&interval=${interval}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to load prices (status ${response.status})`);
    }

    return await response.json();
}
