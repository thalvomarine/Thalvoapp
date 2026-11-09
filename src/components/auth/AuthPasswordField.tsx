import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";

export function AuthTextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
}) {
  const { t } = useTranslation();
  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);

  return (
    <div>
      <label className="auth-label">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (reveal ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={"auth-field " + (isPassword ? "pr-12" : "")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            tabIndex={-1}
            aria-label={reveal ? t("auth.hide_password") : t("auth.show_password")}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/45 hover:text-white/80"
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
