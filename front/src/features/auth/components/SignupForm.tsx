// "use client"
//
// import { useState } from "react"
// import { Button } from "@/src/components/ui/button"
// import { Input } from "@/src/components/ui/input"
// import { Label } from "@/src/components/ui/label"
// import { useSignup } from "../hooks/useSignup"
// import {
//     User, Mail, Phone, Lock, Briefcase, Eye, EyeOff,
//     ChevronDown
// } from "lucide-react"
// import { cn } from "@/src/lib/utils"
// import { CountrySelect } from "@/src/components/ui/countrySelect"
//
// export function SignupForm() {
//     const {
//         fullName,
//         email,
//         role,
//         password,
//         passwordConfirm,
//         phoneCountryCode,
//         phoneNationalNumber,
//         setFullName,
//         setEmail,
//         setRole,
//         setPassword,
//         setPasswordConfirm,
//         setPhoneCountryCode,
//         setPhoneNationalNumber,
//         handleSubmit,
//         isLoading,
//     } = useSignup()
//
//     const [showPassword, setShowPassword] = useState(false)
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false)
//
//     return (
//         <form onSubmit={handleSubmit} className="auth-form animate-slide-up space-y-5">
//             {/* Full name */}
//             <div className="space-y-2.5">
//                 <Label htmlFor="full_name" className="flex items-center gap-2">
//                     <User className="h-4 w-4" />
//                     Full name
//                 </Label>
//                 <div className="relative">
//                     <Input
//                         id="full_name"
//                         placeholder="John Doe"
//                         value={fullName}
//                         onChange={(e) => setFullName(e.target.value)}
//                         required
//                         disabled={isLoading}
//                         className="pl-10"
//                     />
//                     <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                 </div>
//             </div>
//
//             {/* Email */}
//             <div className="space-y-2.5">
//                 <Label htmlFor="email" className="flex items-center gap-2">
//                     <Mail className="h-4 w-4" />
//                     Email
//                 </Label>
//                 <div className="relative">
//                     <Input
//                         id="email"
//                         type="email"
//                         placeholder="john@company.com"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         required
//                         disabled={isLoading}
//                         className="pl-10"
//                     />
//                     <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                 </div>
//             </div>
//
//             {/* Role */}
//             <div className="space-y-2.5">
//                 <Label htmlFor="role" className="flex items-center gap-2">
//                     <Briefcase className="h-4 w-4" />
//                     Role
//                 </Label>
//                 <div className="relative">
//                     <select
//                         id="role"
//                         value={role}
//                         onChange={(e) => setRole(Number(e.target.value))}
//                         disabled={isLoading}
//                         required
//                         className={cn(
//                             "w-full rounded-xl border border-input-border bg-input px-10 py-3 text-sm",
//                             "text-foreground placeholder:text-muted-foreground/70",
//                             "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
//                             "disabled:cursor-not-allowed disabled:opacity-50",
//                             "transition-all duration-200 appearance-none"
//                         )}
//                     >
//                         <option value="" disabled>Select your role</option>
//                         <option value="1">Administrator</option>
//                         <option value="2">Project Manager</option>
//                         <option value="3">Translator</option>
//                         <option value="4">Proofreader</option>
//                     </select>
//                     <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                     <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//                 </div>
//             </div>
//
//             {/* Phone with Country Select */}
//             <div className="space-y-2.5">
//                 <Label htmlFor="phone" className="flex items-center gap-2">
//                     <Phone className="h-4 w-4" />
//                     Phone Number
//                 </Label>
//
//                 <div className="grid grid-cols-12 gap-3">
//                     {/* Country Code Select */}
//                     <div className="col-span-5">
//                         <CountrySelect
//                             value={phoneCountryCode}
//                             onValueChange={setPhoneCountryCode}
//                             disabled={isLoading}
//                         />
//                     </div>
//
//                     {/* Phone number input */}
//                     <div className="col-span-7">
//                         <div className="relative">
//                             <Input
//                                 id="phone_national_number"
//                                 type="tel"
//                                 placeholder="123456789"
//                                 value={phoneNationalNumber}
//                                 onChange={(e) => {
//                                     // Дозволяємо тільки цифри
//                                     const value = e.target.value.replace(/\D/g, '')
//                                     setPhoneNationalNumber(value)
//                                 }}
//                                 required
//                                 disabled={isLoading}
//                                 className="pl-10"
//                             />
//                             <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                         </div>
//                     </div>
//                 </div>
//
//                 {/* Preview повного номера */}
//                 {phoneNationalNumber && (
//                     <p className="text-xs text-muted-foreground">
//                         Full number: {phoneCountryCode} {phoneNationalNumber}
//                     </p>
//                 )}
//             </div>
//
//             {/* Password */}
//             <div className="space-y-2.5">
//                 <Label htmlFor="password" className="flex items-center gap-2">
//                     <Lock className="h-4 w-4" />
//                     Password
//                 </Label>
//                 <div className="relative">
//                     <Input
//                         id="password"
//                         type={showPassword ? "text" : "password"}
//                         placeholder="••••••••"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                         minLength={8}
//                         disabled={isLoading}
//                         className="pl-10 pr-10"
//                     />
//                     <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                     <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
//                     >
//                         {showPassword ? (
//                             <EyeOff className="h-4 w-4" />
//                         ) : (
//                             <Eye className="h-4 w-4" />
//                         )}
//                     </button>
//                 </div>
//
//                 {/* Password strength indicator */}
//                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                     <div className={cn(
//                         "h-1 flex-1 rounded-full transition-colors",
//                         password.length >= 8 ? "bg-emerald-500" : "bg-border"
//                     )} />
//                     <div className={cn(
//                         "h-1 flex-1 rounded-full transition-colors",
//                         /[A-Z]/.test(password) ? "bg-emerald-500" : "bg-border"
//                     )} />
//                     <div className={cn(
//                         "h-1 flex-1 rounded-full transition-colors",
//                         /[0-9]/.test(password) ? "bg-emerald-500" : "bg-border"
//                     )} />
//                     <div className={cn(
//                         "h-1 flex-1 rounded-full transition-colors",
//                         /[^A-Za-z0-9]/.test(password) ? "bg-emerald-500" : "bg-border"
//                     )} />
//                 </div>
//                 <p className="text-xs text-muted-foreground">
//                     Minimum 8 characters with letters and numbers
//                 </p>
//             </div>
//
//             {/* Confirm password */}
//             <div className="space-y-2.5">
//                 <Label htmlFor="password_confirm" className="flex items-center gap-2">
//                     <Lock className="h-4 w-4" />
//                     Confirm password
//                 </Label>
//                 <div className="relative">
//                     <Input
//                         id="password_confirm"
//                         type={showConfirmPassword ? "text" : "password"}
//                         placeholder="••••••••"
//                         value={passwordConfirm}
//                         onChange={(e) => setPasswordConfirm(e.target.value)}
//                         required
//                         minLength={8}
//                         disabled={isLoading}
//                         className="pl-10 pr-10"
//                     />
//                     <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                     <button
//                         type="button"
//                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
//                     >
//                         {showConfirmPassword ? (
//                             <EyeOff className="h-4 w-4" />
//                         ) : (
//                             <Eye className="h-4 w-4" />
//                         )}
//                     </button>
//                 </div>
//                 {passwordConfirm && password !== passwordConfirm && (
//                     <p className="text-xs text-destructive flex items-center gap-1">
//                         Passwords do not match
//                     </p>
//                 )}
//             </div>
//
//             {/* Terms */}
//             <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
//                 <input
//                     type="checkbox"
//                     id="terms"
//                     required
//                     disabled={isLoading}
//                     className="mt-0.5 h-4 w-4 rounded border-input-border bg-input text-primary focus:ring-2 focus:ring-primary/30"
//                 />
//                 <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
//                     I agree to the{" "}
//                     <button type="button" className="text-primary hover:underline font-medium">
//                         Terms of Service
//                     </button>{" "}
//                     and{" "}
//                     <button type="button" className="text-primary hover:underline font-medium">
//                         Privacy Policy
//                     </button>
//                     . I understand that my data will be processed in accordance with GDPR regulations.
//                 </label>
//             </div>
//
//             {/* Submit */}
//             <Button
//                 type="submit"
//                 className="w-full mt-2"
//                 disabled={isLoading || (passwordConfirm && password !== passwordConfirm)}
//                 size="lg"
//             >
//                 {isLoading ? (
//                     <>
//                         <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
//                         Creating account...
//                     </>
//                 ) : (
//                     "Create Account"
//                 )}
//             </Button>
//         </form>
//     )
// }