import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  to?: string;
  label?: string;
  className?: string;
}

/**
 * Reusable back navigation chip.
 * - If `to` is provided, navigates to that route via <Link>.
 * - Otherwise, uses history back (-1).
 */
const BackLink = ({ to, label, className }: BackLinkProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const text = label ?? (to === "/" ? t("common.backHome") : t("common.back"));

  const baseClasses = cn(
    "inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card/60",
    "text-sm text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border/80",
    "transition-all duration-200 backdrop-blur-sm",
    "group",
    className,
  );

  const content = (
    <>
      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span className="font-medium">{text}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={baseClasses} aria-label={text}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={() => navigate(-1)} className={baseClasses} aria-label={text}>
      {content}
    </button>
  );
};

export default BackLink;
