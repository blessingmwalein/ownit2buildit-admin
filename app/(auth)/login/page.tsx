"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Building2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginThunk, clearError } from "@/store/slices/authSlice";

const schema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

type LoginForm = yup.InferType<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, token } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data: LoginForm) => {
    await dispatch(loginThunk({ email: data.email, password: data.password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ownit2buildit</h1>
          <p className="text-indigo-300 text-sm mt-1">Platform Administration Portal</p>
        </div>

        <Card className="border-0 shadow-2xl shadow-black/30 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to access the admin portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@builderpro.app"
                    className="pl-9"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-indigo-300 mt-6">
          ownit2buildit Platform Admin &mdash; Authorized access only
        </p>
      </div>
    </div>
  );
}
