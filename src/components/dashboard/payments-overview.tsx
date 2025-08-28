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