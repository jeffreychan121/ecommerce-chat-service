import { OnModuleInit } from '@nestjs/common';
export declare class CacheService implements OnModuleInit {
    private redis;
    onModuleInit(): void;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
