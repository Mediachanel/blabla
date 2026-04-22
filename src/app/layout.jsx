import "./globals.css";

export const metadata = {
  title: "Sistem Informasi SDM Kesehatan DKI Jakarta",
  description: "Aplikasi internal pengelolaan data pegawai Dinas Kesehatan Provinsi DKI Jakarta"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
