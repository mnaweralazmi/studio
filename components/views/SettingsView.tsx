'use client';

import {
  Bell,
  UserCircle,
  LogOut,
  Loader2,
  Archive,
  UserCog,
  Send,
  Settings,
  Save,
  Camera,
  Trash2,
  Plus,
  MoreVertical,
  AlertCircle,
  RotateCcw,
  Home,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  signOut,
  linkWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collectionGroup,
  query,
  where,
  getDocs,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { useDocument } from 'react-firebase-hooks/firestore';
import { ThemeSwitcher } from '@/components/theme-switcher';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '../ui/use-toast';
import { Toggle } from '../ui/toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { User as FirebaseUser } from 'firebase/auth';


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.696,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);


// --- ARCHIVE VIEW COMPONENT (MERGED) ---

const COLLECTION_CONFIG = {
  expenses: { name: 'المصاريف العامة', fields: ['item', 'category', 'amount'] },
  agriExpenses: { name: 'مصاريف الزراعة', fields: ['item', 'category', 'amount'] },
  poultryExpenses: { name: 'مصاريف الدواجن', fields: ['item', 'category', 'amount'] },
  livestockExpenses: { name: 'مصاريف المواشي', fields: ['item', 'category', 'amount'] },
  agriSales: { name: 'مبيعات الزراعة', fields: ['item', 'cartonCount', 'totalAmount'] },
  poultryEggSales: { name: 'مبيعات البيض', fields: ['trayCount', 'totalAmount'] },
  poultrySales: { name: 'مبيعات الدواجن', fields: ['poultryType', 'count', 'totalAmount'] },
  livestockSales: { name: 'مبيعات المواشي', fields: ['animalType', 'count', 'totalAmount'] },
  debts: { name: 'الديون', fields: ['party', 'type', 'amount'] },
  workers: { name: 'العمال', fields: ['name', 'salary'] },
  facilities: { name: 'المرافق', fields: ['name', 'type'] },
  poultryFlocks: { name: 'قطعان الدواجن', fields: ['name', 'birdCount'] },
  livestockHerds: { name: 'قطعان المواشي', fields: ['name', 'animalCount'] },
  publicTopics: { name: 'المواضيع العامة', fields: ['title', 'authorName']}
};

const formatDate = (date: any) => {
    if (!date) return 'غير متوفر';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ar-KW', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatValue = (key: string, value: any) => {
    if (value === undefined || value === null) return 'N/A';
    if (['amount', 'totalAmount', 'cartonPrice', 'pricePerUnit', 'salary'].includes(key)) {
        return `${Number(value).toFixed(3)} د.ك`;
    }
     if (key === 'isPublic') {
        return value ? 'عام' : 'خاص';
    }
    if (value instanceof Timestamp) {
        return formatDate(value);
    }
    return value.toString();
}

function ArchiveView({ user }: { user: FirebaseUser | null | undefined }) {
  const [archivedData, setArchivedData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ path: string; id: string } | null>(null);

  const fetchArchivedData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allArchivedData: Record<string, any[]> = {};
      const collectionKeys = Object.keys(COLLECTION_CONFIG);
      
      const userRef = doc(db, 'users', user.uid);

      const promises = collectionKeys.map(async (collectionId) => {
        // Special handling for top-level collections like publicTopics
        let collectionRef;
        if (['publicTopics'].includes(collectionId)) {
            collectionRef = collection(db, collectionId);
        } else {
            collectionRef = collection(userRef, collectionId);
        }

        const q = query(collectionRef, where('archived', '==', true));
        return getDocs(q);
      });

      const snapshots = await Promise.all(promises);

      snapshots.forEach((snapshot, index) => {
        const collectionId = collectionKeys[index];
        if (!snapshot.empty) {
            allArchivedData[collectionId] = snapshot.docs.map(d => ({
                id: d.id,
                path: d.ref.path,
                ...d.data(),
            }));
        }
      });
      
      setArchivedData(allArchivedData);
    } catch (e: any) {
      console.error("Error fetching archived data:", e);
      setError('حدث خطأ أثناء جلب البيانات المؤرشفة. قد تحتاج بعض الاستعلامات إلى فهارس خاصة في Firestore.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
      if (user) {
        fetchArchivedData();
      }
  }, [user, fetchArchivedData]);

  const handleRestore = async (path: string) => {
    try {
      await updateDoc(doc(db, path), { archived: false });
      fetchArchivedData(); // Refresh data
    } catch (e) {
      console.error(e);
      // Show error to user
    }
  };

  const openDeleteDialog = (path: string, id: string) => {
    setSelectedItem({ path, id });
    setDialogOpen(true);
  };
  
  const handlePermanentDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteDoc(doc(db, selectedItem.path));
      fetchArchivedData(); // Refresh data
    } catch (e) {
      console.error(e);
    } finally {
      setDialogOpen(false);
      setSelectedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p className="mt-4 text-center">{error}</p>
      </div>
    );
  }

  const hasData = Object.keys(archivedData).length > 0 && Object.values(archivedData).some(arr => arr.length > 0);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>الأرشيف</CardTitle>
          <CardDescription>
            عرض واستعادة وحذف البيانات التي تمت أرشفتها من التطبيق بشكل نهائي.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-muted-foreground text-center py-8">
              الأرشيف فارغ حاليًا.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(archivedData).map(([collectionId, items]) => {
                if(items.length === 0) return null;
                const config = COLLECTION_CONFIG[collectionId];
                if (!config) return null;
                return (
                  <AccordionItem value={collectionId} key={collectionId}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span>{config.name}</span>
                        <Badge variant="secondary">{items.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {items.map((item) => (
                          <div key={item.id} className="p-4 border rounded-lg bg-muted/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {config.fields.map(field => (
                                    <div key={field}>
                                        <p className="font-semibold text-muted-foreground capitalize">{field}</p>
                                        <p>{formatValue(field, item[field])}</p>
                                    </div>
                                ))}
                                <div>
                                    <p className="font-semibold text-muted-foreground">تاريخ الأرشفة</p>
                                    <p>{formatDate(item.createdAt || item.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                                <Button size="sm" variant="outline" onClick={() => handleRestore(item.path)}>
                                    <RotateCcw className="h-4 w-4 ml-2" />
                                    استعادة
                                </Button>

                                <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(item.path, item.id)}>
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف نهائي
                                </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تأكيد الحذف النهائي</DialogTitle>
                <DialogDesc>
                    هل أنت متأكد من رغبتك في حذف هذا العنصر بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
                </DialogDesc>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">إلغاء</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handlePermanentDelete}>
                    تأكيد الحذف
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// --- Sub-page Components ---

function ProfileView() {
  const [user, loading] = useAuthState(auth);
  const [isSaving, setIsSaving] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [publicInfo, setPublicInfo] = useState('');
  const [privateInfo, setPrivateInfo] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isGoogleLinked = useMemo(
    () =>
      user?.providerData.some(
        (p) => p.providerId === GoogleAuthProvider.PROVIDER_ID
      ),
    [user]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFarmName(data.farmName || '');
        setPublicInfo(data.publicInfo || '');
        setPrivateInfo(data.privateInfo || '');
      }
    };

    if (user) {
      setDisplayName(user.displayName || '');
      fetchProfile();
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(
        docRef,
        {
          farmName,
          publicInfo,
          privateInfo,
        },
        { merge: true }
      );
      toast({
        title: 'تم الحفظ بنجاح!',
        description: 'تم تحديث معلومات ملفك الشخصي.',
        className: 'bg-green-600 text-white',
      });
    } catch (error) {
      console.error('Error saving profile: ', error);
      toast({
        title: 'خطأ',
        description: 'لم نتمكن من حفظ التغييرات.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkWithGoogle = async () => {
    if (!auth.currentUser) return;
    setIsLinking(true);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      toast({
        title: 'تم الربط بنجاح!',
        description: 'تم ربط حسابك مع جوجل.',
        className: 'bg-green-600 text-white',
      });
    } catch (error: any) {
      console.error('Error linking with Google: ', error);
      let description = 'حدث خطأ غير متوقع.';
      if (error.code === 'auth/credential-already-in-use') {
        description = 'حساب جوجل هذا مرتبط بالفعل بحساب آخر.';
      }
      toast({
        title: 'فشل الربط',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleNameChange = async () => {
    if (!user || !displayName.trim()) {
      toast({
        title: 'خطأ',
        description: 'لا يمكن ترك الاسم فارغًا.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingName(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      const docRef = doc(db, 'users', user.uid);
      await setDoc(
        docRef,
        { displayName: displayName.trim() },
        { merge: true }
      );

      toast({
        title: 'تم تحديث الاسم!',
        description: 'لقد تم تغيير اسمك المعروض بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: 'خطأ',
        description: 'لم نتمكن من تحديث اسمك.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || !event.target.files[0] || !user) {
      return;
    }
    const file = event.target.files[0];
    setIsUploading(true);

    try {
      // 1. Upload file to Storage
      const filePath = `users/${user.uid}/profile-picture/${file.name}`;
      const fileRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(fileRef, file);

      // 2. Get download URL
      const photoURL = await getDownloadURL(uploadResult.ref);

      // 3. Update Firebase Auth profile
      await updateProfile(user, { photoURL });

      // 4. Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { photoURL, photoPath: filePath }, { merge: true });

      toast({
        title: 'تم تحديث الصورة',
        description: 'تم تغيير صورتك الشخصية بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'خطأ في رفع الصورة',
        description: 'لم نتمكن من تحديث صورتك الشخصية. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

   const handleRemoveImage = async () => {
    if (!user) return;
    setIsUploading(true);

    try {
      // 1. Delete image from Storage if path exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const photoPath = userDoc.data()?.photoPath;

      if (photoPath) {
        const imageRef = ref(storage, photoPath);
        await deleteObject(imageRef).catch((e) => console.warn("Could not delete old photo, it might not exist", e));
      }
      
      // 2. Update Auth and Firestore to remove URL
      await updateProfile(user, { photoURL: '' });
      await setDoc(userDocRef, { photoURL: '', photoPath: '' }, { merge: true });

      toast({
        title: "تمت إزالة الصورة",
        description: "تم حذف صورتك الشخصية.",
        className: "bg-green-600 text-white"
      });

    } catch (error) {
      console.error("Error removing profile picture:", error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من إزالة صورتك الشخصية.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/gif"
                className="hidden"
              />
               <div className="relative w-20 h-20">
                    {user?.photoURL ? (
                        <Image
                        src={user.photoURL}
                        alt={user.displayName || 'صورة المستخدم'}
                        width={80}
                        height={80}
                        className="rounded-full object-cover w-20 h-20"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                        <UserCircle className="w-12 h-12 text-muted-foreground" />
                        </div>
                    )}
                     <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 rounded-full text-white hover:bg-black/50"
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreVertical className="h-5 w-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                                    <Camera className="h-4 w-4 ml-2" />
                                    <span>تغيير الصورة</span>
                                </DropdownMenuItem>
                                {user?.photoURL && (
                                    <DropdownMenuItem onClick={handleRemoveImage} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 ml-2" />
                                        <span>إزالة الصورة</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            <div className="flex-1">
              <div className="space-y-2">
                <Label htmlFor="display-name">الاسم المعروض</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Button
                    size="icon"
                    onClick={handleNameChange}
                    disabled={
                      isSavingName ||
                      !displayName ||
                      displayName === user?.displayName
                    }
                  >
                    {isSavingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
          <div>
            <Label htmlFor="user-uid" className="text-xs">
              معرف المستخدم الخاص بك (للمشرف)
            </Label>
            <Input
              id="user-uid"
              readOnly
              value={user?.uid || ''}
              className="text-xs h-8 mt-1 cursor-pointer"
              onClick={(e) => {
                (e.target as HTMLInputElement).select();
                navigator.clipboard.writeText(user?.uid || '');
                toast({ title: 'تم نسخ المعرف' });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="farm-name">اسم المزرعة (عام)</Label>
            <Input
              id="farm-name"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="مثال: مزرعة الأمل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public-info">معلومات عامة (تظهر للجميع)</Label>
            <Textarea
              id="public-info"
              value={publicInfo}
              onChange={(e) => setPublicInfo(e.target.value)}
              placeholder="وصف قصير عن المزرعة أو المنتجات..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="private-info">ملاحظات خاصة (تظهر لك فقط)</Label>
            <Textarea
              id="private-info"
              value={privateInfo}
              onChange={(e) => setPrivateInfo(e.target.value)}
              placeholder="أرقام هواتف، أو أي معلومات خاصة..."
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            <span>
              {isSaving ? 'جاري الحفظ...' : 'حفظ المعلومات الإضافية'}
            </span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الحسابات المرتبطة</CardTitle>
        </CardHeader>
        <CardContent>
          {isGoogleLinked ? (
            <div className="flex items-center text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
              <GoogleIcon className="h-5 w-5 ml-3" />
              <span>حسابك مرتبط مع جوجل.</span>
            </div>
          ) : (
            <Button
              onClick={handleLinkWithGoogle}
              disabled={isLinking}
              variant="outline"
              className="w-full"
            >
              {isLinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              <span className="mr-2">
                {isLinking ? 'جاري الربط...' : 'ربط مع حساب جوجل'}
              </span>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GeneralSettingsView() {
  const [language, setLanguage] = useState('ar');
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>المظهر</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>اللغة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language-select">اختر لغة التطبيق</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language-select">
                <SelectValue placeholder="اختر لغة..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en" disabled>
                  English (قريبا)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <Label htmlFor="task-notifications" className="flex-1">
              إشعارات المهام
            </Label>
            <Toggle
              id="task-notifications"
              pressed={taskNotifications}
              onPressedChange={setTaskNotifications}
              aria-label="Toggle task notifications"
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <Label htmlFor="sales-notifications" className="flex-1">
              إشعارات المبيعات
            </Label>
            <Toggle
              id="sales-notifications"
              pressed={salesNotifications}
              onPressedChange={setSalesNotifications}
              aria-label="Toggle sales notifications"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الأمان</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">كلمة المرور الحالية</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <Input id="new-password" type="password" />
          </div>
          <Button className="w-full" disabled>
            تحديث كلمة المرور (قريبا)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminView({ user }: { user: any }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [targetUid, setTargetUid] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [ads, setAds] = useState<string[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [newAd, setNewAd] = useState('');
  const adMarqueeRef = useMemo(() => doc(db, 'siteContent', 'adMarquee'), []);

  const fetchAds = useCallback(async () => {
    setAdsLoading(true);
    try {
      const docSnap = await getDoc(adMarqueeRef);
      if (docSnap.exists()) {
        setAds(docSnap.data().ads || []);
      } else {
        setAds([]);
      }
    } catch (e) {
      console.error("Error fetching ads:", e);
      toast({ title: 'خطأ في جلب الإعلانات', variant: 'destructive'});
      setAds([]);
    } finally {
      setAdsLoading(false);
    }
  }, [adMarqueeRef]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);


  const handleSendNotification = async () => {
    if (!title || !body) {
      toast({
        title: 'خطأ',
        description: 'الرجاء ملء حقل العنوان والرسالة.',
        variant: 'destructive',
      });
      return;
    }
    if (target === 'specific' && !targetUid) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال معرف المستخدم المستهدف.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
       const notificationData = {
        title,
        body,
        target: target === 'all' ? ['all'] : [targetUid.trim(), 'all'], // Always include 'all' for broader queries if needed, or adjust as necessary. Here we send to specific and it will be caught by their UID. Let's send to an array.
        createdAt: serverTimestamp(),
        read: false,
      };

      if (target === 'specific') {
        notificationData.target = [targetUid.trim()];
      } else {
        notificationData.target = ['all', 'admin']; // Example: send to all and admins
      }

      await addDoc(collection(db, 'notifications'), notificationData);
      
      toast({
        title: 'تم الإرسال بنجاح',
        description: 'تم إرسال الإشعار للمستخدمين المستهدفين.',
        className: 'bg-green-600 text-white',
      });
      setTitle('');
      setBody('');
      setTargetUid('');
    } catch (e: any) {
      toast({
        title: 'خطأ في الإرسال',
        description: e.message || 'لم نتمكن من إرسال الإشعار.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAddAd = async () => {
    if (!newAd.trim()) return;
    try {
      await updateDoc(adMarqueeRef, { ads: arrayUnion(newAd.trim()) });
      setAds(prevAds => [...prevAds, newAd.trim()]);
      setNewAd('');
      toast({
        title: 'تمت الإضافة بنجاح',
        description: 'تمت إضافة الإعلان إلى الشريط المتحرك.',
        className: 'bg-green-600 text-white',
      });
    } catch (e: any) {
       if (e.code === 'not-found') {
            await setDoc(adMarqueeRef, { ads: [newAd.trim()] });
            setAds([newAd.trim()]);
            setNewAd('');
            toast({
                title: 'تمت الإضافة بنجاح',
                description: 'تمت إضافة الإعلان إلى الشريط المتحرك.',
                className: 'bg-green-600 text-white',
            });
        } else {
            console.error('Error adding ad:', e);
            toast({
                title: 'خطأ في إضافة الإعلان',
                description: e.message || 'فشلت إضافة الإعلان.',
                variant: 'destructive',
            });
        }
    }
  };

  const handleRemoveAd = async (adToRemove: string) => {
    try {
        await updateDoc(adMarqueeRef, {
            ads: arrayRemove(adToRemove)
        });
        setAds(prevAds => prevAds.filter(ad => ad !== adToRemove));
        toast({ title: 'تم حذف الإعلان' });
    } catch (e: any) {
        console.error('Error removing ad:', e);
        toast({ title: 'خطأ في حذف الإعلان', description: e.message, variant: 'destructive'});
    }
  }

  return (
    <div className="space-y-8">
    <Card>
      <CardHeader>
        <CardTitle>إرسال إشعار للمستخدمين</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notif-title">عنوان الإشعار</Label>
          <Input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: صيانة مجدولة"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notif-body">نص الإشعار</Label>
          <Textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="تفاصيل الرسالة..."
          />
        </div>
        <div className="space-y-2">
          <Label>المستلم</Label>
          <Select value={target} onValueChange={(v: any) => setTarget(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستخدمين</SelectItem>
              <SelectItem value="specific">مستخدم محدد</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {target === 'specific' && (
          <div className="space-y-2">
            <Label htmlFor="notif-uid">معرف المستخدم (UID)</Label>
            <Input
              id="notif-uid"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              placeholder="أدخل معرف المستخدم هنا"
            />
          </div>
        )}
        <Button
          onClick={handleSendNotification}
          disabled={isSending}
          className="w-full"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <Send className="w-4 h-4 ml-2" />
          )}
          {isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </Button>
      </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>التحكم في شريط الإعلانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             {adsLoading ? (
                 <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                 </div>
             ): (
                 <div className="space-y-2">
                    <Label>الإعلانات الحالية</Label>
                    {ads.length > 0 ? (
                        <div className="space-y-2 rounded-md border p-2">
                            {ads.map((ad, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                                    <p className="text-sm flex-1">{ad}</p>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveAd(ad)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-4">لا توجد إعلانات حاليًا.</p>
                    )}
                 </div>
             )}
             <div className="space-y-2 pt-4">
                <Label htmlFor="new-ad">إضافة إعلان جديد</Label>
                <div className="flex gap-2">
                    <Input id="new-ad" value={newAd} onChange={(e) => setNewAd(e.target.value)} placeholder="نص الإعلان..."/>
                    <Button onClick={handleAddAd} disabled={!newAd.trim()}>
                        <Plus className="h-4 w-4 ml-2"/>
                        إضافة
                    </Button>
                </div>
             </div>
        </CardContent>
    </Card>
    </div>
  );
}

// --- Main Page Component ---

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { isAdmin, loading: adminLoading } = useAdmin();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const tabs = useMemo(() => {
    const baseTabs = [
      { value: 'profile', label: 'الملف الشخصي', icon: UserCircle },
      { value: 'settings', label: 'الإعدادات العامة', icon: Settings },
      { value: 'archive', label: 'الأرشيف', icon: Archive },
    ];
    if (isAdmin) {
      baseTabs.push({ value: 'admin', label: 'لوحة التحكم', icon: UserCog });
    }
    return baseTabs;
  }, [isAdmin]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <GeneralSettingsView />;
      case 'archive':
        return <ArchiveView user={user} />;
      case 'admin':
        return isAdmin ? <AdminView user={user} /> : null;
      default:
        return <ProfileView />;
    }
  }, [activeTab, user, isAdmin]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
          <p className="mt-1 text-muted-foreground">
            قم بتخصيص إعدادات التطبيق والمزرعة.
          </p>
        </div>
        <Link href="/home">
          <Button variant="outline">
            <Home className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <nav className="flex flex-col space-y-2">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.value)}
                className="w-full justify-start"
              >
                <tab.icon className="h-5 w-5 ml-3" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </aside>

        <main className="md:col-span-3">
          {loading || adminLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      <Card>
        <CardContent className="p-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 ml-2" />
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
