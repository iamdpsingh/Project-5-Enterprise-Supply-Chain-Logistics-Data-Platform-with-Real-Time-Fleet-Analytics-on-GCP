import './globals.css';

export const metadata = {
  title: 'Supply Chain Control Tower | Enterprise Data Platform',
  description: 'Real-time fleet, logistics & supply chain analytics powered by GCP BigQuery and Firestore.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
