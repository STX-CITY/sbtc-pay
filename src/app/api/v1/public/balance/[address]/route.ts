import { NextRequest, NextResponse } from 'next/server';

interface AssetEvent {
  event_index: number;
  event_type: 'fungible_token_asset' | 'stx_asset';
  tx_id: string;
  asset: {
    asset_event_type: 'mint' | 'transfer' | 'burn';
    asset_id?: string;
    sender: string;
    recipient: string;
    amount: string;
  };
}

interface HiroApiResponse {
  limit: number;
  offset: number;
  total: number;
  results: AssetEvent[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Address is required' } },
        { status: 400 }
      );
    }

    // Fetch asset events from Hiro API
    const hiroResponse = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${address}/assets?limit=100`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!hiroResponse.ok) {
      throw new Error(`Hiro API error: ${hiroResponse.status}`);
    }

    const data: HiroApiResponse = await hiroResponse.json();

    // Calculate sBTC balance from fungible token events
    let sbtcBalance = 0;
    const sbtcAssetId = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc-token';

    for (const event of data.results) {
      if (event.event_type === 'fungible_token_asset' && 
          event.asset.asset_id === sbtcAssetId) {
        const amount = parseInt(event.asset.amount);
        
        if (event.asset.asset_event_type === 'mint' || 
            (event.asset.asset_event_type === 'transfer' && event.asset.recipient === address)) {
          // Add to balance for mints and incoming transfers
          sbtcBalance += amount;
        } else if (event.asset.asset_event_type === 'transfer' && event.asset.sender === address) {
          // Subtract from balance for outgoing transfers
          sbtcBalance -= amount;
        } else if (event.asset.asset_event_type === 'burn' && event.asset.sender === address) {
          // Subtract from balance for burns
          sbtcBalance -= amount;
        }
      }
    }

    // Convert from microsBTC to sBTC (divide by 100,000,000)
    const sbtcAmount = sbtcBalance / 100_000_000;

    return NextResponse.json({
      address,
      sbtc_balance: sbtcBalance, // Raw microsBTC amount
      sbtc_amount: sbtcAmount,   // Human readable sBTC amount
      formatted_balance: `${sbtcAmount.toFixed(8)} sBTC`,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to fetch balance' } },
      { status: 500 }
    );
  }
}