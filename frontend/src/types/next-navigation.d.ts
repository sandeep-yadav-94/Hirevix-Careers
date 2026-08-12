declare module 'next/navigation' {
  export function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    refresh: () => void;
    back: () => void;
    forward: () => void;
    prefetch?: (href: string) => Promise<void>;
  };

  export function useParams(): Record<string, string | string[] | undefined>;
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}
