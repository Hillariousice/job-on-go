export interface Job{
    id: number;
    title: string;
    description: string;
    salary: string;
    location: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
    company_id: number;
    company_name: string;
    company_email: string;
    company_phone: string;
    company_address: string;
    company_country: string;
    company_status: string;
    company_created_at: string;
    company_updated_at: string;
    company_deleted_at: string;
    company_token: string;
}

export interface JobState{
    jobs: Job[];
    job: Job | null;
    loading: boolean;
    error: string;
}

