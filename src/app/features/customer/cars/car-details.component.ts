import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6 flex space-x-2 text-sm text-slate-500">
      <a routerLink="/cars" class="hover:text-brand-600 transition">Cars</a>
      <span>/</span>
      <span class="text-slate-900 font-medium">Mercedes C-Class</span>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      
      <!-- Left Column: Gallery & Details -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- Image Gallery -->
        <div class="space-y-4">
          <div class="aspect-[16/9] md:aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200 cursor-zoom-in">
            <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1200&q=80" alt="Car showcase" class="w-full h-full object-cover">
          </div>
          <!-- Thumbnails -->
          <div class="grid grid-cols-4 gap-4">
            <div class="aspect-[4/3] rounded-xl overflow-hidden hover:opacity-80 transition cursor-pointer border-2 border-brand-600">
              <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=300&q=80" alt="Thumb" class="w-full h-full object-cover">
            </div>
            <div class="aspect-[4/3] rounded-xl overflow-hidden hover:opacity-80 transition cursor-pointer border border-slate-200">
              <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80" alt="Thumb" class="w-full h-full object-cover grayscale opacity-50">
            </div>
            <div class="aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition">
              <span class="text-slate-500 text-sm font-medium">+3 Photos</span>
            </div>
          </div>
        </div>

        <!-- Car Info -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 class="text-3xl font-bold text-slate-900 mb-2">Mercedes C-Class 2024</h1>
              <p class="text-slate-500 text-lg">Luxury Sedan</p>
            </div>
            <span class="bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1 rounded-full filter drop-shadow-sm border border-emerald-200 whitespace-nowrap">Available</span>
          </div>

          <!-- Specs List -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-100 mb-8">
            <div class="flex flex-col gap-1">
               <span class="text-slate-400 text-xs uppercase tracking-wider font-semibold">Transmission</span>
               <span class="text-slate-800 font-medium flex items-center gap-2">
                 <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                 Automatic
               </span>
            </div>
            <div class="flex flex-col gap-1">
               <span class="text-slate-400 text-xs uppercase tracking-wider font-semibold">Seats</span>
               <span class="text-slate-800 font-medium flex items-center gap-2">
                 <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                 5 Adults
               </span>
            </div>
            <div class="flex flex-col gap-1">
               <span class="text-slate-400 text-xs uppercase tracking-wider font-semibold">Fuel</span>
               <span class="text-slate-800 font-medium flex items-center gap-2">
                 <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 Petrol
               </span>
            </div>
            <div class="flex flex-col gap-1">
               <span class="text-slate-400 text-xs uppercase tracking-wider font-semibold">Mileage</span>
               <span class="text-slate-800 font-medium flex items-center gap-2">
                 <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                 Unlimited
               </span>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-xl font-bold text-slate-900">Description</h3>
            <p class="text-slate-600 leading-relaxed">
              Experience the pinnacle of luxury with our Mercedes C-Class. Featuring a sumptuous interior, cutting-edge technology, and a smooth, powerful ride. Perfect for business trips, special occasions, or simply enjoying the journey in utmost comfort.
            </p>
          </div>
          
          <!-- Rental Terms Accordion (Mock) -->
          <div class="mt-8 border border-slate-200 rounded-2xl overflow-hidden">
             <button class="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition text-left">
               <span class="font-semibold text-slate-900">Rental Terms & Conditions</span>
               <svg class="w-5 h-5 text-slate-500 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
             </button>
             <div class="px-6 py-4 text-slate-600 text-sm leading-relaxed border-t border-slate-200 bg-white">
               • Minimum age requirement is 21 years.<br>
               • A valid driver's license held for at least 1 year is required.<br>
               • Security deposit is blocked on your credit card at pick-up.<br>
               • Insurance is included in the base price (excess applies).
             </div>
          </div>

        </div>
      </div>

      <!-- Right Column: Sticky Summary & CTA -->
      <div class="lg:col-span-1">
        <div class="sticky top-24 bg-white rounded-3xl shadow-card border border-slate-200 p-6 sm:p-8">
          <div class="pb-6 border-b border-slate-100">
            <span class="text-sm font-semibold text-brand-600 tracking-wider uppercase">Price</span>
            <div class="text-4xl font-bold text-slate-900 mt-1">$120<span class="text-lg text-slate-500 font-normal">/day</span></div>
          </div>
          
          <div class="py-6 space-y-4">
             <div>
               <label class="label text-slate-700 text-xs uppercase tracking-wide">Pick-up</label>
               <input type="datetime-local" class="input bg-slate-50">
             </div>
             <div>
               <label class="label text-slate-700 text-xs uppercase tracking-wide">Drop-off</label>
               <input type="datetime-local" class="input bg-slate-50">
             </div>
          </div>
          
          <div class="pt-6 border-t border-slate-100 mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-slate-600">Subtotal (3 days)</span>
              <span class="font-medium text-slate-900">$360</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-slate-600">Insurance</span>
              <span class="font-medium text-slate-900">$45</span>
            </div>
            <div class="flex items-center justify-between font-bold text-lg mt-4 pt-4 border-t border-slate-100">
              <span class="text-slate-900">Total</span>
              <span class="text-slate-900">$405</span>
            </div>
          </div>

          <button class="btn-primary w-full py-3 h-auto text-lg shadow-elevated hover:-translate-y-0.5 transition-transform duration-200">
            Proceed to Checkout
          </button>
          
          <p class="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure Payment
          </p>
        </div>
      </div>

    </div>
  `,
})
export class CarDetailsComponent {
  @Input() id?: string;
}
