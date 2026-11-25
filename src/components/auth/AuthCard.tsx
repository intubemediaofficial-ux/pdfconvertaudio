import Link from "next/link";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="tool-container !max-w-md">
      <div className="text-center mb-7">
        <h1 className="page-title mb-2">{title}</h1>
        {subtitle && <p className="text-gray-500">{subtitle}</p>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-purple-500/5 p-6 sm:p-8">{children}</div>
      {footer && <div className="mt-5 text-center text-sm text-gray-600">{footer}</div>}
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>
      <input className="input-field" {...props} />
    </label>
  );
}

export function FormError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{msg}</p>;
}

export function FormNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{msg}</p>;
}

export function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="btn-primary w-full !text-base !py-3.5 !px-6 disabled:opacity-60">
      {busy ? "Please wait…" : children}
    </button>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-semibold text-pink-600 hover:underline">{children}</Link>;
}
