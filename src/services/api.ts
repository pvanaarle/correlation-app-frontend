import { HelloWorldDto } from '../types/dto';

const API_BASE_URL = 'http://localhost:8080/api';

export async function sendHelloRequest(dto: HelloWorldDto): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/hello`, {
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

