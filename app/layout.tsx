import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'The Archive — Daniel Mekhail', description: 'A digital museum of software, systems, and ideas. An interactive portfolio prototype by Daniel Mekhail.' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
