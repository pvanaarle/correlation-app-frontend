import React, { useState } from 'react';
import { sendHelloRequest } from '../services/api';
import { HelloWorldDto } from '../types/dto';

const Dashboard: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResponseMessage('');
    setIsLoading(true);

    try {
      const dto: HelloWorldDto = { name };
      const message = await sendHelloRequest(dto);
      setResponseMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
      <div className="bg-white rounded-2xl p-10 shadow-2xl max-w-md w-full border border-gray-100">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Hi, what's your name?
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-8">
          <div className="flex flex-col">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 placeholder:text-gray-400"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </form>
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-center shadow-sm">
            <div className="font-medium">{error}</div>
          </div>
        )}
        {responseMessage && (
          <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl text-green-800 text-center shadow-sm">
            <div className="text-lg font-semibold">{responseMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

