'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getCroppedImg } from '@/lib/crop-image';
import { api } from '@/lib/eden';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from '@/lib/hooks/use-user';

type ProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
};

export function ProfileModal({ open, onOpenChange, user }: ProfileModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name ?? '');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [step, setStep] = useState<'profile' | 'crop'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    setStep('crop');
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsSubmitting(true);
    try {
      const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, 'image/jpeg', 0.9);
      const res = await api.users({ id: user.id }).patch({ avatar: dataUrl, name: name || undefined });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success('อัปเดตโปรไฟล์แล้ว');
      setImageSrc(null);
      setStep('profile');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.users({ id: user.id }).patch({ name: name || undefined });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success('อัปเดตโปรไฟล์แล้ว');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setStep('profile');
    setName(user.name ?? '');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        size="md"
        className="p-0 max-h-[90dvh] flex flex-col sm:max-w-lg overflow-hidden"
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 sm:px-6 py-4">
          <DialogTitle>
            {step === 'crop' ? 'ตัดรูปโปรไฟล์' : 'แก้ไขโปรไฟล์'}
          </DialogTitle>
        </DialogHeader>

        {step === 'crop' && imageSrc ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative h-[280px] sm:h-[320px] bg-muted">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="px-4 py-3 border-t border-border">
              <label htmlFor="profile-zoom" className="block text-sm font-medium mb-2">ซูม</label>
              <input
                id="profile-zoom"
                name="zoom"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            <DialogFooter className="shrink-0 border-t border-border px-4 sm:px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setImageSrc(null);
                  setStep('profile');
                }}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleSaveCrop}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรูป'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="size-24 sm:size-28 ring-4 ring-muted">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.name ?? user.email} />
                    ) : null}
                    <AvatarFallback className="text-2xl sm:text-3xl">
                      {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    id="profile-avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium"
                  >
                    เปลี่ยนรูป
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">คลิกที่รูปเพื่ออัปโหลดและตัด</p>
              </div>

              <div>
                <label htmlFor="profile-name" className="block text-sm font-semibold mb-2">ชื่อ-นามสกุล</label>
                <Input
                  id="profile-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อของคุณ"
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="block text-sm font-semibold mb-2">อีเมล</label>
                <Input id="profile-email" name="email" value={user.email} disabled className="min-h-[44px] opacity-70" />
                <p className="text-xs text-muted-foreground mt-1">ไม่สามารถแก้ไขอีเมลได้</p>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border px-4 sm:px-6 py-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
