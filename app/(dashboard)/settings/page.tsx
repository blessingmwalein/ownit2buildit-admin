"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import {
  User, Key, Copy, Eye, EyeOff, RefreshCw,
  CheckCircle2, Shield, AlertTriangle, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchProfileThunk, rotateApiKeyThunk } from "@/store/slices/authSlice";
import { formatDateTime } from "@/lib/utils";

// ─── Rotate API Key Form ──────────────────────────────────────────────────────

const rotateSchema = yup.object({
  reason: yup.string().min(5, "Reason must be at least 5 characters").required("Reason is required"),
});

type RotateForm = yup.InferType<typeof rotateSchema>;

interface RotateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

function RotateApiKeyDialog({ open, onClose, onConfirm, loading }: RotateDialogProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RotateForm>({
    resolver: yupResolver(rotateSchema),
  });

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Rotate API Key
          </DialogTitle>
          <DialogDescription>
            Your current API key will be <strong>invalidated immediately</strong>. Any server-to-server integrations using the old key will stop working. Update them with the new key after rotation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => onConfirm(d.reason))} className="space-y-4 mt-1">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for rotation</Label>
            <Input
              id="reason"
              placeholder="e.g. Scheduled quarterly rotation, suspected compromise..."
              {...register("reason")}
            />
            {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="warning" loading={loading}>
              <RefreshCw className="w-4 h-4 mr-2" /> Rotate Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { profile, loading } = useAppSelector((s) => s.auth);
  const [showKey, setShowKey] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotateLoading, setRotateLoading] = useState(false);
  const [lastRotated, setLastRotated] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  const handleRotate = async (reason: string) => {
    setRotateLoading(true);
    const result = await dispatch(rotateApiKeyThunk(reason));
    setRotateLoading(false);
    if (rotateApiKeyThunk.fulfilled.match(result)) {
      setLastRotated(result.payload.rotatedAt);
      setRotateOpen(false);
      toast.success("API key rotated successfully. Update your integrations.");
    } else {
      toast.error("Failed to rotate API key");
    }
  };

  const maskedKey = profile?.apiKey
    ? `${profile.apiKey.slice(0, 12)}${"•".repeat(20)}${profile.apiKey.slice(-4)}`
    : "••••••••••••••••••••••••••••••••";

  const displayName = profile?.name || profile?.displayName || "Platform Admin";
  const apiKeyValue = profile?.apiKey ?? "";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Your platform admin account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="flex items-center gap-2">
                <Input value={displayName} readOnly className="bg-slate-50 cursor-default" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={profile?.email ?? ""} readOnly className="pl-9 bg-slate-50 cursor-default" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Admin ID</Label>
              <div className="flex items-center gap-2">
                <Input value={profile?.id ?? ""} readOnly className="font-mono text-xs bg-slate-50 cursor-default" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(profile?.id ?? "", "Admin ID")}
                  title="Copy Admin ID"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Card */}
      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle>Platform API Key</CardTitle>
              <CardDescription>Used for server-to-server API requests (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">x-platform-admin-key</code>)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security info */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-0.5">
              <p className="font-semibold">Keep this key secret</p>
              <p>Never expose it in client-side code, version control, or public places. Rotate immediately if compromised.</p>
            </div>
          </div>

          {/* Key display */}
          <div className="space-y-2">
            <Label>Current API Key</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={showKey ? apiKeyValue : maskedKey}
                  readOnly
                  className="font-mono text-xs bg-slate-50 pr-10 cursor-default"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(apiKeyValue, "API key")}
                title="Copy API key"
                disabled={!apiKeyValue}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {lastRotated && (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Key rotated on {formatDateTime(lastRotated)}
            </div>
          )}

          <Separator />

          {/* Rotate action */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Rotate API Key</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Generates a new key. The current key is immediately invalidated.
              </p>
            </div>
            <Button
              variant="warning"
              size="sm"
              className="shrink-0"
              onClick={() => setRotateOpen(true)}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Rotate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auth Usage Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Auth Header Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Bearer Token (browser session)</p>
              <code className="block text-xs bg-slate-900 text-emerald-400 rounded-lg p-3 font-mono">
                Authorization: Bearer &lt;accessToken&gt;
              </code>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">API Key (server-to-server)</p>
              <code className="block text-xs bg-slate-900 text-emerald-400 rounded-lg p-3 font-mono">
                x-platform-admin-key: &lt;apiKey&gt;
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <RotateApiKeyDialog
        open={rotateOpen}
        onClose={() => setRotateOpen(false)}
        onConfirm={handleRotate}
        loading={rotateLoading}
      />
    </div>
  );
}
