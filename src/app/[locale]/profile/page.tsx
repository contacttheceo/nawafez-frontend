'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Lock, Shield, Trash2, Upload, CheckCircle,
  Clock, XCircle, Eye, EyeOff, AlertTriangle,
} from 'lucide-react';
import { userApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

type ProfileForm = {
  name_ar: string;
  name_en: string;
  phone: string;
};

type PasswordForm = {
  password: string;
  password_confirmation: string;
};

const TABS = ['profile', 'security', 'verification', 'danger'] as const;
type Tab = typeof TABS[number];

export default function ProfilePage() {
  const locale  = useLocale();
  const router  = useRouter();
  const isRTL   = locale === 'ar';
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();

  const [activeTab, setActiveTab]     = useState<Tab>('profile');
  const [showPass, setShowPass]       = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass]   = useState(false);
  const [crFile,       setCrFile]       = useState<File | null>(null);
  const [crCompany,    setCrCompany]    = useState('');
  const [crNumber,     setCrNumber]     = useState('');
  const [uploadingCR,  setUploadingCR]  = useState(false);
  const [deletePass, setDeletePass]   = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name_ar: user?.name_ar ?? '',
      name_en: user?.name_en ?? '',
      phone:   user?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) router.push(`/${locale}/auth/login`);
  }, [isAuthenticated]);

  // Prefill form when user loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name_ar: user.name_ar,
        name_en: user.name_en,
        phone:   user.phone ?? '',
      });
    }
  }, [user]);

  const saveProfile = async (data: ProfileForm) => {
    setSavingProfile(true);
    try {
      const res = await userApi.updateProfile({
        name_ar: data.name_ar,
        name_en: data.name_en,
        phone:   data.phone,
      });
      setUser(res.data ?? res);
      toast.success(isRTL ? 'تم تحديث الملف الشخصي ✓' : 'Profile updated ✓');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (data: PasswordForm) => {
    setSavingPass(true);
    try {
      await userApi.updateProfile({
        password:              data.password,
        password_confirmation: data.password_confirmation,
      });
      toast.success(isRTL ? 'تم تغيير كلمة المرور ✓' : 'Password changed ✓');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error'));
    } finally {
      setSavingPass(false);
    }
  };

  const uploadVerification = async () => {
    if (!crFile || !crCompany.trim() || !crNumber.trim()) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setUploadingCR(true);
    try {
      const fd = new FormData();
      fd.append('company_name', crCompany.trim());
      fd.append('cr_number',    crNumber.trim());
      fd.append('cr_document',  crFile);
      const res = await userApi.uploadBusinessVerification(fd);
      setUser(res.data ?? res);
      toast.success(isRTL ? 'تم رفع الوثيقة! جارٍ المراجعة.' : 'Document uploaded! Under review.');
      setCrFile(null); setCrCompany(''); setCrNumber('');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (isRTL ? 'فشل الرفع' : 'Upload failed');
      toast.error(msg);
    } finally {
      setUploadingCR(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePass) return;
    setDeletingAccount(true);
    try {
      await userApi.deleteAccount(deletePass);
      clearAuth();
      localStorage.removeItem('nawafez_token');
      router.push(`/${locale}`);
      toast.success(isRTL ? 'تم حذف الحساب.' : 'Account deleted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (isRTL ? 'كلمة مرور خاطئة' : 'Wrong password'));
      setDeletingAccount(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  const bv = user.business_verification;

  const tabConfig = [
    { id: 'profile',      labelAr: 'الملف الشخصي', labelEn: 'Profile',      Icon: User     },
    { id: 'security',     labelAr: 'الأمان',        labelEn: 'Security',     Icon: Lock     },
    { id: 'verification', labelAr: 'التحقق التجاري',labelEn: 'Verification', Icon: Shield   },
    { id: 'danger',       labelAr: 'منطقة الخطر',   labelEn: 'Danger Zone',  Icon: Trash2   },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-navy">
            {isRTL ? 'إعدادات الحساب' : 'Account Settings'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRTL ? user.name_ar : user.name_en} · {user.email}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar Tabs */}
          <div className="md:w-52 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {tabConfig.map(({ id, labelAr, labelEn, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
                            transition whitespace-nowrap flex-shrink-0
                            ${activeTab === id
                              ? id === 'danger'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-navy text-white'
                              : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon size={16} />
                {isRTL ? labelAr : labelEn}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card p-6">
                <h2 className="font-bold text-navy mb-5 text-lg">
                  {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
                </h2>
                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {isRTL ? 'الاسم بالعربية' : 'Name (Arabic)'} *
                      </label>
                      <input
                        {...profileForm.register('name_ar', { required: true })}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {isRTL ? 'الاسم بالإنجليزية' : 'Name (English)'} *
                      </label>
                      <input
                        {...profileForm.register('name_en', { required: true })}
                        className="input text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                      dir="ltr"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {isRTL ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {isRTL ? 'رقم الجوال' : 'Phone'}
                    </label>
                    <input
                      {...profileForm.register('phone')}
                      type="tel"
                      className="input text-sm"
                      dir="ltr"
                      placeholder="+966 5X XXX XXXX"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary py-2.5 px-6 text-sm disabled:opacity-60"
                  >
                    {savingProfile
                      ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...')
                      : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="card p-6">
                <h2 className="font-bold text-navy mb-5 text-lg">
                  {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                </h2>
                <form onSubmit={passwordForm.handleSubmit(savePassword)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        {...passwordForm.register('password', { required: true, minLength: 8 })}
                        className="input text-sm pe-9"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute inset-y-0 end-2.5 flex items-center text-gray-400"
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {isRTL ? '8 أحرف على الأقل' : 'Min 8 characters'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      {...passwordForm.register('password_confirmation', {
                        required: true,
                        validate: (val) =>
                          val === passwordForm.watch('password') ||
                          (isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'),
                      })}
                      className="input text-sm"
                      placeholder="••••••••"
                    />
                    {passwordForm.formState.errors.password_confirmation && (
                      <p className="text-red-500 text-xs mt-1">
                        {passwordForm.formState.errors.password_confirmation.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={savingPass}
                    className="btn-navy py-2.5 px-6 text-sm disabled:opacity-60"
                  >
                    {savingPass
                      ? (isRTL ? 'جارٍ التغيير...' : 'Updating...')
                      : (isRTL ? 'تغيير كلمة المرور' : 'Update Password')}
                  </button>
                </form>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="font-bold text-navy mb-1 text-lg">
                    {isRTL ? 'التحقق التجاري' : 'Business Verification'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isRTL
                      ? 'ارفع وثيقة السجل التجاري للحصول على شارة "موثق" والمزايا الإضافية.'
                      : 'Upload your commercial registration to get a verified badge and extra features.'}
                  </p>
                </div>

                {/* Current status */}
                {bv && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl border
                    ${bv.status === 'approved' ? 'bg-emerald/5 border-emerald/30' :
                      bv.status === 'pending'  ? 'bg-amber-50 border-amber-200' :
                                                 'bg-red-50 border-red-200'}`}>
                    {bv.status === 'approved' ? (
                      <CheckCircle className="text-emerald flex-shrink-0" size={20} />
                    ) : bv.status === 'pending' ? (
                      <Clock className="text-amber-500 flex-shrink-0" size={20} />
                    ) : (
                      <XCircle className="text-red-500 flex-shrink-0" size={20} />
                    )}
                    <div>
                      <p className="font-semibold text-sm">
                        {bv.status === 'approved'
                          ? (isRTL ? 'تم التحقق ✓' : 'Verified ✓')
                          : bv.status === 'pending'
                          ? (isRTL ? 'قيد المراجعة' : 'Under Review')
                          : (isRTL ? 'مرفوض' : 'Rejected')}
                      </p>
                      {bv.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{bv.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload form — shown when no verification, rejected, or pending (allow resubmit) */}
                {(!bv || bv.status === 'rejected' || bv.status === 'pending') && (
                  <div className="space-y-4">
                    {bv?.status === 'pending' && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {isRTL
                          ? 'يمكنك رفع وثيقة جديدة لتحديث طلبك المعلق.'
                          : 'You can upload a new document to update your pending request.'}
                      </p>
                    )}
                    {/* Company name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {isRTL ? 'اسم الشركة *' : 'Company Name *'}
                      </label>
                      <input
                        value={crCompany}
                        onChange={(e) => setCrCompany(e.target.value)}
                        className="input text-sm"
                        placeholder={isRTL ? 'الاسم التجاري كما في السجل' : 'Company name as in CR'}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    {/* CR number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {isRTL ? 'رقم السجل التجاري *' : 'CR Number *'}
                      </label>
                      <input
                        value={crNumber}
                        onChange={(e) => setCrNumber(e.target.value)}
                        className="input text-sm"
                        placeholder="1010XXXXXXX"
                        dir="ltr"
                        maxLength={30}
                      />
                    </div>

                    {/* File upload */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {isRTL ? 'وثيقة السجل التجاري *' : 'CR Document *'}
                      </label>
                      <label className="flex flex-col items-center gap-3 border-2 border-dashed
                                        border-gray-300 rounded-xl p-6 cursor-pointer hover:border-emerald transition">
                        <Upload className="text-gray-400 w-8 h-8" />
                        <span className="text-sm text-gray-500 text-center">
                          {crFile
                            ? `✓ ${crFile.name}`
                            : (isRTL
                              ? 'انقر لرفع السجل التجاري (PDF أو صورة، بحد أقصى 5MB)'
                              : 'Click to upload CR document (PDF or image, max 5MB)')}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => setCrFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>

                    <button
                      onClick={uploadVerification}
                      disabled={uploadingCR || !crFile || !crCompany.trim() || !crNumber.trim()}
                      className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      <Upload size={15} />
                      {uploadingCR
                        ? (isRTL ? 'جارٍ الرفع...' : 'Uploading...')
                        : (isRTL ? 'رفع طلب التحقق' : 'Submit Verification')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="card p-6 border-red-200 border">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-red-500" size={20} />
                  <h2 className="font-bold text-red-600 text-lg">
                    {isRTL ? 'حذف الحساب' : 'Delete Account'}
                  </h2>
                </div>

                <p className="text-sm text-gray-600 mb-5">
                  {isRTL
                    ? 'حذف الحساب نهائي ولا يمكن التراجع عنه. ستُحذف جميع إعلاناتك وبياناتك.'
                    : 'Account deletion is permanent and cannot be undone. All your listings and data will be removed.'}
                </p>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-5 py-2.5 rounded-lg border border-red-300 text-red-500 text-sm
                               font-semibold hover:bg-red-50 transition"
                  >
                    {isRTL ? 'أريد حذف حسابي' : 'I want to delete my account'}
                  </button>
                ) : (
                  <div className="space-y-4 bg-red-50 rounded-xl p-4 border border-red-200">
                    <p className="text-sm font-semibold text-red-700">
                      {isRTL
                        ? 'أدخل كلمة المرور للتأكيد:'
                        : 'Enter your password to confirm:'}
                    </p>
                    <input
                      type="password"
                      value={deletePass}
                      onChange={(e) => setDeletePass(e.target.value)}
                      className="input text-sm border-red-300 focus:border-red-500"
                      placeholder="••••••••"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={deleteAccount}
                        disabled={!deletePass || deletingAccount}
                        className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold
                                   hover:bg-red-600 transition disabled:opacity-50"
                      >
                        {deletingAccount
                          ? (isRTL ? 'جارٍ الحذف...' : 'Deleting...')
                          : (isRTL ? 'تأكيد الحذف النهائي' : 'Confirm Delete')}
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(false); setDeletePass(''); }}
                        className="px-5 py-2.5 rounded-lg border text-sm text-gray-600 hover:bg-gray-100 transition"
                      >
                        {isRTL ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
