import { forwardRef, type ReactNode } from "react";
import { Surface, type SurfaceProps } from "./Surface";

export interface CardProps extends SurfaceProps {
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { header, footer, children, className = "", padding = "md", ...rest },
  ref,
) {
  if (!header && !footer) {
    return (
      <Surface ref={ref} padding={padding} className={className} {...rest}>
        {children}
      </Surface>
    );
  }
  return (
    <Surface ref={ref} padding="none" className={className} {...rest}>
      {header && (
        <div className="flex items-center justify-between gap-3 px-[1rem] pt-[1rem] pb-[0.75rem]">
          {header}
        </div>
      )}
      <div className="px-[1rem] pb-[1rem]">{children}</div>
      {footer && (
        <div className="border-t border-[color:var(--color-border)] px-[1rem] py-[0.75rem]">
          {footer}
        </div>
      )}
    </Surface>
  );
});
