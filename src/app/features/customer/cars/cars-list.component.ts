import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cars-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Section -->
    <section class="relative">
      <!-- Decorative Background -->
      <div class="absolute inset-0 bg-brand-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-brand-900/40">
        <!-- Glow effects -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,_rgba(99,102,241,0.25),transparent)]"></div>
        <div class="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-brand-400/10 rounded-full blur-[100px]"></div>
        
        <!-- Subtle Pattern -->
        <svg class="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
           <path d="M0 100 L100 0" stroke="white" stroke-width="0.2" />
           <path d="M0 80 L80 0" stroke="white" stroke-width="0.2" />
           <path d="M20 100 L100 20" stroke="white" stroke-width="0.2" />
        </svg>
      </div>

      <div class="relative py-28 md:py-36 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <h1 class="text-6xl md:text-8xl font-black tracking-tight text-white leading-tight mb-8">
          Find Your <span class="text-brand-400">Perfect</span> Ride
        </h1>
        <p class="text-brand-100/80 text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed">
          Premium car rental experience for your next journey. Clean, fast, and reliable.
        </p>
      </div>
    </section>

    <!-- Search Bar (Negative Margin Positioning) -->
    <div class="relative z-50 -mt-16 mx-auto w-[96%] max-w-6xl bg-white rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.3)] p-4 md:p-6 border border-slate-100 mb-16">
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        <!-- Location Input -->
        <div class="flex-[1.4] p-6 group transition-all duration-300 hover:bg-slate-50/80 first:rounded-t-[2.5rem] lg:first:rounded-l-[2.5rem] lg:first:rounded-tr-none">
          <label class="block text-xs font-black text-brand-600 uppercase tracking-[0.25em] mb-4">Location</label>
          <div class="relative flex items-center">
            <div class="absolute left-0 w-12 h-12 bg-brand-100/50 rounded-2xl flex items-center justify-center text-brand-600 transition-all group-hover:bg-brand-600 group-hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <input type="text" class="w-full bg-transparent border-none focus:ring-0 text-slate-900 text-2xl font-bold pl-16 placeholder:text-slate-300" placeholder="Where to?">
          </div>
        </div>

        <!-- Dates -->
        <div class="flex-[1.8] flex divide-x divide-slate-100 h-full">
          <div class="flex-1 p-6 transition-all duration-300 hover:bg-slate-50/80">
            <label class="block text-xs font-black text-brand-600 uppercase tracking-[0.25em] mb-4">Pick-up</label>
            <div class="relative flex items-center">
              <div class="absolute left-0 text-slate-400 group-hover:text-brand-500 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>
              </div>
              <input type="date" class="w-full bg-transparent border-none focus:ring-0 text-slate-900 text-lg font-bold pl-10 cursor-pointer min-h-[48px]">
            </div>
          </div>
          <div class="flex-1 p-6 transition-all duration-300 hover:bg-slate-50/80 last:rounded-b-[2.5rem] lg:last:rounded-br-[2.5rem] lg:last:rounded-tr-none">
            <label class="block text-xs font-black text-brand-600 uppercase tracking-[0.25em] mb-4">Drop-off</label>
            <div class="relative flex items-center">
              <div class="absolute left-0 text-slate-400 group-hover:text-brand-500 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>
              </div>
              <input type="date" class="w-full bg-transparent border-none focus:ring-0 text-slate-900 text-lg font-bold pl-10 cursor-pointer min-h-[48px]">
            </div>
          </div>
        </div>

        <!-- Button -->
        <div class="p-4 lg:p-6 flex items-center justify-center">
          <button class="w-full lg:w-48 bg-brand-600 hover:bg-brand-700 text-white px-8 py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-brand-500/40 transition-all duration-300 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Search
          </button>
        </div>
      </div>
    </div>

    <!-- Filters & Header -->
    <div class="mb-6 flex items-center justify-between">
       <h2 class="text-2xl font-semibold text-slate-900">Available Cars</h2>
       <button class="btn-secondary gap-2 hidden sm:flex">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
          Filters
       </button>
    </div>

    <!-- Cars Grid -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      
      <!-- Car Card 1 -->
      <article class="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
        <div class="relative h-56 bg-slate-100 overflow-hidden cursor-pointer group" routerLink="/cars/1">
          <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=600&q=80" alt="BMW 4 Series" class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110">
          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
            Auto
          </div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-1.5 rounded-full text-slate-500 shadow-sm hover:text-rose-500 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
        </div>
        <div class="p-6 flex flex-col flex-1">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900 mb-1 leading-tight"><a routerLink="/cars/1" class="hover:text-brand-600 transition-colors">BMW 4 Series</a></h3>
            <p class="text-sm font-medium text-slate-500">Luxury Coupe</p>
          </div>
          
          <div class="flex items-center gap-4 text-sm text-slate-600 mb-6 py-4 border-y border-slate-100">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 
              <span class="font-medium">4 Seats</span>
            </div>
            <div class="w-1 h-1 rounded-full bg-slate-300"></div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 
              <span class="font-medium">Petrol</span>
            </div>
          </div>

          <div class="mt-auto flex items-end justify-between">
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Price</span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-slate-900">$120</span>
                <span class="text-sm font-medium text-slate-500">/day</span>
              </div>
            </div>
            <a routerLink="/cars/1" class="px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg">Rent</a>
          </div>
        </div>
      </article>
      
      <!-- Car Card 2 -->
      <article class="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
        <div class="relative h-56 bg-slate-100 overflow-hidden cursor-pointer group" routerLink="/cars/2">
          <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80" alt="Ford Mustang" class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110">
          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
            Manual
          </div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-1.5 rounded-full text-slate-500 shadow-sm hover:text-rose-500 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
        </div>
        <div class="p-6 flex flex-col flex-1">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900 mb-1 leading-tight"><a routerLink="/cars/2" class="hover:text-brand-600 transition-colors">Ford Mustang</a></h3>
            <p class="text-sm font-medium text-slate-500">Sports Coupe</p>
          </div>
          
          <div class="flex items-center gap-4 text-sm text-slate-600 mb-6 py-4 border-y border-slate-100">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 
              <span class="font-medium">4 Seats</span>
            </div>
            <div class="w-1 h-1 rounded-full bg-slate-300"></div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 
              <span class="font-medium">Petrol</span>
            </div>
          </div>

          <div class="mt-auto flex items-end justify-between">
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Price</span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-slate-900">$150</span>
                <span class="text-sm font-medium text-slate-500">/day</span>
              </div>
            </div>
            <a routerLink="/cars/2" class="px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg">Rent</a>
          </div>
        </div>
      </article>

      <!-- Car Card 3 -->
      <article class="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative border-b-4 border-b-brand-500">
        <!-- Optional: Top highlight for premium cars -->
        <div class="absolute top-0 right-0 z-10 w-24 h-24 overflow-hidden pointer-events-none">
           <div class="absolute top-4 -right-8 w-32 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 text-center transform rotate-45 shadow-sm">Premium</div>
        </div>
        
        <div class="relative h-56 bg-slate-100 overflow-hidden cursor-pointer group" routerLink="/cars/3">
          <img src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=80" alt="Tesla Model 3" class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110">
          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
            Auto
          </div>
        </div>
        <div class="p-6 flex flex-col flex-1">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900 mb-1 leading-tight"><a routerLink="/cars/3" class="hover:text-brand-600 transition-colors">Tesla Model 3</a></h3>
            <p class="text-sm font-medium text-slate-500">Electric Sedan</p>
          </div>
          
          <div class="flex items-center gap-4 text-sm text-slate-600 mb-6 py-4 border-y border-slate-100">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 
              <span class="font-medium">5 Seats</span>
            </div>
            <div class="w-1 h-1 rounded-full bg-slate-300"></div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 
              <span class="font-medium text-emerald-600">Electric</span>
            </div>
          </div>

          <div class="mt-auto flex items-end justify-between">
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Price</span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-slate-900">$180</span>
                <span class="text-sm font-medium text-slate-500">/day</span>
              </div>
            </div>
            <a routerLink="/cars/3" class="px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg">Rent</a>
          </div>
        </div>
      </article>

    </div>
  `
})
export class CarsListComponent {}
