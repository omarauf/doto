import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
};

export function FormCard({ title, children, className, icon: Icon, description }: Props) {
  return (
    <Card className="rounded-3xl border-slate-200 bg-background shadow-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 text-xl">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
        {description && <p className="text-slate-500 text-sm">{description}</p>}
      </CardHeader>

      <CardContent className={className}>{children}</CardContent>
    </Card>
  );
}
