'use client';

interface PaymentsOverviewProps {
  stats: {
    all: number;
    succeeded: number;
    pending: number;
    failed: number;
    refunded: number;
    disputed: number;
    uncaptured: number;
  };
  filter: 'all' | 'succeeded' | 'pending' | 'failed';
  onFilterChange: (filter: 'all' | 'succeeded' | 'pending' | 'failed') => void;
}

export function PaymentsOverview({ stats, filter, onFilterChange }: PaymentsOverviewProps) {
  const cards = [
    { 
      key: 'all' as const, 
      label: 'All', 
      count: stats.all,
      color: 'bg-indigo-600 text-white',
      borderColor: 'border-indigo-600'
    },
    { 
      key: 'succeeded' as const, 
      label: 'Succeeded', 
      count: stats.succeeded,
      color: 'bg-white text-gray-900',
      borderColor: 'border-gray-200'
    },
    { 
      key: 'pending' as const, 
      label: 'Pending', 
      count: stats.pending,
      color: 'bg-white text-gray-900',
      borderColor: 'border-gray-200'
    },
    { 
      key: 'refunded' as const, 
      label: 'Refunded', 
      count: stats.refunded,
      color: 'bg-white text-gray-900',
      borderColor: 'border-gray-200',
      disabled: true
    },
    { 
      key: 'disputed' as const, 
      label: 'Disputed', 
      count: stats.disputed,
      color: 'bg-white text-gray-900',
      borderColor: 'border-gray-200',
      disabled: true
    },
    { 
      key: 'failed' as const, 
      label: 'Failed', 
      count: stats.failed,
      color: 'bg-white text-gray-900',
      borderColor: 'border-gray-200'
    },
    { 
      key: 'uncaptured' as const, 
      label: 'Uncaptured', 
      count: stats.uncaptured,
      color: 'bg-white text-gray-900',
      borderColor: 'border-gray-200',
      disabled: true
    }
  ];

  return (
    <div className="mb-8">
      {/* Recommendation Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Recommendation</span> • Ask questions, prompt AI to write sBTC code, and execute API calls right from your code editor.
          </p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Get started
        </button>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {cards.map(card => (
          <button
            key={card.key}
            onClick={() => !card.disabled && onFilterChange(card.key as any)}
            disabled={card.disabled}
            className={`
              relative rounded-lg p-4 text-left transition-all
              ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
              ${filter === card.key 
                ? `${card.key === 'all' ? 'bg-indigo-600 text-white' : 'bg-white'} ring-2 ring-indigo-600 shadow-sm` 
                : `${card.color} border ${card.borderColor}`
              }
            `}
          >
            <div className="text-xs font-medium opacity-70 mb-1">
              {card.label}
            </div>
            <div className="text-2xl font-semibold">
              {card.count}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}