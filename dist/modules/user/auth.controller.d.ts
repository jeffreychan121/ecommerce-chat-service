import { UserService } from './user.service';
export declare class AuthController {
    private userService;
    private readonly logger;
    constructor(userService: UserService);
    login(body: {
        phone: string;
    }): Promise<{
        userId: string;
        phone: string;
    }>;
    getUserByPhone(body: {
        phone: string;
    }): Promise<{
        userId: string;
        phone: string;
    }>;
}
