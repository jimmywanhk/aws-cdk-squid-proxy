export interface AppConfig {
    project: string;
    environments: {
      [key: string]: {
        account?: string;
        region?: string;
        keyPairName: string;
        vpc: {
          cidr: string;
          maxAzs: number;
        };
        squid: {
          instanceType: string;
          memoryLimit: number;
          memoryReservation: number;
          desiredCount: number;
        };
      };
    };
  }
  
  export const appConfig: AppConfig = {
    project: 'squid-proxy',
    environments: {
      dev: {
        keyPairName: 'dev-squid-keypair',
        vpc: {
          cidr: '10.0.0.0/16',
          maxAzs: 2,
        },
        squid: {
          instanceType: 't3.micro',
          memoryLimit: 512,
          memoryReservation: 256,
          desiredCount: 1,
        },
      },
      prod: {
        account: '328909449322',
        region: 'us-east-1',
        keyPairName: 'prod-squid-keypair',
        vpc: {
          cidr: '10.1.0.0/16',
          maxAzs: 3,
        },
        squid: {
          instanceType: 't3.micro',
          memoryLimit: 512,
          memoryReservation: 256,
          desiredCount: 1,
        },
      },
    },
  };