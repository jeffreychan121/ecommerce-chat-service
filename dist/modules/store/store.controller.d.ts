import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/store.dto';
export declare class StoreController {
    private storeService;
    private readonly logger;
    constructor(storeService: StoreService);
    getStores(): Promise<{
        storeType: import("@prisma/client").$Enums.StoreType;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        difyDatasetId: string | null;
        fileStoragePath: string | null;
    }[]>;
    createStore(dto: CreateStoreDto): Promise<{
        storeType: import("@prisma/client").$Enums.StoreType;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        difyDatasetId: string | null;
        fileStoragePath: string | null;
    }>;
    deleteStore(id: string): Promise<void>;
}
