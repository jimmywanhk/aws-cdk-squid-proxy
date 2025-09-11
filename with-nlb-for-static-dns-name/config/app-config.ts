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
          cpu: number;
          memoryLimitMiB: number;
          memoryReservationMiB: number;
          minCapacity: number;
          maxCapacity: number;
          desiredCapacity: number;
        };
      };
    };
  }
  
  export const appConfig: AppConfig = {
    project: 'squid-proxy-nlb',
    environments: {
      dev: {
        keyPairName: 'dev-squid-keypair',
        vpc: {
          cidr: '10.0.0.0/16',
          maxAzs: 1, //2,
        },
        squid: {
          instanceType: 't3.micro',
          cpu: 2048, // 2 vCPU
          memoryLimitMiB: 512,
          memoryReservationMiB: 256,
          minCapacity: 1,
          maxCapacity: 1,
          desiredCapacity: 1,
        },
      },
      prod: {
        //account: '328909449322',
        //region: 'us-east-1',
        keyPairName: 'prod-squid-keypair',
        vpc: {
          cidr: '10.1.0.0/16',
          maxAzs: 1, //3,
        },
        squid: {
          instanceType: 't3.micro',
          cpu: 2048, // 2 vCPU
          memoryLimitMiB: 512,
          memoryReservationMiB: 256,
          minCapacity: 1,
          maxCapacity: 1,
          desiredCapacity: 1,
        },
      },
    },
  };