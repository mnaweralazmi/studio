
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from '@/context/language-context';
import type { SalesItem, Department } from '@/lib/types';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;

const livestockListAr = ["خروف", "بقرة", "جمل", "ماعز"];
const livestockListEn = ["Sheep", "Cow", "Camel", "Goat"];

const poultryListAr = ["دجاج لاحم", "دجاج بياض", "بيض"];
const poultryListEn = ["Broiler Chicken", "Layer Chicken", "Eggs"];

const fishListAr = ["سبيطي", "هامور", "شعم"];
const fishListEn = ["Spgre", "Hamour", "Sheim"];


interface EditSaleDialogProps {
    sale: SalesItem;
    onSave: (saleId: string, data: Partial<SalesItem>) => void;
    children: React.ReactNode;
}

export function EditSaleDialog({ sale, onSave, children }: EditSaleDialogProps) {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    
    const [product, setProduct] = React.useState('');
    const [quantity, setQuantity] = React.useState(0);
    const [price, setPrice] = React.useState(0);
    const [weightPerUnit, setWeightPerUnit] = React.useState<number | undefined>(undefined);

    const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;
    const livestockList = language === 'ar' ? livestockListAr : livestockListEn;
    const poultryList = language === 'ar' ? poultryListAr : poultryListEn;
    const fishList = language === 'ar' ? fishListAr : fishListEn;

    React.useEffect(() => {
        if (isOpen) {
            setProduct(sale.product);
            setQuantity(sale.quantity);
            setPrice(sale.price);
            setWeightPerUnit(sale.weightPerUnit);
        }
    }, [isOpen, sale]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!product || quantity <= 0 || price <= 0) {
            return;
        }
        // Correctly calculate total using the current state values
        const total = quantity * price;

        onSave(sale.id, { product, quantity, price, weightPerUnit, total });
        setIsOpen(false);
    };
    
      const renderFormFields = () => {
        const commonFields = (
            <>
                <div className="space-y-2">
                    <Label htmlFor="quantity">{t('quantity')}</Label>
                    <Input id="quantity" name="quantity" type="number" step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="price">{t('unitPrice')}</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                </div>
            </>
        );

        switch(sale.departmentId) {
            case 'agriculture':
                return (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">{t('vegetableType')}</Label>
                            <Select name="product" value={product} onValueChange={setProduct} required>
                                <SelectTrigger id="product"><SelectValue placeholder={t('selectVegetable')} /></SelectTrigger>
                                <SelectContent>{vegetableList.map(veg => <SelectItem key={veg} value={veg}>{veg}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="quantity">{t('quantityInCartons')}</Label>
                            <Input id="quantity" name="quantity" type="number" step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="weightPerUnit">{t('weightPerCartonInKg')}</Label>
                            <Input id="weightPerUnit" name="weightPerUnit" type="number" step="0.1" value={weightPerUnit} onChange={(e) => setWeightPerUnit(Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="price">{t('pricePerCartonInDinar')}</Label>
                            <Input id="price" name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required/>
                        </div>
                    </div>
                )
            case 'livestock':
                 return (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">{t('animalType')}</Label>
                            <Select name="product" value={product} onValueChange={setProduct} required>
                                <SelectTrigger id="product"><SelectValue placeholder={t('selectAnimalType')} /></SelectTrigger>
                                <SelectContent>{livestockList.map(animal => <SelectItem key={animal} value={animal}>{animal}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="quantity">{t('quantityInHead')}</Label>
                            <Input id="quantity" name="quantity" type="number" step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="price">{t('pricePerHead')}</Label>
                            <Input id="price" name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required/>
                        </div>
                    </div>
                )
            case 'poultry':
                 return (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">{t('poultryType')}</Label>
                            <Select name="product" value={product} onValueChange={setProduct} required>
                                <SelectTrigger id="product"><SelectValue placeholder={t('selectPoultryType')} /></SelectTrigger>
                                <SelectContent>{poultryList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        {commonFields}
                    </div>
                )
            case 'fish':
                 return (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">{t('fishType')}</Label>
                            <Select name="product" value={product} onValueChange={setProduct} required>
                                <SelectTrigger id="product"><SelectValue placeholder={t('selectFishType')} /></SelectTrigger>
                                <SelectContent>{fishList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">{t('quantity')} ({t('kg')})</Label>
                            <Input id="quantity" name="quantity" type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="price">{t('unitPrice')} ({t('dinar')}/{t('kg')})</Label>
                            <Input id="price" name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                        </div>
                    </div>
                )
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editSale')}</DialogTitle>
                    <DialogDescription>{t('editSaleDesc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {renderFormFields()}
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit">{t('saveChanges')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
