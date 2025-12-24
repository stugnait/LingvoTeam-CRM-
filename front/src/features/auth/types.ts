// features/auth/types.ts

/* ========= REQUESTS ========= */

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = {
    full_name: string;
    email: string;
    role: number;

    password: string;
    password_confirm: string;

    phone_country_code: string;    // "+380"
    phone_national_number: string; // "991234567"
};


/* ========= RESPONSES ========= */

export type Role = {
    id: number
    name: string
    slug: string
}

export type AuthUser = {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    phone: string;
};

export type LoginResponse = {
    message: "success";
    user: AuthUser;
};

export type RegisterResponse = {
    user: AuthUser;
};

// src/features/auth/types.ts

// Existing types...

// Forgot Password
export interface ForgotPasswordPayload {
    uid: string
    token: string
    email: string
}

export interface ForgotPasswordResponse {
    detail: string
    reset_link: string
}

export interface ResetPasswordPayload {
    uid: string
    token: string
    new_password: string
    new_password_confirm: string
}

export interface ResetPasswordResponse {
    detail: string
}




/* ========= ERRORS ========= */

export type ValidationErrorResponse = {
    [field: string]: string[];
};
