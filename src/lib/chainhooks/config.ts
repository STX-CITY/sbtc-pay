export interface ChainhookConfig {
  uuid: string;
  name: string;
  version: number;
  networks: {
    testnet?: ChainhookNetwork;
    mainnet?: ChainhookNetwork;
  };
}

export interface ChainhookNetwork {
  start_block?: number;
  end_block?: number;
  if_this: ChainhookPredicate;
  then_that: ChainhookAction;
}

export interface ChainhookPredicate {
  scope: 'contract_call';
  contract_identifier: string;
  method: string;
}

export interface ChainhookAction {
  http_post: {
    url: string;
    authorization_header: string;
  };
}

export const SBTC_PAYMENT_CHAINHOOK: ChainhookConfig = {
  uuid: 'sbtc-payment-monitor',
  name: 'sBTC Payment Monitor',
  version: 1,
  networks: {
    testnet: {
      if_this: {
        scope: 'contract_call',
        contract_identifier: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token',
        method: 'transfer'
      },
      then_that: {
        http_post: {
          url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chainhooks/payments/hook`,
          authorization_header: `Bearer ${process.env.CHAINHOOK_SECRET || 'default-secret'}`
        }
      }
    },
    mainnet: {
      if_this: {
        scope: 'contract_call',
        contract_identifier: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token',
        method: 'transfer'
      },
      then_that: {
        http_post: {
          url: `${process.env.NEXTAUTH_URL}/api/chainhooks/payments/hook`,
          authorization_header: `Bearer ${process.env.CHAINHOOK_SECRET}`
        }
      }
    }
  }
};