export type Room = { id:string; number:string; type:string; floor:string; price:number; facilities:string; maintenance:boolean };
export type Tenant = { id:string; name:string; phone:string; roomId:string; start:string; active:boolean };
export type Payment = { id:string; tenantId:string; month:string; amount:number; date:string; method:string; note:string };
export type State = { rooms:Room[]; tenants:Tenant[]; payments:Payment[]; property:string; address:string };
export const money=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const monthNow=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'}).slice(0,7);
export const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
export const monthLabel=(m:string)=>new Date(m+'-02').toLocaleDateString('id-ID',{month:'long',year:'numeric'});
export function seed():State {
 const month=monthNow();
 const shiftMonth=(ym:string,delta:number)=>{const [y,m]=ym.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;};
 const rooms:Room[]=Array.from({length:20},(_,i)=>({id:'r'+i,number:(i<10?'A':'B')+String(i%10+1).padStart(2,'0'),type:i%3===0?'Deluxe':'Standard',floor:i<10?'1':'2',price:i%3===0?1500000:1000000,facilities:i%3===0?'AC, WiFi, Kamar mandi dalam':'WiFi, Lemari, Kamar mandi dalam',maintenance:i===19}));
 const names=['Aditya Pratama','Nadia Putri','Rizky Ramadhan','Salsabila Zahra','Fajar Maulana','Dinda Ayu','Kevin Alvaro','Aulia Rahma','Bagas Saputra','Citra Lestari','Dimas Saputra','Putri Amelia','Reza Fahlevi','Intan Permata','Yoga Pratama','Dewi Anggraini'];
 const starts=(i:number)=>shiftMonth(month,i<10?-6:i<12?-4:i<14?-3:-2)+'-01';
 const tenants:Tenant[]=[
  ...names.map((name,i)=>({id:'t'+i,name,phone:'08123456'+String(7800+i),roomId:'r'+i,start:starts(i),active:true})),
  {id:'t16',name:'Bima Nugraha',phone:'081234567816',roomId:'r16',start:shiftMonth(month,-6)+'-01',active:false},
  {id:'t17',name:'Sari Wulandari',phone:'081234567817',roomId:'r17',start:shiftMonth(month,-5)+'-01',active:false}
 ];
 const methods=['Transfer bank','QRIS','Tunai'];
 const payments:Payment[]=[];
 for(let offset=-5;offset<0;offset++){
  const m=shiftMonth(month,offset);
  tenants.forEach((t,i)=>{
   if(t.start.slice(0,7)<=m){
    const room=rooms[Number(t.roomId.slice(1))];
    payments.push({id:`p_${m}_${i}`,tenantId:t.id,month:m,amount:room.price,date:`${m}-${String(2+(i%4)).padStart(2,'0')}`,method:methods[(i+offset+6)%3],note:'Pembayaran sewa bulanan'});
   }
  });
 }
 tenants.forEach((t,i)=>{
  const room=rooms[Number(t.roomId.slice(1))];
  if(i<12||!t.active){
   payments.push({id:'p'+i,tenantId:t.id,month,amount:room.price,date:`${month}-${String(2+(i%3)).padStart(2,'0')}`,method:methods[i%3],note:t.active?'Pembayaran sewa bulanan':'Pelunasan sebelum checkout'});
  }else if(i===13){
   payments.push({id:'p13_part',tenantId:t.id,month,amount:500000,date:`${month}-02`,method:'QRIS',note:'Cicilan tahap 1'});
  }
 });
 return {rooms,tenants,payments,property:'Kos Griya Harmoni',address:'Jl. Kaliurang No. 18, Yogyakarta'};
}
export function bill(s:State,t:Tenant,m:string){const room=s.rooms.find(r=>r.id===t.roomId);const paid=s.payments.filter(p=>p.tenantId===t.id&&p.month===m).reduce((a,p)=>a+p.amount,0);return {room,paid,due:Math.max(0,(room?.price||0)-paid)};}
export function mutate(s:State,action:string,v:Record<string,unknown>):State {
 const str=(k:string,max=200)=>String(v[k]??'').trim().slice(0,max);const fail=(m:string):never=>{throw new Error(m)};const id=str('id')||crypto.randomUUID();
 if(action==='room'){const price=Number(v.price);if(!str('number')||!Number.isSafeInteger(price)||price<1)fail('Nomor kamar dan harga sewa yang valid wajib diisi.');if(s.rooms.some(r=>r.number.toLowerCase()===str('number').toLowerCase()&&r.id!==id))fail('Nomor kamar sudah digunakan.');if(v.maintenance&&s.tenants.some(t=>t.active&&t.roomId===id))fail('Kamar berpenghuni tidak dapat masuk perawatan.'); const old=s.rooms.find(r=>r.id===id); if(old&&old.price!==price&&s.tenants.some(t=>t.roomId===id))fail('Harga kamar yang memiliki riwayat penghuni tidak dapat diubah.');const r:Room={id,number:str('number',20),type:str('type',40),floor:str('floor',10),price,facilities:str('facilities'),maintenance:!!v.maintenance};s.rooms=[...s.rooms.filter(r=>r.id!==id),r];}
 else if(action==='deleteRoom'){if(s.tenants.some(t=>t.roomId===id))fail('Kamar memiliki riwayat penghuni dan tidak dapat dihapus.');s.rooms=s.rooms.filter(r=>r.id!==id);}
 else if(action==='tenant'){const room=s.rooms.find(r=>r.id===str('roomId'));if(!room||room.maintenance||s.tenants.some(t=>t.active&&t.roomId===room.id&&t.id!==id))fail('Kamar tidak tersedia.');if(!str('name')||!/^\+?[\d\s-]{9,18}$/.test(str('phone'))||!/^\d{4}-\d{2}-\d{2}$/.test(str('start'))||str('start')>today())fail('Periksa nama, nomor telepon, dan tanggal masuk.');const old=s.tenants.find(t=>t.id===id);if(old&&old.roomId!==room!.id)fail('Untuk pindah kamar, checkout lalu daftarkan penghuni kembali.');s.tenants=[...s.tenants.filter(t=>t.id!==id),{id,name:str('name',80),phone:str('phone',20),roomId:room!.id,start:str('start'),active:true}];}
 else if(action==='checkout'){const t=s.tenants.find(t=>t.id===id);if(!t)fail('Penghuni tidak ditemukan.');if(bill(s,t!,monthNow()).due>0)fail('Lunasi tagihan bulan berjalan sebelum checkout.');t!.active=false;}
 else if(action==='payment'){const t=s.tenants.find(t=>t.id===str('tenantId'));const amount=Number(v.amount),month=str('month');if(!t||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<t.start.slice(0,7)||!Number.isSafeInteger(amount)||amount<=0||amount>bill(s,t,month).due)fail('Nominal harus sesuai sisa tagihan dan periode tidak boleh sebelum tanggal masuk.');if(!/^\d{4}-\d{2}-\d{2}$/.test(str('date'))||str('date')>today())fail('Tanggal pembayaran tidak valid.');if(!['Transfer bank','Tunai','QRIS'].includes(str('method')))fail('Metode pembayaran tidak valid.');s.payments.push({id,tenantId:t!.id,month,amount,date:str('date'),method:str('method'),note:str('note')});}
 else if(action==='settings'){if(!str('property'))fail('Nama kos wajib diisi.');s.property=str('property',80);s.address=str('address');}
 else fail('Aksi tidak dikenali.');return s;
}
