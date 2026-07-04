'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginSchema, LoginFormValues } from "@/lib/schemas/auth";
import { login } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FolderOpen, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      window.dispatchEvent(new Event('authchange'));
      router.push('/');
    },
  });

  const onSubmit = (values: LoginFormValues) => mutation.mutate(values);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[var(--teal)] via-[#14171C] to-[var(--ink)]">
      
      {/* Animated Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[var(--teal)]/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[var(--amber)]/10 blur-[100px] rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] blur-3xl rounded-full" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
        
        <div className="bg-[var(--paper)] rounded-2xl shadow-2xl border border-[var(--line)] p-8 md:p-10">
          
          {/* Header / Branding Area (Replaces the weird orange tag) */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4 p-3 bg-[var(--teal)]/10 rounded-2xl">
              <FolderOpen className="h-7 w-7 text-[var(--teal)]" />
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--ink)] tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--muted)] mt-2 font-body">
              Sign in to access your company&apos;s asset archive.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[var(--ink)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@logiclens.com"
                {...register('email')}
                className="h-11 border-[var(--line)] bg-white focus-visible:ring-[var(--teal)] focus-visible:border-[var(--teal)]"
              />
              {errors.email && (
                <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--ink)]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="h-11 border-[var(--line)] bg-white focus-visible:ring-[var(--teal)] focus-visible:border-[var(--teal)]"
              />
              {errors.password && (
                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Global Error State */}
            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 font-medium">
                Invalid email or password. Please try again.
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full h-11 bg-[var(--ink)] hover:bg-[var(--ink])/90 text-[var(--paper)] font-semibold text-sm rounded-lg transition-all active:scale-[0.98]"
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
          
          {/* Footer inside card */}
          <div className="mt-8 pt-6 border-t border-[var(--line)] text-center">
            <p className="text-xs text-[var(--muted)]">
              © {new Date().getFullYear()} LogicLens. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}