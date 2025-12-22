export interface ChangePasswordValues {
    current_password: string
    new_password: string
    confirm_password: string
}

export function validateChangePassword(values: ChangePasswordValues) {
    const errors: Partial<Record<keyof ChangePasswordValues, string>> = {}

    if (!values.current_password) {
        errors.current_password = "Current password is required"
    }

    if (!values.new_password) {
        errors.new_password = "New password is required"
    } else if (values.new_password.length < 8) {
        errors.new_password = "Password must be at least 8 characters"
    }

    if (values.confirm_password !== values.new_password) {
        errors.confirm_password = "Passwords do not match"
    }

    return errors
}
