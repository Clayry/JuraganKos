import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'JuraganKos — Kelola kos, lebih beres.',description:'Manajemen kamar, penghuni, dan pembayaran sewa dalam satu tempat.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id"><body>{children}</body></html>}
