"use client";

import * as React from "react";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return ctx;
}

export interface DropdownMenuProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dir?: "ltr" | "rtl";
  modal?: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent | MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  const value = React.useMemo(() => ({ open, setOpen, triggerRef, contentRef }), [open, setOpen]);

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};
DropdownMenu.displayName = "DropdownMenu";

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, children, onClick, className, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useDropdownMenuContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        setOpen(!open);
      }
    };

    const handleRef = (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        ref: handleRef,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "data-state": open ? "open" : "closed",
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          child.props?.onClick?.(e);
          if (!e.defaultPrevented) {
            setOpen(!open);
          }
        },
      });
    }

    return (
      <button
        ref={handleRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        onClick={handleClick}
        className={cn("outline-none", className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("py-1", className)} {...props} />,
);
DropdownMenuGroup.displayName = "DropdownMenuGroup";

const DropdownMenuPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
DropdownMenuPortal.displayName = "DropdownMenuPortal";

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", sideOffset = 4, style, children, ...props }, forwardedRef) => {
    const { open, contentRef } = useDropdownMenuContext();

    const handleRef = (node: HTMLDivElement | null) => {
      (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    if (!open) return null;

    const alignClass =
      align === "start" ? "left-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "right-0";

    return (
      <div
        ref={handleRef}
        role="menu"
        tabIndex={-1}
        style={{ marginTop: sideOffset, ...style }}
        className={cn(
          "absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          alignClass,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, onClick, disabled, children, ...props }, ref) => {
    const { setOpen } = useDropdownMenuContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
      if (!e.defaultPrevented) {
        setOpen(false);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-left",
          inset && "pl-8",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export interface DropdownMenuCheckboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const DropdownMenuCheckboxItem = React.forwardRef<HTMLButtonElement, DropdownMenuCheckboxItemProps>(
  ({ className, children, checked, onCheckedChange, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenuContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        onCheckedChange?.(!checked);
        setOpen(false);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="menuitemcheckbox"
        aria-checked={checked}
        onClick={handleClick}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-left",
          className,
        )}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {checked && <Check className="h-4 w-4" />}
        </span>
        {children}
      </button>
    );
  },
);
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

interface RadioGroupContextValue {
  value?: string | undefined;
  onValueChange?: ((val: string) => void) | undefined;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

const DropdownMenuRadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (val: string) => void;
  }
>(({ value, onValueChange, children, ...props }, ref) => (
  <RadioGroupContext.Provider value={{ value, onValueChange }}>
    <div ref={ref} role="group" {...props}>
      {children}
    </div>
  </RadioGroupContext.Provider>
));
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup";

export interface DropdownMenuRadioItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const DropdownMenuRadioItem = React.forwardRef<HTMLButtonElement, DropdownMenuRadioItemProps>(
  ({ className, children, value, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenuContext();
    const groupCtx = React.useContext(RadioGroupContext);
    const checked = groupCtx?.value === value;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        groupCtx?.onValueChange?.(value);
        setOpen(false);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="menuitemradio"
        aria-checked={checked}
        onClick={handleClick}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-left",
          className,
        )}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {checked && <Circle className="h-2 w-2 fill-current" />}
        </span>
        {children}
      </button>
    );
  },
);
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

const DropdownMenuSub: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="relative">{children}</div>;
};
DropdownMenuSub.displayName = "DropdownMenuSub";

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4" />
  </button>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
