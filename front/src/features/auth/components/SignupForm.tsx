"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useSignup } from "../hooks/useSignup"

export function SignupForm() {
    const {
        fullName,
        email,
        role,
        password,
        passwordConfirm,
        phoneCountryCode,
        phoneNationalNumber,
        setFullName,
        setEmail,
        setRole,
        setPassword,
        setPasswordConfirm,
        setPhoneCountryCode,
        setPhoneNationalNumber,
        handleSubmit,
        isLoading,
    } = useSignup()

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full name */}
            <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            {/* Role */}
            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full rounded-md border px-3 py-2 text-sm"
                >
                    <option value="">Select role</option>
                    <option value="1">Admin</option>
                    <option value="2">Manager</option>
                    <option value="3">Translator</option>
                </select>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                    <Label htmlFor="phone_country_code">Code</Label>
                    <Input
                        id="phone_country_code"
                        placeholder="+380"
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="phone_national_number">Phone number</Label>
                    <Input
                        id="phone_national_number"
                        placeholder="991234567"
                        value={phoneNationalNumber}
                        onChange={(e) => setPhoneNationalNumber(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                />
            </div>

            {/* Password confirm */}
            <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm password</Label>
                <Input
                    id="password_confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
            </Button>
        </form>
    )
}
