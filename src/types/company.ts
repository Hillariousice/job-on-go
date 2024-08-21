export interface Company{
    id: number;
    name: string;
    email: string;
    description: string;
    emailVerified: boolean;
    password: string;
    phone: string;
    address: string;
    location:string;
    country: string;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
    token: string;
    profileImage: string;
}

export interface CompanySignup {
    id: string;
    name: string;
    description: string;
    email: string;
    password: string;
    phone: string;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
    token: string;
}