

export type Status = 'active'|'inactive'
export type Role = 'user' | 'admin' | 'moderator'; // Define other roles as needed

export type EmploymentStatus = 'employed' | 'unemployed' | 'self-employed' | 'student'; 
export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    role: Role;
    email_verified: boolean;
    country: string;
    status: string;
    profileImage: string;
    employmentStatus: EmploymentStatus;
    created_at: string;
    updated_at: string;
    deleted_at: string;
    token: string;
}